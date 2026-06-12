import "server-only";
import { prisma } from "@/lib/prisma";
import { getInteligencia } from "./inteligencia";

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  emoji: string;
  desbloqueada: boolean;
}

export interface ConquistasData {
  conquistas: Conquista[];
  desbloqueadas: number;
  streakMesesPositivos: number;
  score: number;
  nivel: string;
}

export async function getConquistas(userId: string): Promise<ConquistasData> {
  const inicio24Meses = new Date(new Date().getFullYear(), new Date().getMonth() - 23, 1);

  const [
    totalMovs,
    movs24Meses,
    totalOrcamentos,
    metas,
    totalAportes,
    classesAtivos,
    inteligencia,
  ] = await Promise.all([
    prisma.movimentacao.count({ where: { userId, isDeleted: false } }),
    prisma.movimentacao.findMany({
      where: { userId, isDeleted: false, data: { gte: inicio24Meses } },
      select: { valor: true, isEntrada: true, data: true },
    }),
    prisma.orcamento.count({ where: { userId, isDeleted: false } }),
    prisma.meta.findMany({
      where: { userId, isDeleted: false },
      select: {
        valorAlvo: true,
        aportes: { where: { isDeleted: false }, select: { valor: true } },
      },
    }),
    prisma.lancamentoInvestimento.count({
      where: { userId, isDeleted: false, tipo: "aporte" },
    }),
    prisma.ativoInvestimento.findMany({
      where: { userId, isDeleted: false },
      select: { classe: true },
      distinct: ["classe"],
    }),
    getInteligencia(userId),
  ]);

  // Saldo por mês (últimos 24) para streak de meses no azul
  const porMes = new Map<string, number>();
  for (const m of movs24Meses) {
    const d = new Date(m.data);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const v = Number(String(m.valor));
    porMes.set(key, (porMes.get(key) ?? 0) + (m.isEntrada ? v : -v));
  }
  // Streak: meses consecutivos com saldo >= 0, terminando no mês passado (mês atual ainda corre)
  let streak = 0;
  const now = new Date();
  for (let i = 1; i <= 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!porMes.has(key)) break;
    if ((porMes.get(key) ?? 0) >= 0) streak++;
    else break;
  }

  const metasConcluidas = metas.filter((m) => {
    const total = m.aportes.reduce((acc, a) => acc + Number(String(a.valor)), 0);
    return total >= Number(String(m.valorAlvo));
  }).length;

  const conquistas: Conquista[] = [
    {
      id: "primeiro-passo",
      titulo: "Primeiro passo",
      descricao: "Registre sua primeira movimentação",
      emoji: "👣",
      desbloqueada: totalMovs >= 1,
    },
    {
      id: "organizado",
      titulo: "Organizado",
      descricao: "Registre 10 movimentações",
      emoji: "📋",
      desbloqueada: totalMovs >= 10,
    },
    {
      id: "centuriao",
      titulo: "Centurião",
      descricao: "Registre 100 movimentações",
      emoji: "💯",
      desbloqueada: totalMovs >= 100,
    },
    {
      id: "planejador",
      titulo: "Planejador",
      descricao: "Crie seu primeiro orçamento",
      emoji: "📐",
      desbloqueada: totalOrcamentos >= 1,
    },
    {
      id: "controlado",
      titulo: "Sob controle",
      descricao: "Feche o mês sem estourar nenhum orçamento",
      emoji: "🎯",
      desbloqueada:
        totalOrcamentos >= 1 && inteligencia.frases.some((f) => f.texto.includes("sob controle")),
    },
    {
      id: "sonhador",
      titulo: "Sonhador",
      descricao: "Crie sua primeira meta",
      emoji: "✨",
      desbloqueada: metas.length >= 1,
    },
    {
      id: "conquistador",
      titulo: "Conquistador",
      descricao: "Conclua uma meta",
      emoji: "🏆",
      desbloqueada: metasConcluidas >= 1,
    },
    {
      id: "investidor",
      titulo: "Investidor",
      descricao: "Faça seu primeiro aporte em investimentos",
      emoji: "📈",
      desbloqueada: totalAportes >= 1,
    },
    {
      id: "diversificado",
      titulo: "Diversificado",
      descricao: "Invista em 3 classes de ativos diferentes",
      emoji: "🧺",
      desbloqueada: classesAtivos.length >= 3,
    },
    {
      id: "mes-azul",
      titulo: "Mês no azul",
      descricao: "Feche um mês com saldo positivo",
      emoji: "🔵",
      desbloqueada: streak >= 1,
    },
    {
      id: "poupador-serial",
      titulo: "Poupador em série",
      descricao: "3 meses seguidos com saldo positivo",
      emoji: "🔥",
      desbloqueada: streak >= 3,
    },
    {
      id: "maratonista",
      titulo: "Maratonista",
      descricao: "6 meses seguidos com saldo positivo",
      emoji: "🏃",
      desbloqueada: streak >= 6,
    },
    {
      id: "saude-excelente",
      titulo: "Saúde de ferro",
      descricao: "Alcance saúde financeira Excelente (80+)",
      emoji: "💪",
      desbloqueada: inteligencia.score >= 80,
    },
  ];

  return {
    conquistas,
    desbloqueadas: conquistas.filter((c) => c.desbloqueada).length,
    streakMesesPositivos: streak,
    score: inteligencia.score,
    nivel: inteligencia.nivel,
  };
}

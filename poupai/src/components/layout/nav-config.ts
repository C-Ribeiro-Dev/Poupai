import {
  LayoutDashboard,
  ArrowUpDown,
  CalendarCheck,
  CalendarRange,
  LineChart,
  HelpCircle,
  Activity,
  Lightbulb,
  Sparkles,
  PiggyBank,
  Target,
  Landmark,
  CreditCard,
  TrendingUp,
  FileBarChart,
  Trophy,
  Shapes,
  Tag,
  Receipt,
  Calculator,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavConfigItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export const navItems: NavConfigItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/movimentacoes", icon: ArrowUpDown, label: "Movimentações" },
  { href: "/movimentacoes-fixas", icon: CalendarCheck, label: "Mov. Fixas" },
  { href: "/compromissos", icon: CalendarRange, label: "Compromissos" },
  { href: "/saldo-projetado", icon: LineChart, label: "Saldo Projetado" },
  { href: "/posso-fazer-isso", icon: HelpCircle, label: "Posso Fazer Isso?" },
  { href: "/situacao-financeira", icon: Activity, label: "Situação Financeira" },
  { href: "/plano-de-acao", icon: Lightbulb, label: "Plano de Ação" },
  { href: "/gastos-inteligentes", icon: Sparkles, label: "Gastos Inteligentes" },
  { href: "/orcamento", icon: PiggyBank, label: "Orçamento" },
  { href: "/metas", icon: Target, label: "Metas" },
  { href: "/contas", icon: Landmark, label: "Contas" },
  { href: "/cartoes", icon: CreditCard, label: "Cartões" },
  { href: "/investimentos", icon: TrendingUp, label: "Investimentos" },
  { href: "/dividas", icon: Receipt, label: "Dívidas" },
  { href: "/simulador", icon: Calculator, label: "Simulador" },
  { href: "/relatorios", icon: FileBarChart, label: "Relatórios" },
  { href: "/conquistas", icon: Trophy, label: "Conquistas" },
  { href: "/categorias", icon: Shapes, label: "Categorias" },
  { href: "/tipos", icon: Tag, label: "Tipos" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

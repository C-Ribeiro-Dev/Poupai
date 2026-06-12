import {
  LayoutDashboard,
  ArrowUpDown,
  CalendarCheck,
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
];

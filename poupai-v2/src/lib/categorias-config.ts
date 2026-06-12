import {
  Briefcase,
  Laptop,
  TrendingUp,
  ShoppingBag,
  PlusCircle,
  Utensils,
  Car,
  Home,
  HeartPulse,
  BookOpen,
  Gamepad2,
  ShoppingCart,
  Radio,
  Receipt,
  MinusCircle,
  Tag,
  type LucideIcon,
} from "lucide-react";

export interface IconOption {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const ICONES_DISPONIVEIS: IconOption[] = [
  { key: "briefcase", label: "Trabalho", icon: Briefcase },
  { key: "laptop", label: "Computador", icon: Laptop },
  { key: "trending-up", label: "Crescimento", icon: TrendingUp },
  { key: "shopping-bag", label: "Sacola", icon: ShoppingBag },
  { key: "plus-circle", label: "Mais", icon: PlusCircle },
  { key: "utensils", label: "Alimentação", icon: Utensils },
  { key: "car", label: "Transporte", icon: Car },
  { key: "home", label: "Casa", icon: Home },
  { key: "heart-pulse", label: "Saúde", icon: HeartPulse },
  { key: "book-open", label: "Educação", icon: BookOpen },
  { key: "gamepad-2", label: "Lazer", icon: Gamepad2 },
  { key: "shopping-cart", label: "Compras", icon: ShoppingCart },
  { key: "radio", label: "Assinaturas", icon: Radio },
  { key: "receipt", label: "Impostos", icon: Receipt },
  { key: "minus-circle", label: "Menos", icon: MinusCircle },
  { key: "tag", label: "Tag", icon: Tag },
];

export const CORES_DISPONIVEIS = [
  { key: "#22c55e", label: "Verde" },
  { key: "#3b82f6", label: "Azul" },
  { key: "#8b5cf6", label: "Roxo" },
  { key: "#f59e0b", label: "Âmbar" },
  { key: "#ef4444", label: "Vermelho" },
  { key: "#f97316", label: "Laranja" },
  { key: "#eab308", label: "Amarelo" },
  { key: "#ec4899", label: "Rosa" },
  { key: "#06b6d4", label: "Ciano" },
  { key: "#6366f1", label: "Índigo" },
  { key: "#64748b", label: "Cinza azul" },
  { key: "#6b7280", label: "Cinza" },
];

export function getCategoriaIcon(key: string): LucideIcon {
  return ICONES_DISPONIVEIS.find((i) => i.key === key)?.icon ?? Tag;
}

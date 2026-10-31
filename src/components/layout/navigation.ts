import { Calculator, Flag, Home, Settings, ShieldCheck, Upload, WalletCards } from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Visão geral", tabLabel: "Início", icon: Home },
  { href: "/transactions", label: "Transações", tabLabel: "Transações", icon: WalletCards },
  { href: "/planning", label: "Planejamento", tabLabel: "Planejar", icon: Calculator },
  { href: "/import", label: "Importar", tabLabel: "Importar", icon: Upload },
  { href: "/goals", label: "Metas", tabLabel: "Metas", icon: Flag },
  { href: "/settings", label: "Ajustes", tabLabel: "Ajustes", icon: Settings },
  { href: "/privacy", label: "Privacidade e dados", tabLabel: "Privacidade", icon: ShieldCheck }
];

export const primaryNavigationItems = navigationItems.filter(item => !["/settings", "/privacy"].includes(item.href));
export const secondaryNavigationItems = navigationItems.filter(item => ["/settings", "/privacy"].includes(item.href));

export const mobilePrimaryItems = navigationItems.slice(0, 4);

export function isNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

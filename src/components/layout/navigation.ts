import { Calculator, Flag, Home, Settings, ShieldCheck, Upload, WalletCards } from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/transactions", label: "Transações", icon: WalletCards },
  { href: "/planning", label: "Planejamento", icon: Calculator },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/goals", label: "Metas", icon: Flag },
  { href: "/settings", label: "Ajustes", icon: Settings },
  { href: "/privacy", label: "Privacidade e dados", icon: ShieldCheck }
];

export const primaryNavigationItems = navigationItems.filter(item => !["/settings", "/privacy"].includes(item.href));
export const secondaryNavigationItems = navigationItems.filter(item => ["/settings", "/privacy"].includes(item.href));

export const mobilePrimaryItems = navigationItems.slice(0, 4);

export function isNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Home, Upload, WalletCards, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/transactions", label: "Gastos", icon: WalletCards },
  { href: "/investments", label: "Invest.", icon: BriefcaseBusiness },
  { href: "/insights", label: "IA", icon: Bot }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-white/10 bg-card/75 p-1.5 shadow-glow backdrop-blur-2xl lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] transition duration-200 active:scale-95",
              active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

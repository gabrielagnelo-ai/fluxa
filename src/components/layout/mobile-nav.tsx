"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Calculator, Home, Upload, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/transactions", label: "Gastos", icon: WalletCards },
  { href: "/investments", label: "Invest.", icon: BriefcaseBusiness },
  { href: "/planning", label: "Plano", icon: Calculator },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-xl border border-border bg-card/95 p-1 shadow-glow backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] transition",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

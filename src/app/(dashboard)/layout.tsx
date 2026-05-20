import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TransactionRefreshListener } from "@/components/realtime/transaction-refresh-listener";

export const dynamic = "force-dynamic";
export const preferredRegion = "gru1";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden lg:flex">
      <Sidebar />
      <main className="relative w-full pb-24 lg:pb-0">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.12),transparent_34rem),radial-gradient(circle_at_92%_18%,rgba(16,185,129,0.08),transparent_28rem)]" />
        <div className="page-enter mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
      <MobileNav />
      <TransactionRefreshListener />
    </div>
  );
}

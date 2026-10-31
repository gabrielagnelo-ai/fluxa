import type { ReactNode } from "react";
import { CommandLauncher } from "@/components/layout/command-launcher";
import { TabBar } from "@/components/layout/mobile-nav";
import { MotionLifecycle } from "@/components/layout/motion-lifecycle";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppTopBar } from "@/components/layout/workspace-header";
import { TutorialProvider } from "@/components/onboarding/guided-tutorial";
import { TransactionRefreshListener } from "@/components/realtime/transaction-refresh-listener";

export const dynamic = "force-dynamic";
export const preferredRegion = "gru1";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <TutorialProvider>
      <MotionLifecycle />
      <div className="app-shell">
        <AppSidebar />
        <div className="app-main">
          <AppTopBar />
          <main className="app-content">{children}</main>
        </div>
        <TabBar />
        <CommandLauncher />
        <TransactionRefreshListener />
      </div>
    </TutorialProvider>
  );
}

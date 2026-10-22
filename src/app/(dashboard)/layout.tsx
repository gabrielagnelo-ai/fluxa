import type { ReactNode } from "react";
import { TopNavigation } from "@/components/layout/top-navigation";
import { WorkspaceHeader } from "@/components/layout/workspace-header";
import { TutorialProvider } from "@/components/onboarding/guided-tutorial";
import { TransactionRefreshListener } from "@/components/realtime/transaction-refresh-listener";
import { MotionLifecycle } from "@/components/layout/motion-lifecycle";

export const dynamic = "force-dynamic";
export const preferredRegion = "gru1";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <TutorialProvider>
      <MotionLifecycle />
      <div className="fluxa-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <div className="fluxa-shell horizontal-workspace">
        <WorkspaceHeader />
        <TopNavigation />
        <main className="min-w-0"><div className="fluxa-content">{children}</div></main>
        <TransactionRefreshListener />
      </div>
    </TutorialProvider>
  );
}

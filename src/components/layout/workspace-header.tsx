"use client";

import Link from "next/link";
import { CircleHelp, Search } from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { useTutorial } from "@/components/onboarding/guided-tutorial";
import { openSearch } from "./command-launcher";

/** Phone and tablet top bar: content scrolls under a scroll edge blur; controls sit in a glass capsule. */
export function AppTopBar() {
  const { startTutorial } = useTutorial();
  return <header className="app-topbar">
    <Link href="/dashboard" aria-label="Fluxa, visão geral" className="app-topbar-logo"><Logo size="sm" /></Link>
    <div className="app-topbar-actions glass">
      <button type="button" className="icon-btn" aria-label="Buscar no Fluxa" onClick={openSearch}><Search aria-hidden="true" /></button>
      <button type="button" className="icon-btn" aria-label="Como usar o Fluxa" onClick={startTutorial}><CircleHelp aria-hidden="true" /></button>
    </div>
  </header>;
}

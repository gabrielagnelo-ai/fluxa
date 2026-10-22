"use client";

import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { Logo } from "@/components/branding/logo";
import { useTutorial } from "@/components/onboarding/guided-tutorial";
import { SignOutButton } from "./sign-out-button";
import { CommandLauncher } from "./command-launcher";

export function WorkspaceHeader() {
  const { startTutorial } = useTutorial();
  return <header className="workspace-header">
    <Link href="/dashboard" aria-label="Fluxa, início" className="workspace-logo"><Logo /></Link>
    <CommandLauncher />
    <div className="workspace-header-actions"><button type="button" onClick={startTutorial} className="tutorial-trigger"><CircleHelp aria-hidden="true" />Como usar</button><SignOutButton /></div>
  </header>;
}

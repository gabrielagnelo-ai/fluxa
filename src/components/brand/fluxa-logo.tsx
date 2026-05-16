import { Logo } from "@/components/branding/logo";

export function FluxaLogo({
  className,
  compact = false
}: {
  className?: string;
  markClassName?: string;
  compact?: boolean;
}) {
  return <Logo className={className} compact={compact} showSlogan={!compact} />;
}

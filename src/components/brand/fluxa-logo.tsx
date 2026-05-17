import { Logo } from "@/components/branding/logo";

export function FluxaLogo({
  className,
  compact = false,
  showSlogan = false
}: {
  className?: string;
  markClassName?: string;
  compact?: boolean;
  showSlogan?: boolean;
}) {
  return <Logo className={className} compact={compact} showSlogan={!compact && showSlogan} />;
}

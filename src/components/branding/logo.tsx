import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { mark: 30, logoWidth: 94, logoHeight: 36 },
  md: { mark: 42, logoWidth: 132, logoHeight: 50 },
  lg: { mark: 64, logoWidth: 188, logoHeight: 72 }
};

export function Logo({
  className,
  size = "md",
  compact = false,
  showSlogan = false
}: {
  className?: string;
  size?: keyof typeof sizes;
  compact?: boolean;
  showSlogan?: boolean;
}) {
  const config = sizes[size];

  if (compact) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div
          className="relative shrink-0 overflow-hidden rounded-full border border-primary/20 bg-[#06101f] shadow-[0_0_22px_rgba(37,99,235,0.24)]"
          style={{ width: config.mark, height: config.mark }}
        >
          <Image
            src="/branding/fluxa-fx.png"
            alt="Fluxa"
            fill
            sizes={`${config.mark}px`}
            className="object-contain p-1.5"
            priority={size !== "sm"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: config.logoWidth, height: config.logoHeight }}
      >
        <Image
          src="/branding/fluxa-logo.png"
          alt="Fluxa"
          fill
          sizes={`${config.logoWidth}px`}
          className="object-contain drop-shadow-[0_0_18px_rgba(37,99,235,0.28)]"
          priority={size !== "sm"}
        />
      </div>
      {showSlogan && <span className="hidden min-w-0 text-xs leading-snug text-muted-foreground sm:block">Entenda para onde seu dinheiro vai.</span>}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { mark: 30, text: "text-lg" },
  md: { mark: 42, text: "text-2xl" },
  lg: { mark: 64, text: "text-4xl" }
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

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="relative shrink-0 overflow-hidden rounded-full border border-primary/20 bg-[#0B1220] shadow-[0_0_22px_rgba(37,99,235,0.22)]"
        style={{ width: config.mark, height: config.mark }}
      >
        <Image
          src="/branding/fluxa-fx.png"
          alt="Fluxa"
          fill
          sizes={`${config.mark}px`}
          className="object-cover"
          priority={size !== "sm"}
        />
      </div>
      {!compact && (
        <div className="min-w-0 leading-none">
          <span className={cn("block font-semibold tracking-normal text-foreground", config.text)}>Fluxa</span>
          {showSlogan && <span className="mt-1 hidden text-xs text-muted-foreground sm:block">Entenda para onde seu dinheiro vai.</span>}
        </div>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";

export function FluxaLogo({
  className,
  compact = false
}: {
  className?: string;
  markClassName?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        className={cn(compact ? "h-9 w-28" : "h-12 w-36")}
        viewBox="0 0 260 82"
        role="img"
        aria-label="Fluxa"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="fluxa-word" x1="14" y1="18" x2="210" y2="72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E0F2FE" />
            <stop offset="0.42" stopColor="#38BDF8" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
          <filter id="fluxa-glow" x="-30%" y="-45%" width="160%" height="190%" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.145 0 0 0 0 0.388 0 0 0 0 0.922 0 0 0 0.55 0" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#fluxa-glow)">
          <text
            x="8"
            y="60"
            fill="url(#fluxa-word)"
            stroke="#0EA5E9"
            strokeOpacity="0.42"
            strokeWidth="0.8"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="58"
            fontWeight="700"
            letterSpacing="-3"
          >
            Fluxa
          </text>
          <path
            d="M154 24C188 6 236 7 247 26C255 40 238 55 212 63C235 50 240 35 228 27C213 17 180 19 154 24Z"
            fill="url(#fluxa-word)"
            fillOpacity="0.42"
            stroke="#38BDF8"
            strokeOpacity="0.65"
            strokeWidth="1.2"
          />
        </g>
      </svg>
      {!compact && (
        <span className="hidden leading-none sm:block">
          <span className="block text-xs text-muted-foreground">Entenda para onde seu dinheiro vai.</span>
        </span>
      )}
    </div>
  );
}

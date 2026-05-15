import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        destructive: "hsl(var(--destructive))",
        success: "hsl(var(--success))"
      },
      boxShadow: {
        glow: "0 18px 70px rgb(37 99 235 / 0.20)",
        card: "0 18px 45px rgb(2 6 23 / 0.24)"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"]
      },
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
        glow: "0 8px 24px rgb(0 0 0 / 0.32)",
        card: "0 8px 24px rgb(0 0 0 / 0.28)"
      }
    }
  },
  plugins: []
};

export default config;

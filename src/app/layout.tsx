import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://fluxa-pi.vercel.app"),
  title: {
    default: "Fluxa",
    template: "%s | Fluxa"
  },
  description: "Entenda para onde seu dinheiro vai.",
  applicationName: "Fluxa",
  authors: [{ name: "Fluxa" }],
  keywords: ["Fluxa", "finanças pessoais", "organização financeira", "extrato bancário", "dashboard financeiro"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "Fluxa",
    description: "Entenda para onde seu dinheiro vai.",
    siteName: "Fluxa",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/branding/fluxa-logo.png",
        width: 420,
        height: 160,
        alt: "Logo do Fluxa"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "Fluxa",
    description: "Entenda para onde seu dinheiro vai.",
    images: ["/branding/fluxa-logo.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

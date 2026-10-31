import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AberturaLogo } from "@/components/brand/abertura-logo";
import { Aurora } from "@/components/motion/aurora";
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
      <head>
        {/* Before first paint: mark JS (motion can start from a hidden state) and restore the collapsed sidebar. */}
        <script dangerouslySetInnerHTML={{ __html: "(function(){var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('fluxa-sidebar')==='collapsed')d.dataset.sidebar='collapsed'}catch(e){}})()" }} />
      </head>
      <body>
        <AberturaLogo />
        <Aurora />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PublicScene } from "@/components/public/public-scene";
import "./globals.css";
import "./public.css";

const inter = Inter({ subsets: ["latin"] });
// Public routes only (landing, access, demo, 404): Archivo for titles and text, Plex Mono for labels and numbers.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${archivo.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <PublicScene />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

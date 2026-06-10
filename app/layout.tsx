import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { DwlGameSync } from "@/features/games/components/dwl-game-sync";
import { siteConfig } from "@/lib/site";

import "./globals.css";

const iconVersion = "20260609";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.owner, url: "https://dylanwlim.com" }],
  creator: siteConfig.owner,
  publisher: siteConfig.owner,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: `/favicon.svg?v=${iconVersion}`, sizes: "any", type: "image/svg+xml" },
      { url: `/icon.svg?v=${iconVersion}`, sizes: "512x512", type: "image/svg+xml" },
    ],
    shortcut: [`/favicon.svg?v=${iconVersion}`],
    apple: [{ url: `/logo-light.svg?v=${iconVersion}`, sizes: "512x512", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "Dylan Games",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/og.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1116" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <DwlGameSync />
        {children}
      </body>
    </html>
  );
}

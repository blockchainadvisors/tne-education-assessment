import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "TNE Assessment Platform | AI-Powered Quality Assurance for Transnational Education",
    template: "%s | TNE Assessment",
  },
  description:
    "Elevate transnational education standards with AI-powered quality assessment, automated scoring, peer benchmarking, and comprehensive reporting across 52 items and 5 themes.",
  keywords: [
    "transnational education",
    "quality assurance",
    "TNE assessment",
    "AI scoring",
    "education benchmarking",
    "higher education",
    "quality assessment platform",
  ],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    title: "TNE Assessment Platform",
    description:
      "Transnational Education Quality Assessment and Benchmarking Platform",
    siteName: "TNE Assessment",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TNE Assessment Platform",
    description:
      "Transnational Education Quality Assessment and Benchmarking Platform",
    images: ["/twitter-card.png"],
  },
  other: {
    "msapplication-TileColor": "#4f46e5",
    "msapplication-TileImage": "/mstile-150x150.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

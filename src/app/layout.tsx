import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const title = "Clinch — Win the pitch before the first call";
const description =
  "Clinch turns any prospect's website into a white-label audit, a 30/60/90 plan, and outreach that sells it — in about a minute. Built for web agencies.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Clinch",
  },
  description,
  applicationName: "Clinch",
  authors: [{ name: "Momčilo Savić", url: "https://github.com/momcilosavic1234567-creator" }],
  creator: "Momčilo Savić",
  keywords: [
    "web agency",
    "prospect audit",
    "website audit",
    "SEO audit",
    "white label audit",
    "agency automation",
    "client acquisition",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Clinch",
    title,
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Clinch — the prospect audit engine for web agencies" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only z-[100] bg-signal px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

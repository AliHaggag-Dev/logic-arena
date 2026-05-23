import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono, Alexandria } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "../providers/ThemeProvider";
import { SoundProvider } from "../context/SoundContext";
import { AuthProvider } from "../context/AuthContext";
import Footer from "../components/Footer";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNav } from "../components/MobileNav";
import PullToRefresh from "../components/PullToRefresh";
import { ServiceWorkerRegistrar } from "../components/ServiceWorkerRegistrar";
import { AiTutor } from "../components/AiTutor";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const alexandria = Alexandria({
  variable: "--font-alexandria",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const baseUrl = process.env.CLIENT_URL || "https://logicarena.dev";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Logic Arena | Competitive Robot Coding Simulator",
    template: "%s | Logic Arena",
  },
  description:
    "Write code, battle robots, and climb the leaderboard in Logic Arena — the competitive real-time programming battle simulator where your logic controls your robot. Learn coding through combat, master AliScript, and dominate the arena.",
  keywords: [
    "Logic Arena",
    "logic",
    "coding game",
    "programming simulator",
    "robot battle",
    "developer game",
    "learn to code",
    "TypeScript game",
    "coding competition",
    "coding robot game",
    "programming battle",
    "AliScript",
    "competitive programming",
    "AI bot game",
    "real-time strategy coding",
    "code combat",
    "robot programming game",
    "logic puzzle game",
    "coding for developers",
    "battle bot simulator",
  ],
  authors: [{ name: "Ali Haggag" }],
  creator: "Ali Haggag",
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    title: "Logic Arena | Competitive Robot Coding Simulator",
    description:
      "Write code, battle robots, and climb the leaderboard in Logic Arena — the real-time programming battle simulator where your logic controls your robot.",
    siteName: "Logic Arena",
    images: [
      {
        url: "/logic-arena-logo.jpeg",
        width: 1200,
        height: 630,
        alt: "Logic Arena — Competitive Robot Coding Simulator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Logic Arena | Competitive Robot Coding Simulator",
    description:
      "Write code, battle robots, and climb the leaderboard in Logic Arena — the real-time programming battle simulator where your logic controls your robot.",
    images: ["/logic-arena-logo.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icons/icon-512.png",
    apple: "/icons/icon-192.png",
  },
  verification: {
    google: "5N0GMr8mxTY9zb0A9rUhrHZo39jdVfRAbAM_h_FYcTg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${geistMono.variable} ${alexandria.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/*
          Theme color — controls the status bar (top) AND the Android nav bar (bottom).
          ThemeMetaSync in ThemeProvider updates this dynamically on every theme change.
          Initial value = cyberpunk bg-primary.
        */}
        <meta name="theme-color" content="#030712" />

        {/* Android: treat as a native app (removes browser chrome when installed) */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/*
          black-translucent: iOS status bar overlays the app (we pad with
          env(safe-area-inset-top) so content isn't hidden behind it).
        */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Logic Arena" />

        {/* Viewport with safe-area support — required for notch/home-indicator */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-1QN8VTS98H"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1QN8VTS98H');
          `}
        </Script>
      </head>
      <body className="min-h-dvh w-full flex flex-col bg-bg-primary">
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Logic Arena",
                "url": baseUrl,
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${baseUrl}/search?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "VideoGame",
                "name": "Logic Arena",
                "url": baseUrl,
                "description":
                  "Write code, battle robots, and climb the leaderboard in Logic Arena — the competitive real-time programming battle simulator where your logic controls your robot.",
                "applicationCategory": "GameApplication",
                "operatingSystem": "Web Browser",
                "author": { "@type": "Person", "name": "Ali Haggag" },
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                },
              },
            ]),
          }}
        />

        <ThemeProvider>
          <SoundProvider>
          <AuthProvider>
          {/* Mobile-only top bar (self-guards via useMediaQuery) */}
          <MobileHeader />

          {/* Page content — each route group manages its own inner layout */}
          <PullToRefresh>
            <main className="flex-1">{children}</main>
          </PullToRefresh>

          {/* Global footer — self-suppresses on /arena via FOOTER_SUPPRESSED_PATHS */}
          <Footer />

          {/* Mobile-only bottom nav dock (self-guards via useMediaQuery) */}
          <MobileNav />

          {/* Global AI Tutor — ARIA */}
          <AiTutor />
          </AuthProvider>
          </SoundProvider>
        </ThemeProvider>

        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

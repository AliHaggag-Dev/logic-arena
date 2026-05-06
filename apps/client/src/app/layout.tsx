import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../providers/ThemeProvider";
import Footer from "../components/Footer";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNav } from "../components/MobileNav";
import PullToRefresh from "../components/PullToRefresh";
import { ServiceWorkerRegistrar } from "../components/ServiceWorkerRegistrar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.CLIENT_URL || "https://logicarena.dev"),
  title: {
    default: "Logic Arena | Competitive Robot Coding Simulator",
    template: "%s | Logic Arena",
  },
  description:
    "Write code, battle robots, and climb the leaderboard in Logic Arena. A competitive real-time programming battle simulator for developers and coders.",
  keywords: [
    "Logic Arena",
    "coding game",
    "programming simulator",
    "robot battle",
    "developer game",
    "learn to code",
    "TypeScript game",
    "coding competition",
  ],
  authors: [{ name: "Ali Haggag" }],
  creator: "Ali Haggag",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Logic Arena | Competitive Robot Coding Simulator",
    description:
      "Write code, battle robots, and climb the leaderboard in Logic Arena. A competitive real-time programming battle simulator for developers and coders.",
    siteName: "Logic Arena",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Logic Arena Gameplay",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Logic Arena | Competitive Robot Coding Simulator",
    description:
      "Write code, battle robots, and climb the leaderboard in Logic Arena. A competitive real-time programming battle simulator for developers and coders.",
    images: ["/icons/icon-512.png"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme color — updated dynamically by ThemeProvider on theme change */}
        <meta name="theme-color" content="#030712" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Logic Arena" />

        {/* Viewport with safe-area support */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
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
        </ThemeProvider>

        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../providers/ThemeProvider";
import Footer from "../components/Footer";
import { MobileHeader } from "../components/MobileHeader";
import { MobileNav } from "../components/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Logic Arena",
  description: "Competitive real-time robot battle simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

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
          <main className="flex-1">{children}</main>

          {/* Global footer — self-suppresses on /arena via FOOTER_SUPPRESSED_PATHS */}
          <Footer />

          {/* Mobile-only bottom nav dock (self-guards via useMediaQuery) */}
          <MobileNav />
        </ThemeProvider>

        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[SW] Registered:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[SW] Registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

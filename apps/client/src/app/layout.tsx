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
  description: "AliScript robot combat arena",
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
      </body>
    </html>
  );
}

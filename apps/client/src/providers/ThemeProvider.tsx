"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const THEME_COLORS: Record<string, string> = {
  cyberpunk: "#030712",
  light: "#f8fafc",
  desert: "#fdf4e3",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderInner>{children}</ThemeProviderInner>
  );
}

// Split into inner so useTheme works after NextThemeProvider mounts
import { ThemeProvider as NextThemeProvider } from "next-themes";

function ThemeProviderInner({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="cyberpunk"
      themes={["cyberpunk", "light", "desert"]}
      enableSystem={false}
    >
      <ThemeMetaSync />
      {children}
    </NextThemeProvider>
  );
}

/** Keeps <meta name="theme-color"> in sync with the active theme */
function ThemeMetaSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const color = THEME_COLORS[resolvedTheme ?? "cyberpunk"] ?? "#030712";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", color);
    }
  }, [resolvedTheme]);

  return null;
}

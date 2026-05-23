"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";

const THEME_COLORS: Record<string, string> = {
  cyberpunk: "#030712", // --bg-primary cyberpunk
  light: "#fdfdff",     // --bg-primary light (Violet Sovereign)
  desert: "#0e0a04",    // --bg-primary desert (Obsidian Ember)
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProviderInner>{children}</ThemeProviderInner>;
}

function ThemeProviderInner({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="cyberpunk"
      themes={["cyberpunk", "light", "desert"]}
      enableSystem={false}
      disableTransitionOnChange
    >
      <ThemeMetaSync />
      {children}
    </NextThemeProvider>
  );
}

/** Keeps <meta name="theme-color"> (and msapplication variant) in sync with the active theme */
function ThemeMetaSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const color = THEME_COLORS[resolvedTheme ?? "cyberpunk"] ?? "#030712";

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", color);

    // Windows / Edge mobile nav bar
    document
      .querySelector('meta[name="msapplication-navbutton-color"]')
      ?.setAttribute("content", color);

    // Force Android Chrome bottom navigation bar to respect app theme instead of OS dark mode
    const colorScheme = resolvedTheme === "light" ? "light" : "dark";
    document.documentElement.style.setProperty("color-scheme", colorScheme);
  }, [resolvedTheme]);

  return null;
}
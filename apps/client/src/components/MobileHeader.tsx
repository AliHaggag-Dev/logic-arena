import React from "react";
import { ThemeSwitcher } from "./ui/ThemeSwitcher";

export function MobileHeader() {
  return (
    <header className="h-12 w-full flex items-center justify-between px-4 border-b border-accent/[0.08] bg-bg-primary z-40 fixed top-0 left-0 right-0">
      <h1 className="m-0 text-[13px] font-black tracking-[0.2em] text-accent leading-none [text-shadow:0_0_8px_rgba(var(--accent-rgb),0.8)]">
        LOGIC ARENA
      </h1>
      <ThemeSwitcher variant="minimal" />
    </header>
  );
}

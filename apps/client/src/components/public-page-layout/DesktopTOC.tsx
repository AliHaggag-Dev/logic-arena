import { motion } from "framer-motion";

import { scrollToPublicSection } from "./navigation";
import type { PublicSection } from "./types";

export interface DesktopTOCProps {
  sections: PublicSection[];
  active: string;
}

export function DesktopTOC({ sections, active }: DesktopTOCProps) {
  const handleNavClick = (id: string) => {
    scrollToPublicSection(id);
  };

  return (
    <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
      <motion.div
        className="sticky top-32 rounded-2xl border border-accent/15 overflow-hidden bg-bg-secondary/60"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "inset 0 0 30px rgba(var(--accent-rgb), 0.03), 0 0 0 1px rgba(var(--accent-rgb), 0.05)",
        }}
      >
        {/* Sidebar header */}
        <div className="px-5 py-4 border-b border-accent/10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 6px var(--accent)" }} />
          <span className="text-[9px] font-black tracking-[0.4em] text-accent/50 uppercase">
            On This Page
          </span>
        </div>

        {/* Sidebar glow line top-left */}
        <div
          className="absolute left-0 top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(var(--accent-rgb), 0.4), transparent)" }}
        />

        <nav className="px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {sections.map((section, i) => {
              const isActive = section.id === active;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(section.id)}
                    className={`group w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer hover:translate-x-1 ${isActive ? "bg-accent/10" : "hover:bg-accent/10"}`}
                  >
                    {/* Active indicator bar */}
                    <div className="relative shrink-0 w-0.5 h-4 rounded-full overflow-hidden" style={{ background: "rgba(var(--accent-rgb), 0.15)" }}>
                      {isActive && (
                        <motion.div
                          layoutId="activeTOCIndicator"
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: "var(--accent)",
                            boxShadow: "0 0 8px var(--accent)",
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </div>
                    <span
                      className="text-[10px] font-black tracking-widest shrink-0 w-4"
                      style={{ color: isActive ? "var(--accent)" : "rgba(var(--accent-rgb), 0.3)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="text-[12px] font-medium leading-snug transition-colors duration-200"
                      style={{ color: isActive ? "var(--accent)" : "rgba(var(--accent-rgb), 0.55)" }}
                    >
                      {section.label ?? section.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </motion.div>
    </aside>
  );
}

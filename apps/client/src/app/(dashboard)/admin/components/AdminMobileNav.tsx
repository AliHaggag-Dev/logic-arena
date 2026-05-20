"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Menu, X } from "lucide-react";
import { NAV_SECTIONS, isActivePath, useCommunityFeedbackCount } from "./AdminSidebar";

const DRAWER_WIDTH_CLASS = "w-[304px]";
const DRAWER_ANIMATION_DURATION = 0.2;
const FEEDBACK_PATH_PREFIX = "/admin/feedback";

export function AdminMobileNav(): React.ReactElement {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const communityFeedbackCount = useCommunityFeedbackCount();
  const currentTitle = useMemo((): string => {
    for (const section of NAV_SECTIONS) {
      const match = section.items.find((item) => isActivePath(pathname, item));
      if (match) return match.label;
    }
    return "Overview";
  }, [pathname]);

  useEffect((): void => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[80] flex min-h-16 items-center justify-between border-b border-accent/20 bg-bg-primary/95 px-4 backdrop-blur-xl">
        <button
          type="button"
          aria-label="Open admin navigation"
          title="Open navigation"
          onClick={() => setIsOpen(true)}
          className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-accent/20 bg-card text-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-black uppercase tracking-[0.2em] text-accent">ADMIN</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">{currentTitle}</p>
        </div>
        <Link href="/admin" aria-label="Command Center" title="Command Center" className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
          <Bot className="h-5 w-5" />
        </Link>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.button
            type="button"
            aria-label="Close admin navigation"
            className="fixed inset-0 z-[85] bg-bg-primary/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DRAWER_ANIMATION_DURATION }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className={`fixed left-0 top-0 z-[90] h-screen ${DRAWER_WIDTH_CLASS} max-w-[86vw] border-r border-accent/20 bg-bg-primary shadow-[0_0_42px_rgba(var(--accent-rgb),0.14)]`}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: DRAWER_ANIMATION_DURATION, ease: "easeOut" }}
          >
            <div className="flex min-h-16 items-center justify-between border-b border-accent/20 px-4">
              <Link href="/admin" className="flex min-h-11 items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                  <Bot className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black uppercase tracking-[0.22em] text-accent">ADMIN</span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Command Center</span>
                </span>
              </Link>
              <button
                type="button"
                aria-label="Close admin navigation"
                title="Close navigation"
                onClick={() => setIsOpen(false)}
                className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-accent/20 bg-card text-text-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="h-[calc(100vh-64px)] overflow-y-auto px-4 py-5">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="mb-6">
                  <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.24em] text-text-secondary">{section.title}</p>
                  <div className="grid gap-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActivePath(pathname, item);
                      const hasFeedbackNotice = item.href.startsWith(FEEDBACK_PATH_PREFIX) && communityFeedbackCount > 0;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`relative flex min-h-12 items-center gap-3 rounded-lg border px-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                            active
                              ? "border-accent/50 bg-accent/15 text-accent"
                              : "border-transparent text-text-secondary hover:border-accent/20 hover:bg-accent/5 hover:text-text-primary"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                          {hasFeedbackNotice && <span className="ml-auto h-2 w-2 rounded-full bg-[var(--sem-danger)]" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

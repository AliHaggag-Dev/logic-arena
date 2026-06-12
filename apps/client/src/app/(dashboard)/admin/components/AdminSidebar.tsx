"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bot,
  Brain,
  Bug,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  Flag,
  HeartPulse,
  Home,
  Mail,
  MenuSquare,
  MessageSquarePlus,
  ScrollText,
  Shield,
  ShoppingBag,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { apiClient } from "@/lib/api-client";
import { requestAdminWithRetry } from "../hooks/adminRequest";

const EXPANDED_WIDTH_CLASS = "w-[280px]";
const COLLAPSED_WIDTH_CLASS = "w-[84px]";
const COMMUNITY_SECTION_TITLE = "COMMUNITY";
const SECTION_ANIMATION_DURATION = 0.18;

type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

interface FeedbackCountsResponse {
  openBugReports: number;
  submittedFeatureRequests: number;
  unreadContactMessages: number;
}

interface CommunityCounts {
  total: number;
  bugReports: number;
  featureRequests: number;
  contact: number;
}

type SectionOpenState = Record<string, boolean>;

const NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "ANALYTICS",
    items: [
      { href: "/admin", label: "Overview", icon: Home, exact: true },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/matches", label: "Matches", icon: Swords },
      { href: "/admin/campaign", label: "Campaign", icon: Flag },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { href: "/admin/scripts", label: "Scripts", icon: FileCode2 },
      { href: "/admin/market", label: "Market", icon: ShoppingBag },
      { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
      { href: "/admin/ai-insights", label: "AI Insights", icon: Brain },
    ],
  },
  {
    title: "COMMUNITY",
    items: [
      { href: "/admin/feedback/bug-reports", label: "Bug Reports", icon: Bug },
      { href: "/admin/feedback/feature-requests", label: "Feature Requests", icon: MessageSquarePlus },
      { href: "/admin/feedback/contact", label: "Contact", icon: Mail },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { href: "/admin/health", label: "Server Health", icon: HeartPulse },
      { href: "/admin/security", label: "Security", icon: Shield },
    ],
  },
];

function isActivePath(pathname: string, item: AdminNavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getInitialSectionState(): SectionOpenState {
  return NAV_SECTIONS.reduce<SectionOpenState>((state, section) => {
    state[section.title] = true;
    return state;
  }, {});
}

export function useCommunityFeedbackCount(): CommunityCounts {
  const [counts, setCounts] = useState<CommunityCounts>({ total: 0, bugReports: 0, featureRequests: 0, contact: 0 });

  useEffect((): (() => void) => {
    let cancelled = false;

    async function loadCount(): Promise<void> {
      try {
        const response = await requestAdminWithRetry(() => (
          apiClient.get<FeedbackCountsResponse>("/admin/feedback/counts")
        ));
        const { openBugReports, submittedFeatureRequests, unreadContactMessages } = response.data;

        if (!cancelled) {
          const total = openBugReports + submittedFeatureRequests + unreadContactMessages;
          setCounts({ total, bugReports: openBugReports, featureRequests: submittedFeatureRequests, contact: unreadContactMessages });
        }
      } catch {
        if (!cancelled) {
          setCounts({ total: 0, bugReports: 0, featureRequests: 0, contact: 0 });
        }
      }
    }

    void loadCount();

    return (): void => {
      cancelled = true;
    };
  }, []);

  return counts;
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function itemCountForHref(href: string, counts: CommunityCounts): number {
  if (href.includes("bug-reports")) return counts.bugReports;
  if (href.includes("feature-requests")) return counts.featureRequests;
  if (href.includes("contact")) return counts.contact;
  return 0;
}

export function AdminSidebar({ isCollapsed, onToggleCollapse }: AdminSidebarProps): React.ReactElement {
  const pathname = usePathname() || "";
  const [openSections, setOpenSections] = useState<SectionOpenState>(() => getInitialSectionState());
  const communityCounts = useCommunityFeedbackCount();
  const widthClass = isCollapsed ? COLLAPSED_WIDTH_CLASS : EXPANDED_WIDTH_CLASS;
  const activeTitle = useMemo((): string => {
    for (const section of NAV_SECTIONS) {
      const match = section.items.find((item) => isActivePath(pathname, item));
      if (match) return match.label;
    }
    return "Overview";
  }, [pathname]);

  const toggleSection = (title: string): void => {
    setOpenSections((current) => ({ ...current, [title]: !current[title] }));
  };

  return (
    <aside className={`sticky left-0 top-0 z-[70] flex h-dvh ${widthClass} shrink-0 flex-col border-r border-accent/20 bg-bg-primary/95 shadow-[0_0_36px_rgba(var(--accent-rgb),0.08)] backdrop-blur-xl transition-[width] duration-200`}>
      {/* ── Collapse toggle — right edge, vertically centered ── */}
      <button
        type="button"
        aria-label={isCollapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
        title={isCollapsed ? "Expand" : "Collapse"}
        onClick={onToggleCollapse}
        className="cursor-pointer absolute right-0 top-1/2 z-[71] -translate-y-1/2 translate-x-1/2 grid h-8 w-5 place-items-center rounded-r border border-accent/20 bg-card text-text-secondary shadow-sm transition-colors hover:border-accent/50 hover:text-accent"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* ── Header ── */}
      <div className="flex min-h-20 items-center justify-between gap-3 border-b border-accent/20 px-4">
        <Link href="/admin" className="flex min-w-0 items-center gap-3" title="Command Center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
            <Bot className="h-5 w-5" />
          </span>
          {!isCollapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-black uppercase tracking-[0.22em] text-accent">ADMIN</span>
              <span className="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">{activeTitle}</span>
            </span>
          )}
        </Link>
        {!isCollapsed && <ThemeSwitcher variant="minimal" />}
      </div>

      {/* ── Back to Dashboard ── */}
      <div className={`border-b border-accent/10 px-3 py-2 ${isCollapsed ? "flex justify-center" : ""}`}>
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 rounded-md font-mono text-[9px] font-bold tracking-[0.16em] uppercase text-text-secondary/60 transition-colors hover:text-text-secondary ${isCollapsed ? "justify-center py-2" : "px-2 py-1.5"}`}
          title="Back to Dashboard"
        >
          <ArrowLeft className="h-3 w-3 shrink-0" />
          {!isCollapsed && <span>BACK TO DASHBOARD</span>}
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-5 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`
          nav::-webkit-scrollbar { display: none; }
        `}</style>
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-6">
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="cursor-pointer mb-2 flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left transition-colors hover:bg-accent/5"
                aria-expanded={openSections[section.title]}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Activity className="h-3 w-3 text-accent/50" />
                  <span className="truncate text-[10px] font-black uppercase tracking-[0.24em] text-text-secondary">{section.title}</span>
                </span>
                <span className="flex items-center gap-2">
                  {section.title === COMMUNITY_SECTION_TITLE && communityCounts.total > 0 && (
                    <span className="rounded-full border border-[var(--sem-danger)] bg-[rgba(var(--sem-danger-rgb),0.12)] px-2 py-0.5 text-[10px] font-black text-[var(--sem-danger)]">
                      {communityCounts.total.toLocaleString()}
                    </span>
                  )}
                  <ChevronRight className={`h-3.5 w-3.5 text-text-secondary transition-transform ${openSections[section.title] ? "rotate-90" : ""}`} />
                </span>
              </button>
            )}
            <AnimatePresence initial={false}>
              {(isCollapsed || openSections[section.title]) && (
                <motion.div
                  className="grid gap-1 overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: SECTION_ANIMATION_DURATION }}
                >
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(pathname, item);
                    const itemCount = section.title === COMMUNITY_SECTION_TITLE
                      ? itemCountForHref(item.href, communityCounts)
                      : 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        className={`relative flex min-h-11 items-center gap-3 rounded-lg border px-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                          active
                            ? "border-accent/50 bg-accent/15 text-accent shadow-[inset_0_0_18px_rgba(var(--accent-rgb),0.08)]"
                            : "border-transparent text-text-secondary hover:border-accent/20 hover:bg-accent/5 hover:text-text-primary"
                        } ${isCollapsed ? "justify-center" : ""}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && (
                          <span className="flex flex-1 items-center justify-between gap-2">
                            <span className="truncate">{item.label}</span>
                            {itemCount > 0 && (
                              <span className="rounded-full border border-[var(--sem-danger)] bg-[rgba(var(--sem-danger-rgb),0.12)] px-1.5 py-0.5 text-[10px] font-black leading-none text-[var(--sem-danger)]">
                                {itemCount.toLocaleString()}
                              </span>
                            )}
                          </span>
                        )}
                        {isCollapsed && itemCount > 0 && (
                          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--sem-danger)]" />
                        )}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-accent/20 p-3">
        <div className={`rounded-lg border border-accent/20 bg-card p-3 ${isCollapsed ? "grid place-items-center" : ""}`}>
          <MenuSquare className="h-4 w-4 text-accent" />
          {!isCollapsed && <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Command Center</p>}
        </div>
      </div>
    </aside>
  );
}

export { NAV_SECTIONS, isActivePath, type AdminNavItem, type AdminNavSection };

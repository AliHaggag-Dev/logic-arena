"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
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

const EXPANDED_WIDTH_CLASS = "w-[280px]";
const COLLAPSED_WIDTH_CLASS = "w-[84px]";

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

export function AdminSidebar(): React.ReactElement {
  const pathname = usePathname() || "";
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const widthClass = isCollapsed ? COLLAPSED_WIDTH_CLASS : EXPANDED_WIDTH_CLASS;
  const activeTitle = useMemo((): string => {
    for (const section of NAV_SECTIONS) {
      const match = section.items.find((item) => isActivePath(pathname, item));
      if (match) return match.label;
    }
    return "Overview";
  }, [pathname]);

  return (
    <aside className={`fixed left-0 top-0 z-[70] flex h-screen ${widthClass} flex-col border-r border-accent/20 bg-bg-primary/95 shadow-[0_0_36px_rgba(var(--accent-rgb),0.08)] backdrop-blur-xl transition-[width] duration-200`}>
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
        <button
          type="button"
          aria-label={isCollapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
          title={isCollapsed ? "Expand" : "Collapse"}
          onClick={() => setIsCollapsed((current) => !current)}
          className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-accent/20 bg-card text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-6">
            {!isCollapsed && (
              <div className="mb-2 flex items-center gap-2 px-3">
                <Activity className="h-3 w-3 text-accent/50" />
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-secondary">{section.title}</p>
              </div>
            )}
            <div className="grid gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                      active
                        ? "border-accent/50 bg-accent/15 text-accent shadow-[inset_0_0_18px_rgba(var(--accent-rgb),0.08)]"
                        : "border-transparent text-text-secondary hover:border-accent/20 hover:bg-accent/5 hover:text-text-primary"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

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

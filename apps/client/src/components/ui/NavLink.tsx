"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  label: string;
  icon?: string;
  iconNode?: ReactNode;
  exact?: boolean;
  badge?: number;
  badgeColor?: "accent" | "success";
}

export default function NavLink({ href, label, icon, iconNode, exact, badge, badgeColor = "accent" }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  const showBadge = typeof badge === "number" && badge > 0;

  const badgeStyle = showBadge
    ? badgeColor === "success"
      ? {
          background: "rgba(var(--sem-success-rgb),0.85)",
          color: "var(--bg-primary)",
          boxShadow: "0 0 6px rgba(var(--sem-success-rgb),0.5)",
        }
      : {
          background: "var(--accent)",
          color: "var(--bg-primary)",
          boxShadow: "0 0 6px rgba(var(--accent-rgb),0.6)",
        }
    : {};

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md font-mono text-[10px] font-bold tracking-[0.18em] transition-all duration-200 relative group overflow-hidden ${
        isActive
          ? "text-accent bg-accent/[0.08] border-l-2 border-accent shadow-[-4px_0_12px_rgba(var(--accent-rgb),0.3),inset_0_0_20px_rgba(var(--accent-rgb),0.04)] [text-shadow:0_0_10px_rgba(var(--accent-rgb),0.7)]"
          : "text-accent/70 border-l-2 border-transparent hover:text-accent/85 hover:bg-accent/[0.05] hover:border-accent/40 hover:[text-shadow:0_0_5px_rgba(var(--accent-rgb),0.5)]"
      }`}
    >
      {iconNode ? (
        <span
          className={`w-4 h-4 flex items-center justify-center shrink-0 transition-opacity duration-200 ${
            isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"
          }`}
        >
          {iconNode}
        </span>
      ) : icon ? (
        <span
          className={`text-[13px] w-4 text-center shrink-0 transition-opacity duration-200 ${
            isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"
          }`}
        >
          {icon}
        </span>
      ) : null}
      <span className="flex-1">{label}</span>
      {showBadge && (
        <span
          className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black tracking-normal"
          style={badgeStyle}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {isActive && !showBadge && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] shrink-0 animate-pulse" />
      )}
    </Link>
  );
}

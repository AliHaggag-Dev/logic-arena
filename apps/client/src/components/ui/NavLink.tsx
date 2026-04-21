"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  label: string;
  icon?: string;
  iconNode?: ReactNode;
}

export default function NavLink({ href, label, icon, iconNode }: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md font-mono text-[10px] font-bold tracking-[0.18em] transition-all duration-200 relative group overflow-hidden ${
        isActive
          ? "text-accent bg-accent/[0.08] border-l-2 border-accent shadow-[-4px_0_12px_rgba(var(--accent-rgb),0.3),inset_0_0_20px_rgba(var(--accent-rgb),0.04)] [text-shadow:0_0_10px_rgba(var(--accent-rgb),0.7)]"
          : "text-accent/40 border-l-2 border-transparent hover:text-accent/85 hover:bg-accent/[0.05] hover:border-accent/40 hover:[text-shadow:0_0_5px_rgba(var(--accent-rgb),0.5)]"
      }`}
    >
      {iconNode ? (
        <span className={`w-4 h-4 flex items-center justify-center shrink-0 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"}`}>
          {iconNode}
        </span>
      ) : icon ? (
        <span className={`text-[13px] w-4 text-center shrink-0 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"}`}>
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] shrink-0 animate-pulse" />
      )}
    </Link>
  );
}

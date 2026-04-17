"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  label: string;
  icon?: string;
}

export default function NavLink({ href, label, icon }: NavLinkProps) {
  const pathname = usePathname();
  // Exact match for /dashboard to avoid matching all routes; prefix match for nested routes
  const isActive =
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md font-mono text-[10px] font-bold tracking-[0.18em] transition-all duration-200 relative group overflow-hidden ${
        isActive
          ? "text-[#22d3ee] bg-[#22d3ee]/[0.08] border-l-2 border-[#22d3ee] shadow-[-4px_0_12px_rgba(34,211,238,0.3),inset_0_0_20px_rgba(34,211,238,0.04)] [text-shadow:0_0_10px_rgba(34,211,238,0.7)]"
          : "text-[#22d3ee]/40 border-l-2 border-transparent hover:text-[#22d3ee]/85 hover:bg-[#22d3ee]/[0.05] hover:border-[#22d3ee]/40 hover:[text-shadow:0_0_5px_rgba(34,211,238,0.5)]"
      }`}
    >
      {icon && (
        <span className={`text-[13px] w-4 text-center shrink-0 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'}`}>
          {icon}
        </span>
      )}
      <span>{label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22d3ee] shadow-[0_0_8px_#22d3ee] shrink-0 animate-pulse" />
      )}
    </Link>
  );
}

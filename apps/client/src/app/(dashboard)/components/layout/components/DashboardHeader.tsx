"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { ThemeSwitcher } from "../../../../../components/ui/ThemeSwitcher";
import { apiClient } from "../../../../../lib/api-client";

const POLL_INTERVAL = 30_000;

interface InsightsBadgeResponse {
  unreadCount: number;
}

interface DashboardHeaderProps {
  username: string | null;
  avatarUrl: string | null;
}

export function DashboardHeader({ username, avatarUrl }: DashboardHeaderProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!username) return;

      const fetchUnread = async () => {
        try {
          const { data } = await apiClient.get<{ count: number }>('/ai/insights/unread-count');
          setUnreadCount(data.count ?? 0);
        } catch {
          /* silently ignore — user may not be authed yet */
        }
      };

    fetchUnread();
    const interval = setInterval(fetchUnread, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [username]);

  return (
    <header className="sticky top-0 z-[60] w-full bg-bg-primary/90 backdrop-blur-xl border-b border-accent/[0.08] p-[16px_28px] flex items-center justify-between shrink-0 shadow-[0_10px_40px_rgba(var(--accent-rgb),0.05)]">
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="p-0 bg-transparent border-0 cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-3"
        aria-label="Logic Arena — Go to dashboard"
      >
        <Image
          src="/dashboard-logo.png"
          alt="Logic Arena"
          width={180}
          height={48}
          className="app-logo-img block"
          style={{ height: "44px", width: "auto" }}
          unoptimized
          priority
        />
        <div className="flex flex-col leading-none gap-[3px]">
          <span className="text-[17px] font-black tracking-[0.22em] text-accent [text-shadow:0_0_10px_rgba(var(--accent-rgb),0.7)] uppercase">
            LOGIC
          </span>
          <span className="text-[17px] font-black tracking-[0.22em] text-accent [text-shadow:0_0_10px_rgba(var(--accent-rgb),0.7)] uppercase">
            ARENA
          </span>
        </div>
      </button>

      <div className="flex items-center gap-3">
        {username ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-1.5 border border-accent/20 bg-accent/5 rounded-md text-[9px] tracking-[0.2em] font-bold text-accent/60 shadow-[inset_0_0_10px_rgba(var(--accent-rgb),0.05)] uppercase max-w-[200px] hover:border-accent/40 transition-colors"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={20} height={20} className="w-5 h-5 rounded-full object-cover shrink-0 border border-accent/30" />
            ) : (
              <span className="shrink-0 text-accent/40">USER:</span>
            )}
            <span className="text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.6)] truncate">
              {username}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-accent/20 bg-accent/5 rounded-md text-[9px] tracking-[0.2em] font-bold text-accent/60 shadow-[inset_0_0_10px_rgba(var(--accent-rgb),0.05)] uppercase max-w-[200px]">
            <span className="shrink-0 text-accent/40">USER:</span>
            <span className="text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.6)] truncate">
              GUEST
            </span>
          </div>
        )}

        {/* ── Insights icon button ── */}
        <Link
          href="/insights"
          className="relative flex items-center justify-center w-[28px] h-[28px] rounded-md border border-accent/20 bg-accent/5 text-accent hover:border-accent/40 hover:bg-accent/10 transition-colors duration-150"
          aria-label="ARIA Insights"
          title="ARIA Insights"
        >
          <Lightbulb size={14} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-[14px] px-[3px] rounded-full bg-accent border border-bg-primary text-[7px] font-black text-bg-primary shadow-[0_0_6px_rgba(var(--accent-rgb),0.6)]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <ThemeSwitcher variant="minimal" />
      </div>
    </header>
  );
}

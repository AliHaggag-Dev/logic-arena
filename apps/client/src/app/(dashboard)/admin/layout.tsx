"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/hooks/useAuthState";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { apiClient } from "@/lib/api-client";
import { AdminSidebar } from "./components/AdminSidebar";
import { AdminMobileNav } from "./components/AdminMobileNav";
import { AdminViewportContext } from "./components/AdminViewportContext";

const MOBILE_QUERY = "(max-width: 768px)";
const ADMIN_REDIRECT_PATH = "/dashboard";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps): React.ReactElement | null {
  const router = useRouter();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { isGuest } = useAuthState();
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);

  useEffect((): (() => void) => {
    let cancelled = false;

    async function verifyAdminAccess(): Promise<void> {
      if (isGuest) {
        router.replace(ADMIN_REDIRECT_PATH);
        return;
      }

      try {
        await apiClient.get("/admin/stats/overview");
        if (!cancelled) {
          setIsCheckingAccess(false);
        }
      } catch {
        if (!cancelled) {
          router.replace(ADMIN_REDIRECT_PATH);
        }
      }
    }

    verifyAdminAccess();

    return (): void => {
      cancelled = true;
    };
  }, [isGuest, router]);

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-bg-primary font-mono text-text-primary">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="rounded-lg border border-accent/20 bg-card px-6 py-5 text-center shadow-[var(--card-shadow)]">
            <div className="mx-auto h-8 w-8 animate-pulse rounded border border-accent/40 bg-accent/10" />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-accent">Verifying command access</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminViewportContext.Provider value={{ isMobile }}>
      <div className="min-h-screen bg-bg-primary font-mono text-text-primary">
        {!isMobile && <AdminSidebar />}
        {isMobile && <AdminMobileNav />}
        <main className={isMobile ? "min-h-screen px-4 pb-8 pt-[76px]" : "min-h-screen pl-[280px]"}>
          <div className={isMobile ? "mx-auto max-w-7xl" : "mx-auto max-w-7xl px-8 py-8"}>
            {children}
          </div>
        </main>
      </div>
    </AdminViewportContext.Provider>
  );
}

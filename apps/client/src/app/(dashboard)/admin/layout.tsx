"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PageSkeleton } from "@/components/admin";
import { useAuth } from "@/context/AuthContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { apiClient } from "@/lib/api-client";
import { AdminSidebar } from "./components/AdminSidebar";
import { AdminMobileNav } from "./components/AdminMobileNav";
import { AdminViewportContext } from "./components/AdminViewportContext";

const MOBILE_QUERY = "(max-width: 768px)";
const ADMIN_REDIRECT_PATH = "/dashboard";
const PAGE_TRANSITION_DURATION = 0.3;

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname() || "/admin";
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { isGuest, loading: authLoading } = useAuth();
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);

  useEffect((): (() => void) => {
    let cancelled = false;

    async function verifyAdminAccess(): Promise<void> {
      if (authLoading) return;
      if (isGuest) {
        router.replace("/login");
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
  }, [isGuest, authLoading, router]);

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-bg-primary font-mono text-text-primary">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="rounded-lg border border-accent/20 bg-card px-6 py-5 text-center shadow-[var(--card-shadow)]">
            <PageSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminViewportContext.Provider value={{ isMobile }}>
      <div className="flex min-h-screen w-full bg-bg-primary font-mono text-text-primary">
        {!isMobile && <AdminSidebar />}
        {!isMobile && <div className="hidden md:block w-[280px] shrink-0" />}
        {isMobile && <AdminMobileNav />}
        <main className={isMobile ? "flex min-h-screen w-full flex-1 flex-col pt-[76px]" : "flex min-h-screen w-full flex-1 flex-col"}>
          <div className={isMobile ? "w-full px-4 pb-8" : "w-full px-8 py-8"}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: PAGE_TRANSITION_DURATION }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </AdminViewportContext.Provider>
  );
}

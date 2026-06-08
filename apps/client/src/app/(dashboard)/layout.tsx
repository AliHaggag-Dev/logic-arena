"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { SocketContext } from "../../context/SocketContext";
import { useDashboardAuth } from "./components/layout/hooks/useDashboardAuth";
import { useChallengeSystem } from "./components/layout/hooks/useChallengeSystem";
import { useFriendsSystem } from "../../hooks/useFriendsSystem";
import { useNotifications } from "../../hooks/useNotifications";
import { DashboardSidebar } from "./components/layout/components/DashboardSidebar";
import { DashboardHeader } from "./components/layout/components/DashboardHeader";
import { ChallengeModal } from "./components/layout/components/ChallengeModal";
import { ToastNotification } from "./components/layout/components/ToastNotification";
import { NotificationToasts } from "./components/layout/components/NotificationToasts";
import { FriendRequestModal } from "./friends/components/FriendRequestModal";

import { _test_navigateFromNotification } from "./components/layout/components/NotificationDropdown";
import type { NotificationEntry } from "@/lib/api/notifications.types";
import type { ChallengeSource, MatchMode } from "@/context/SocketContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const { username, avatarUrl, handleLogout } = useDashboardAuth();
  const { incomingChallenge, setIncoming, toast, sendChallenge, acceptChallenge } = useChallengeSystem();

  const {
    incomingRequest,
    setIncomingRequest,
    acceptRequest,
    declineRequest,
    toast: friendsToast,
  } = useFriendsSystem();

  const { toasts, dismissToast } = useNotifications();

  const combinedToast = (friendsToast ?? toast) as
    | { message: string; type: "info" | "error" }
    | null;

  const handleNotificationToastClick = React.useCallback(
    (n: NotificationEntry) => {
      _test_navigateFromNotification(n, router);
    },
    [router],
  );

  const socketValue = {
    sendChallenge: (targetUserId: string, source?: ChallengeSource, mode?: MatchMode) =>
      sendChallenge(targetUserId, source, mode),
    sendFriendRequest: () => {},
    acceptFriendRequest: () => {},
    declineFriendRequest: () => {},
    unfriendSocket: () => {},
  };

  return (
    <SocketContext.Provider value={socketValue}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="flex min-h-screen bg-bg-primary font-mono selection:bg-accent/30">
        {!isAdminRoute && (
          <div className="hidden md:block shrink-0">
            <DashboardSidebar
              username={username}
              avatarUrl={avatarUrl}
              onLogout={handleLogout}
            />
          </div>
        )}

        <main className="flex-1 flex flex-col overflow-x-clip bg-bg-primary relative scroll-smooth scrollbar-thin scrollbar-thumb-accent/10 scrollbar-track-transparent pt-12 md:pt-0 pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0 max-w-[100vw] md:max-w-none">
          {!isAdminRoute && (
            <div className="hidden md:block sticky top-0 z-[110]">
              <DashboardHeader username={username} avatarUrl={avatarUrl} />
            </div>
          )}
          {children}
        </main>

        <ToastNotification toast={combinedToast} isMobile={false} />

        <NotificationToasts
          toasts={toasts}
          onDismiss={dismissToast}
          onClick={handleNotificationToastClick}
        />



        {incomingChallenge && (
          <ChallengeModal
            challenge={incomingChallenge}
            onAccept={(id) => {
              acceptChallenge(id);
              setIncoming(null);
            }}
            onDecline={() => setIncoming(null)}
          />
        )}

        {incomingRequest && (
          <FriendRequestModal
            request={incomingRequest}
            onAccept={(id) => {
              void acceptRequest(id).then(() => setIncomingRequest(null));
            }}
            onDecline={(id) => {
              void declineRequest(id).then(() => setIncomingRequest(null));
            }}
          />
        )}
      </div>
    </SocketContext.Provider>
  );
}

import { useRouter } from "next/navigation";
import { useAuthState } from "../../../../../hooks/useAuthState";
import { apiClient } from "../../../../../lib/api-client";
import { clearAuthSession, clearSensitiveBrowserStorage } from "../../../../../lib/client-security";

export function useDashboardAuth() {
  const router = useRouter();
  const { username } = useAuthState();

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) { }
    clearSensitiveBrowserStorage();
    clearAuthSession();
    router.push("/login");
  };

  return { username, handleLogout };
}

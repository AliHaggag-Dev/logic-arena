import { useRouter } from "next/navigation";
import { useAuthState } from "../../../../../hooks/useAuthState";
import { apiClient } from "../../../../../lib/api-client";

export function useDashboardAuth() {
  const router = useRouter();
  const { username } = useAuthState();

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) {}
    ["userId", "username"].forEach((k) =>
      localStorage.removeItem(k)
    );
    // Notify all mounted useAuthState subscribers in the same tab
    window.dispatchEvent(new Event("auth:changed"));
    router.push("/login");
  };

  return { username, handleLogout };
}

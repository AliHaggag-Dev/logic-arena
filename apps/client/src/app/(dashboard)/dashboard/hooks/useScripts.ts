import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { RobotScript } from "../components/ScriptCard";
import { useAuthState } from "../../../../hooks/useAuthState";
import { setSelectedScriptId } from "../../../../lib/client-security";
import { useSafeTimeout } from "../../../../hooks/useSafeTimeout";

export type GameMode = "COMBAT" | "RACING" | "TRAINING_SOLO";

export const GUEST_SCRIPT: RobotScript = {
    id: "guest-script",
    title: "DEFAULT_GUEST_SCRIPT",
    content: "// Standard operating logic\n// Register to edit this script!\nSCAN;\nMOVE_FAST;",
    version: 1,
    createdAt: new Date().toISOString()
};

export function useScripts() {
    const [scripts, setScripts] = useState<RobotScript[]>([]);
    const [initialLoad, setInitialLoad] = useState(true);
    const [newScriptTitle, setNewScriptTitle] = useState("");
    const [status, setStatus] = useState<{ message: string; type: "error" | "success" | null }>({ message: "", type: null });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMode, setSelectedMode] = useState<GameMode>("COMBAT");
    const [editingScript, setEditingScript] = useState<RobotScript | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const router = useRouter();
    const { clearAllSafeTimeouts, setSafeTimeout } = useSafeTimeout();

    // Reactive auth state — re-evaluates when token arrives after login redirect
    const { isGuest } = useAuthState();

    useEffect(() => {
        // Don't hit the server if we already know there's no token.
        // This eliminates the noisy 401 "Authorization header not found" on first mount.
        if (isGuest) {
            setScripts([GUEST_SCRIPT]);
            setInitialLoad(false);
            return;
        }

        let cancelled = false;

        const fetchScripts = async () => {
            try {
                const response = await apiClient.get("/scripts");
                if (cancelled) return;
                setScripts(response.data);
            } catch (error: unknown) {
                if (cancelled) return;
                const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
                if (axiosError.response?.status === 401) {
                    // apiClient interceptor already cleared in-memory auth and fired auth:expired.
                    // Just fall back to guest script — no console.error needed here.
                    setScripts([GUEST_SCRIPT]);
                } else {
                    console.error("Failed to fetch scripts:", axiosError.response?.data?.message ?? axiosError.message);
                }
            } finally {
                if (!cancelled) setInitialLoad(false);
            }
        };

        fetchScripts();

        return () => {
            cancelled = true;
        };
    }, [isGuest]);

    const clearStatusAfter = useCallback((delay: number) => {
        clearAllSafeTimeouts();
        setSafeTimeout(() => setStatus({ message: "", type: null }), delay);
    }, [clearAllSafeTimeouts, setSafeTimeout]);

    const handleCreateScript = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isGuest) {
            setShowAuthModal(true);
            return;
        }
        if (!newScriptTitle.trim()) return;

        setIsLoading(true);
        setStatus({ message: "CREATING NEW SCRIPT...", type: null });

        try {
            const response = await apiClient.post("/scripts", { title: newScriptTitle, content: "// Write your AliScript here" });
            setScripts((prev) => [...prev, response.data]);
            setNewScriptTitle("");
            setStatus({ message: "[SYS] SCRIPT CREATED.", type: "success" });
            clearStatusAfter(3000);
        } catch (error: unknown) {
            const axiosError = error as { response?: { status?: number, data?: { message?: string } }; message?: string };
            const errMsg = axiosError.response?.status === 401
                ? "Unauthorized. Please log in to create scripts."
                : (axiosError.response?.data?.message ?? "An unexpected error occurred.");
            console.error("Failed to create script:", errMsg);
            setStatus({
                message: `[ERR] COMPILATION FAILED: ${errMsg}`,
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToArena = useCallback((scriptId: string) => {
        router.push(`/arena?scriptId=${scriptId}&mode=${selectedMode}`);
    }, [router, selectedMode]);

    const handleGoToLobby = useCallback((scriptId: string) => {
        setSelectedScriptId(scriptId);
        router.push("/lobby");
    }, [router]);

    const handleEditScript = useCallback((id: string) => {
        if (isGuest) {
            setShowAuthModal(true);
            return;
        }
        const found = scripts.find((s) => s.id === id) ?? null;
        setEditingScript(found);
    }, [scripts, isGuest]);

    const handleOptimisticUpdate = useCallback((updated: RobotScript) => {
        setScripts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }, []);

    const handleRevert = useCallback((original: RobotScript) => {
        setScripts((prev) => prev.map((s) => (s.id === original.id ? original : s)));
    }, []);

    const handleDeleteScript = useCallback(async (id: string) => {
        if (isGuest) {
            setShowAuthModal(true);
            return;
        }
        // Optimistic removal
        const snapshot = scripts.find((s) => s.id === id);
        setScripts((prev) => prev.filter((s) => s.id !== id));
        setStatus({ message: "SCRIPT DELETED", type: "error" });
        clearStatusAfter(1000);

        try {
            await apiClient.delete(`/scripts/${id}`);
        } catch (error: unknown) {
            const axiosError = error as { response?: { status?: number, data?: { message?: string } }; message?: string };
            const errMsg = axiosError.response?.status === 401
                ? "Unauthorized. Please log in to delete scripts."
                : (axiosError.response?.data?.message ?? "An unexpected error occurred.");
            console.error("Failed to delete script:", errMsg);
            // Restore on failure
            if (snapshot) {
                setScripts((prev) => {
                    const exists = prev.some((s) => s.id === snapshot.id);
                    return exists ? prev : [...prev, snapshot];
                });
            }
            setStatus({ message: `[ERR] TERMINATION FAILED: ${errMsg}`, type: "error" });
            clearStatusAfter(3000);
        }
    }, [scripts, isGuest, clearStatusAfter]);

    return {
        scripts,
        initialLoad,
        newScriptTitle,
        setNewScriptTitle,
        status,
        isLoading,
        selectedMode,
        setSelectedMode,
        editingScript,
        setEditingScript,
        isGuest,
        showAuthModal,
        setShowAuthModal,
        handleCreateScript,
        handleGoToArena,
        handleGoToLobby,
        handleEditScript,
        handleOptimisticUpdate,
        handleRevert,
        handleDeleteScript
    };
}

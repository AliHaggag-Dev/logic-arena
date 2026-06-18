import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { RobotScript } from "../components/script-card/types";
import { useAuthState } from "../../../../hooks/useAuthState";
import { setSelectedScriptId, getSelectedScriptId } from "../../../../lib/client-security";
import type { AIDifficulty } from "@logic-arena/engine";
import { useSafeTimeout } from "../../../../hooks/useSafeTimeout";

export type GameMode = "COMBAT" | "SURVIVAL" | "CAPTURE_THE_FLAG" | "KING_OF_THE_HILL" | "RACING" | "TRAINING_SOLO";
export type MatchVariant = "CLASSIC" | "TACTICAL" | "HYBRID";

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
    const [newScriptMode, setNewScriptMode] = useState<"CLASSIC" | "TACTICAL" | "HYBRID">("HYBRID");
    const [status, setStatus] = useState<{ message: string; type: "error" | "success" | null }>({ message: "", type: null });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMode, setSelectedMode] = useState<GameMode>("COMBAT");
    const [selectedTheme, setSelectedTheme] = useState<string>("CYBER");
    const [selectedScriptIdState, setSelectedScriptIdState] = useState<string | null>(null);
    const [selectedMatchVariant, setSelectedMatchVariant] = useState<MatchVariant>("HYBRID");
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
            setSelectedScriptId(GUEST_SCRIPT.id);
            setSelectedScriptIdState(GUEST_SCRIPT.id);
            setSelectedMatchVariant(GUEST_SCRIPT.matchMode ?? "HYBRID");
            setInitialLoad(false);
            return;
        }

        let cancelled = false;

        const fetchScripts = async () => {
            try {
                const response = await apiClient.get("/scripts");
                if (cancelled) return;
                setScripts(response.data);
                if (response.data && response.data.length > 0) {
                    const currentSelected = getSelectedScriptId();
                    const selectedScript = response.data.find((s: RobotScript) => s.id === currentSelected) ?? response.data[0];
                    if (!currentSelected || selectedScript.id !== currentSelected) {
                        setSelectedScriptId(selectedScript.id);
                    }
                    setSelectedScriptIdState(selectedScript.id);
                    setSelectedMatchVariant(selectedScript.matchMode ?? "HYBRID");
                } else {
                    setSelectedScriptId(null);
                    setSelectedScriptIdState(null);
                    setSelectedMatchVariant("HYBRID");
                }
            } catch (error: unknown) {
                if (cancelled) return;
                const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
                if (axiosError.response?.status === 401) {
                    // apiClient interceptor already cleared in-memory auth and fired auth:expired.
                    // Just fall back to guest script — no console.error needed here.
                    setScripts([GUEST_SCRIPT]);
                } else if (process.env.NODE_ENV === 'development') {
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

    const handleCreateScript = useCallback(async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isGuest) {
            setShowAuthModal(true);
            return;
        }
        if (!newScriptTitle.trim()) return;

        setIsLoading(true);
        setStatus({ message: "CREATING NEW SCRIPT...", type: null });

        try {
            const response = await apiClient.post("/scripts", { 
                title: newScriptTitle, 
                content: "// Write your AliScript here",
                matchMode: newScriptMode 
            });
            setScripts((prev) => [...prev, response.data]);
            setNewScriptTitle("");
            setNewScriptMode("HYBRID");
            setStatus({ message: "[SYS] SCRIPT CREATED.", type: "success" });
            clearStatusAfter(3000);
        } catch (error: unknown) {
            const axiosError = error as { response?: { status?: number, data?: { message?: string } }; message?: string };
            const errMsg = axiosError.response?.status === 401
                ? "Unauthorized. Please log in to create scripts."
                : (axiosError.response?.data?.message ?? "An unexpected error occurred.");
            if (process.env.NODE_ENV === 'development') console.error("Failed to create script:", errMsg);
            setStatus({
                message: `[ERR] COMPILATION FAILED: ${errMsg}`,
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [isGuest, newScriptTitle, newScriptMode, clearStatusAfter]);

    const handleSelectScript = useCallback((scriptId: string) => {
        const script = scripts.find((s) => s.id === scriptId);
        setSelectedScriptId(scriptId);
        setSelectedScriptIdState(scriptId);
        setSelectedMatchVariant(script?.matchMode ?? "HYBRID");
    }, [scripts]);

    const handleGoToArena = useCallback((scriptId: string, modeOverride?: GameMode) => {
        const script = scripts.find((s) => s.id === scriptId);
        const matchMode = scriptId === selectedScriptIdState ? selectedMatchVariant : script?.matchMode || "HYBRID";
        setSelectedScriptId(scriptId);
        setSelectedScriptIdState(scriptId);
        router.push(`/arena?scriptId=${scriptId}&mode=${modeOverride ?? selectedMode}&theme=${selectedTheme}&matchMode=${matchMode}`);
    }, [router, selectedMode, selectedTheme, scripts, selectedMatchVariant, selectedScriptIdState]);

    const handleGoToArenaAI = useCallback((mode: GameMode, difficulty: AIDifficulty) => {
        let scriptId = selectedScriptIdState || getSelectedScriptId();
        if (!scriptId && scripts.length > 0) {
            scriptId = scripts[0].id;
            setSelectedScriptId(scriptId);
            setSelectedScriptIdState(scriptId);
        }
        if (!scriptId) {
            setStatus({ message: "[ERR] No script selected. Create or select a script first.", type: "error" });
            clearStatusAfter(3000);
            return;
        }
        const matchId = crypto.randomUUID();
        router.push(`/arena?scriptId=${scriptId}&matchId=${matchId}&mode=${mode}&theme=${selectedTheme}&matchMode=${selectedMatchVariant}&aiDifficulty=${difficulty}`);
    }, [router, selectedTheme, scripts, clearStatusAfter, selectedMatchVariant, selectedScriptIdState]);

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

    const handleChangeScriptMode = useCallback(async (id: string, newMode: "CLASSIC" | "TACTICAL" | "HYBRID") => {
        const target = scripts.find(s => s.id === id);
        if (!target) return;

        // Optimistic update
        const optimisticUpdated = { ...target, matchMode: newMode };
        handleOptimisticUpdate(optimisticUpdated);
        if (id === selectedScriptIdState) {
            setSelectedMatchVariant(newMode);
        }

        if (isGuest) return;

        try {
            await apiClient.put(`/scripts/${id}`, {
                title: target.title,
                content: target.content,
                matchMode: newMode
            });
        } catch (error) {
            console.error("Failed to update script mode:", error);
            // Revert on failure
            setScripts((prev) => prev.map((s) => (s.id === target.id ? target : s)));
            setStatus({ message: "[ERR] MODE UPDATE FAILED", type: "error" });
            setTimeout(() => setStatus({ message: "", type: null }), 3000);
        }
    }, [scripts, handleOptimisticUpdate, isGuest, selectedScriptIdState]);

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
            if (process.env.NODE_ENV === 'development') console.error("Failed to delete script:", errMsg);
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
        newScriptMode,
        setNewScriptMode,
        status,
        isLoading,
        selectedMode,
        setSelectedMode,
        selectedTheme,
        setSelectedTheme,
        selectedScriptId: selectedScriptIdState,
        selectedMatchVariant,
        setSelectedMatchVariant,
        editingScript,
        setEditingScript,
        isGuest,
        showAuthModal,
        setShowAuthModal,
        handleCreateScript,
        handleSelectScript,
        handleGoToArena,
        handleGoToArenaAI,
        handleGoToLobby,
        handleEditScript,
        handleOptimisticUpdate,
        handleChangeScriptMode,
        handleRevert,
        handleDeleteScript
    };
}

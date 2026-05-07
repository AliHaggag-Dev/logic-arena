"use client";

import { useCallback, useEffect, useRef } from "react";

export function useSafeTimeout() {
    const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    const clearSafeTimeout = useCallback((timeoutId: ReturnType<typeof setTimeout>) => {
        clearTimeout(timeoutId);
        timeoutIdsRef.current.delete(timeoutId);
    }, []);

    const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
        const timeoutId = setTimeout(() => {
            timeoutIdsRef.current.delete(timeoutId);
            callback();
        }, delay);

        timeoutIdsRef.current.add(timeoutId);
        return timeoutId;
    }, []);

    const clearAllSafeTimeouts = useCallback(() => {
        for (const timeoutId of timeoutIdsRef.current) {
            clearTimeout(timeoutId);
        }
        timeoutIdsRef.current.clear();
    }, []);

    useEffect(() => clearAllSafeTimeouts, [clearAllSafeTimeouts]);

    return { setSafeTimeout, clearSafeTimeout, clearAllSafeTimeouts };
}
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "../../../../lib/api-client";
import { RobotScript } from "./script-card/types";
import { EditScriptHeader } from "./edit-script-modal/EditScriptHeader";
import { EditScriptEditor } from "./edit-script-modal/EditScriptEditor";
import { EditScriptFooter, FooterStatus } from "./edit-script-modal/EditScriptFooter";
import { useSafeTimeout } from "../../../../hooks/useSafeTimeout";

interface EditScriptModalProps {
    script: RobotScript;
    onClose: () => void;
    onOptimisticUpdate: (updated: RobotScript) => void;
    onRevert: (original: RobotScript) => void;
}

export const EditScriptModal = ({
    script,
    onClose,
    onOptimisticUpdate,
    onRevert,
}: EditScriptModalProps) => {
    const [content, setContent] = useState(script.content ?? "");
    const [footerStatus, setFooterStatus] = useState<FooterStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const isSaving = useRef(false);
    const { setSafeTimeout } = useSafeTimeout();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleOverlayClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) onClose();
        },
        [onClose]
    );

    const handleSave = async () => {
        if (isSaving.current) return;
        isSaving.current = true;

        const optimistic: RobotScript = { ...script, content, version: script.version + 1 };
        onOptimisticUpdate(optimistic);
        setFooterStatus("idle");

        try {
            await apiClient.put(`/scripts/${script.id}`, { content });
            setFooterStatus("success");
            setSafeTimeout(() => onClose(), 1500);
        } catch (error: unknown) {
            const axiosError = error as { response?: { status?: number, data?: { message?: string } } };
            onRevert(script);
            setContent(script.content ?? "");
            setFooterStatus("error");
            if (axiosError.response?.status === 429) {
                setErrorMessage("RATE LIMIT EXCEEDED");
            } else if (axiosError.response?.data?.message) {
                let msg = axiosError.response.data.message;
                if (Array.isArray(msg)) msg = msg[0];
                setErrorMessage(msg.toUpperCase());
            } else {
                setErrorMessage("SAVE FAILED");
            }
        } finally {
            isSaving.current = false;
        }
    };

    const formattedDate = new Date(script.createdAt).toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric",
    });

    return (
        <>
            <div
                className="fixed inset-0 h-[100dvh] bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 sm:p-6"
                onClick={handleOverlayClick}
                role="dialog"
                aria-modal="true"
                aria-label={`Edit script: ${script.title}`}
            >
                <div className="relative flex flex-col w-full max-w-4xl h-[100dvh] sm:h-[min(90dvh,700px)] bg-bg-secondary border-0 sm:border sm:border-accent/25 rounded-none sm:rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.06),0_32px_64px_rgba(0,0,0,0.7),0_0_80px_rgba(var(--accent-rgb),0.07)] animate-in zoom-in-95 fade-in duration-200">

                    <EditScriptHeader
                        title={script.title}
                        version={script.version}
                        onClose={onClose}
                    />

                    <EditScriptEditor
                        content={content}
                        setContent={setContent}
                    />

                    <EditScriptFooter
                        status={footerStatus}
                        errorMessage={errorMessage}
                        formattedDate={formattedDate}
                        onClose={onClose}
                        onSave={handleSave}
                    />
                </div>
            </div>
        </>
    );
};

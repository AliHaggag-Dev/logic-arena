"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import "../garage.css";
import { RobotViewer } from "../components/RobotViewer";
import { Toast, type ToastState } from "../components/Toast";
import { useAuth } from "../../../../context/AuthContext";
import { apiClient } from "../../../../lib/api-client";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";
import { ControlsPanel } from "./components/ControlsPanel";
import { NotFoundState } from "./components/NotFoundState";
import { SaveButton } from "./components/SaveButton";
import { ROBOTS_MAP, MOBILE_BREAKPOINT, TOAST_DURATION_MS } from "../constants/robots.constants";

export default function RobotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const robotId = Array.isArray(params.robotId)
    ? params.robotId[0]
    : (params.robotId ?? "");

  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const robot = ROBOTS_MAP[robotId];

  const [color, setColor] = useState("DEFAULT");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Track the dismiss timer so we can clear it on unmount
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(
        () => setToast(null),
        TOAST_DURATION_MS
      );
    },
    []
  );

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const { profile } = useAuth();

  // Hydrate saved color from cached profile
  useEffect(() => {
    if (isGuest) return;
    if (!profile) return;
    if (profile.selectedRobotId === robotId) {
      setColor(profile.selectedColor ?? "DEFAULT");
    }
  }, [profile, robotId, isGuest]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    if (isGuest) {
      showToast("error", "LOG IN REQUIRED TO SAVE CHANGES");
      return;
    }
    // Capture current color at call-time to prevent stale-closure race
    const colorToSave = color;
    setSaving(true);
    try {
      await apiClient.patch("/users/profile", {
        robotId,
        color: colorToSave,
      });
      showToast("success", "CHANGES SAVED SUCCESSFULLY");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "CONNECTION FAILED — PLEASE RETRY";
      showToast("error", message);
    } finally {
      setSaving(false);
    }
  }, [color, isGuest, robotId, saving, showToast]);

  if (!robot) return <NotFoundState robotId={robotId} />;

  const saveButtonLabel = isGuest
    ? "CONFIGURATION LOCKED"
    : saving
      ? "SAVING..."
      : "SAVE LOADOUT";

  return (
    <>
      <div
        className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile
            ? "pb-[calc(8rem+env(safe-area-inset-bottom))]"
            : "pb-20"
          }`}
      >
        {/* Grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(var(--accent-rgb),0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div
          className={`max-w-[1100px] mx-auto ${isMobile ? "px-4 pt-6" : "px-6 pt-10"
            } relative z-10`}
          style={{ animation: "garageFadeIn 0.35s ease" }}
        >
          {/* ── Top bar ── */}
          <div className={`border-b border-accent/10 ${isMobile ? "pb-4 mb-6" : "pb-5 mb-8"}`}>
            <div className="flex flex-col gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => router.push("/garage")}
                className="w-max bg-transparent border border-accent/15 rounded px-2.5 py-1 md:px-3 hover:border-accent/40 hover:bg-accent/20 text-accent/70 cursor-pointer text-[9px] md:text-[10px] tracking-[0.25em] font-mono flex items-center gap-1.5 transition-all duration-200 uppercase"
              >
                ← <span className="md:hidden">GARAGE</span><span className="hidden md:inline">BACK TO GARAGE</span>
              </button>
              <div>
                <p className="text-[9px] tracking-[0.28em] text-accent/35 mb-1 uppercase font-bold">
                  // ROBOT CONFIGURATION
                </p>
                <h1
                  className={`m-0 ${isMobile ? "text-xl" : "text-[clamp(20px,3.5vw,32px)]"} font-black tracking-[0.18em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.7)] leading-tight uppercase`}
                >
                  {robot.name}
                </h1>
              </div>
            </div>
          </div>

          {/* ── Main layout: Viewer + Controls ── */}
          <div
            className={`grid grid-cols-1 ${isMobile ? "gap-6" : "lg:grid-cols-[1fr_360px] gap-8"
              }`}
          >
            {/* 3-D viewer */}
            <div
              className={`${isMobile ? "h-[380px]" : "h-[540px]"} relative`}
            >
              <RobotViewer
                file={robot.file}
                color={color}
                scale={robot.scale}
                isMobile={isMobile}
              />
            </div>

            <ControlsPanel
              robot={robot}
              robotId={robotId}
              color={color}
              isMobile={isMobile}
              isGuest={isGuest}
              saving={saving}
              saveButtonLabel={saveButtonLabel}
              onColorChange={setColor}
              onSave={handleSave}
            />
          </div>
        </div>

        {/* ── Mobile Sticky Footer ── */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-bg-primary/80 backdrop-blur-xl border-t border-accent/10 z-[100] animate-in slide-in-from-bottom-full duration-300">
            <SaveButton
              onClick={handleSave}
              disabled={saving || isGuest}
              label={saveButtonLabel}
              isGuest={isGuest}
              variant="mobile"
            />
          </div>
        )}

        <Toast toast={toast} isMobile={isMobile} />
      </div>
    </>
  );
}

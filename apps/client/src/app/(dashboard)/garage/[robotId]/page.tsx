"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RobotViewer } from "../components/RobotViewer";
import { ColorPicker } from "../components/ColorPicker";
import { apiClient } from "../../../../lib/api-client";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";

/* ─── Robot manifest ────────────────────────────────────────────── */
const ROBOTS: Record<string, { name: string; file: string; scale?: number }> = {
  "unit-01": { name: "UNIT-01", file: "/robot.glb", scale: 2.5 },
  "unit-02": { name: "UNIT-02", file: "/robot2.glb", scale: 1.4 },
};

/* ─── Toast ─────────────────────────────────────────────────────── */
type ToastState = { type: "success" | "error"; message: string } | null;

function Toast({ toast, isMobile }: { toast: ToastState, isMobile: boolean }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div
      className="fixed z-50 font-mono text-[11px] tracking-[0.15em] px-5 py-3 rounded-lg border pointer-events-none whitespace-nowrap"
      style={{
        bottom: isMobile ? "110px" : "32px",
        left: "50%",
        transform: "translateX(-50%)",
        animation: "fadeIn 0.25s ease",
        background: isSuccess ? "rgba(var(--accent-rgb),0.08)" : "rgba(var(--color-red-500),0.10)",
        border: `1px solid ${isSuccess ? "rgba(var(--accent-rgb),0.35)" : "rgba(var(--color-red-500),0.35)"}`,
        color: isSuccess ? "var(--accent)" : "#fca5a5",
        boxShadow: isSuccess
          ? "0 0 24px rgba(var(--accent-rgb),0.15)"
          : "0 0 24px rgba(var(--color-red-500),0.15)",
      }}
    >
      {isSuccess ? "✓ " : "✗ "}
      {toast.message}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function RobotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const robotId = Array.isArray(params.robotId) ? params.robotId[0] : params.robotId ?? "";
  const isMobile = useMediaQuery("(max-width: 1024px)");

  const robot = ROBOTS[robotId];
  const [color, setColor] = useState("DEFAULT");
  const [saving, setSaving] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  // Hydrate color from saved loadout
  useEffect(() => {
    apiClient.get("/users/profile").then((res) => {
      if (res.data.selectedRobotId === robotId) {
        setColor(res.data.selectedColor ?? "DEFAULT");
      }
    }).catch((err) => {
      if (err.response?.status === 401 || !localStorage.getItem("token")) {
        setIsGuest(true);
      }
    });
  }, [robotId]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const handleSave = async () => {
    if (saving) return;
    if (isGuest) {
      showToast("error", "LOG IN REQUIRED TO SAVE CHANGES");
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch("/users/profile", { robotId, color });
      showToast("success", "CHANGES SAVED SUCCESSFULLY");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message ?? "CONNECTION FAILED — PLEASE RETRY");
    } finally {
      setSaving(false);
    }
  };

  /* Unknown robot */
  if (!robot) {
    return (
      <div className="min-h-screen bg-bg-primary font-mono text-accent/90 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500/80 text-[13px] tracking-[0.2em] mb-4 uppercase font-bold">
            [ERR] ROBOT NOT FOUND: {robotId}
          </p>
          <button
            onClick={() => router.push("/garage")}
            className="text-[10px] tracking-[0.2em] text-accent/50 hover:text-accent transition-colors uppercase font-bold"
          >
            ← BACK TO GARAGE
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(var(--accent-rgb),0.2); }
          50%       { box-shadow: 0 0 28px rgba(var(--accent-rgb),0.45); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--accent-rgb), 0.2); border-radius: 2px; }
      `}</style>

      <div className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile ? "pb-32" : "pb-20"}`}>
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
          className={`max-w-[1100px] mx-auto ${isMobile ? "px-4 pt-6" : "px-6 pt-10"} relative z-10`}
          style={{ animation: "fadeIn 0.35s ease" }}
        >
          {/* ── Top bar ── */}
          <div className={`flex items-center justify-between border-b border-accent/10 ${isMobile ? "pb-4 mb-6" : "pb-5 mb-8"}`}>
            <div>
              <p className="text-[9px] tracking-[0.28em] text-accent/35 mb-1 uppercase font-bold">
                // ROBOT CONFIGURATION
              </p>
              <h1 className={`m-0 ${isMobile ? "text-xl" : "text-[clamp(20px,3.5vw,32px)]"} font-black tracking-[0.18em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.7)] leading-tight uppercase`}>
                {robot.name}
              </h1>
            </div>

            <button
              onClick={() => router.push("/garage")}
              className={`${isMobile ? "text-[8px] px-3 py-1.5" : "text-[10px] px-4 py-2"} tracking-[0.2em] text-accent/70 hover:text-accent/80 transition-colors duration-200 border border-accent/10 hover:border-accent/30 rounded-lg bg-accent/5 hover:bg-accent/10 uppercase font-bold font-mono`}
            >
              ← BACK
            </button>
          </div>

          {/* ── Main layout: Viewer + Controls ── */}
          <div className={`grid grid-cols-1 ${isMobile ? "gap-6" : "lg:grid-cols-[1fr_360px] gap-8"}`}>
            {/* 3-D viewer */}
            <div className={`${isMobile ? "h-[380px]" : "h-[540px]"} relative`}>
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-gradient-to-t from-accent/10 to-transparent rounded-xl" />
              <RobotViewer file={robot.file} color={color} scale={robot.scale} isMobile={isMobile} />
            </div>

            {/* Controls panel */}
            <div
              className={`flex flex-col ${isMobile ? "gap-5" : "gap-6"} border border-accent/10 rounded-xl ${isMobile ? "p-5" : "p-6"} bg-card/40 backdrop-blur-md h-fit`}
              style={{ boxShadow: !isMobile ? "var(--card-shadow)" : "none" }}
            >
              {/* Robot info */}
              <div className="border-b border-accent/10 pb-5">
                <p className="text-[9px] tracking-[0.28em] text-accent/35 mb-4 uppercase font-bold">
                  // ROBOT SPECIFICATIONS
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] tracking-[0.12em] font-mono">
                    <span className="text-accent/70 uppercase font-bold">Designation</span>
                    <span className="text-accent/90 font-black">{robot.name}</span>
                  </div>
                  <div className="flex justify-between text-[10px] tracking-[0.12em] font-mono">
                    <span className="text-accent/70 uppercase font-bold">Model</span>
                    <span className="text-accent/90 font-black">{robotId.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] tracking-[0.12em] font-mono">
                    <span className="text-accent/70 uppercase font-bold">Color</span>
                    <span className="font-black drop-shadow-[0_0_8px_currentColor]" style={{ color: color !== "DEFAULT" ? color : "var(--accent)" }}>
                      {color.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Color picker */}
              <div className={isMobile ? "" : "border-b border-accent/10 pb-5"}>
                <ColorPicker selected={color} onChange={setColor} isMobile={isMobile} />
              </div>

              {/* Orbit controls hint (Desktop Only) */}
              {!isMobile && (
                <>
                  <p className="text-[9px] tracking-[0.18em] text-accent/25 leading-relaxed font-bold uppercase italic">
                    Orbit: ClickDRAG · Zoom: Scroll · Pan: RightDRAG
                  </p>

                  {/* Save button */}
                  <button
                    onClick={handleSave}
                    disabled={saving || isGuest}
                    className={`w-full py-4 rounded-xl border tracking-[0.22em] text-[12px] font-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden active:scale-[0.98] ${isGuest ? 'bg-accent/5 border-accent/10 text-accent/30' : 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20'}`}
                    style={{
                      background: isGuest ? "transparent" : "rgba(var(--accent-rgb),0.10)",
                      borderColor: isGuest ? "rgba(var(--accent-rgb),0.1)" : "rgba(var(--accent-rgb),0.3)",
                    }}
                  >
                    {!isGuest && <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    {isGuest ? "🔒 CONFIGURATION LOCKED" : (saving ? "SAVING..." : "SAVE CHANGES")}
                  </button>
                  {isGuest && (
                    <p className="text-[8px] text-accent/30 tracking-widest mt-2 uppercase text-center">
                      Register to unlock customization
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Sticky Footer ── */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-bg-primary/80 backdrop-blur-xl border-t border-accent/10 z-[100] animate-in slide-in-from-bottom-full duration-300">
            <button
              onClick={handleSave}
              disabled={saving || isGuest}
              className={`w-full py-4 rounded-xl border tracking-[0.3em] text-[11px] font-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)] active:scale-[0.96] ${isGuest ? 'bg-accent/5 border-accent/10 text-accent/30' : 'bg-accent/20 border-accent/40 text-accent'}`}
            >
              {isGuest ? "🔒 LOCKED" : (saving ? "SAVING..." : "SAVE CHANGES")}
            </button>
          </div>
        )}

        {/* Toast */}
        <Toast toast={toast} isMobile={isMobile} />
      </div>
    </>
  );
}

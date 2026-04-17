"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RobotViewer } from "../components/RobotViewer";
import { ColorPicker } from "../components/ColorPicker";
import { apiClient } from "../../../../lib/api-client";

/* ─── Robot manifest ────────────────────────────────────────────── */
const ROBOTS: Record<string, { name: string; file: string }> = {
  "unit-01": { name: "UNIT-01", file: "/robot.glb" },
  "unit-02": { name: "UNIT-02", file: "/robot2.glb" },
};

/* ─── Toast ─────────────────────────────────────────────────────── */
type ToastState = { type: "success" | "error"; message: string } | null;

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div
      className="fixed bottom-8 left-1/2 z-50 font-mono text-[11px] tracking-[0.15em] px-5 py-3 rounded-lg border pointer-events-none"
      style={{
        transform: "translateX(-50%)",
        animation: "fadeIn 0.25s ease",
        background: isSuccess ? "rgba(34,211,238,0.08)" : "rgba(239,68,68,0.10)",
        border: `1px solid ${isSuccess ? "rgba(34,211,238,0.35)" : "rgba(239,68,68,0.35)"}`,
        color: isSuccess ? "#22d3ee" : "#fca5a5",
        boxShadow: isSuccess
          ? "0 0 24px rgba(34,211,238,0.15)"
          : "0 0 24px rgba(239,68,68,0.15)",
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

  const robot = ROBOTS[robotId];
  const [color, setColor] = useState("#22d3ee");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  // Hydrate color from saved loadout
  useEffect(() => {
    apiClient.get("/users/profile").then((res) => {
      if (res.data.selectedRobotId === robotId) {
        setColor(res.data.selectedColor ?? "#22d3ee");
      }
    }).catch(() => {/* silently ignore if not logged in */});
  }, [robotId]);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await apiClient.patch("/users/profile", { robotId, color });
      showToast("success", "LOADOUT SAVED SUCCESSFULLY");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message ?? "UPLINK FAILURE — RETRY");
    } finally {
      setSaving(false);
    }
  };

  /* Unknown robot */
  if (!robot) {
    return (
      <div className="min-h-screen bg-[#030712] font-mono text-[#22d3ee]/90 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#ef4444]/80 text-[13px] tracking-[0.2em] mb-4">
            [ERR] UNIT_NOT_FOUND: {robotId}
          </p>
          <button
            onClick={() => router.push("/garage")}
            className="text-[10px] tracking-[0.2em] text-[#22d3ee]/50 hover:text-[#22d3ee] transition-colors"
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
          0%, 100% { box-shadow: 0 0 12px rgba(34,211,238,0.2); }
          50%       { box-shadow: 0 0 28px rgba(34,211,238,0.45); }
        }
      `}</style>

      <div className="min-h-screen bg-[#030712] font-mono text-[#22d3ee]/90 relative overflow-hidden">
        {/* Grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(8,145,178,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div
          className="max-w-[960px] mx-auto px-6 pt-10 pb-20 relative z-10"
          style={{ animation: "fadeIn 0.35s ease" }}
        >
          {/* ── Top bar ── */}
          <div className="flex items-center justify-between border-b border-[#22d3ee]/10 pb-5 mb-8">
            <div>
              <p className="text-[8px] tracking-[0.28em] text-[#22d3ee]/35 mb-1 uppercase">
                // UNIT_VIEWER
              </p>
              <h1 className="m-0 text-[clamp(20px,3.5vw,32px)] font-black tracking-[0.18em] text-[#22d3ee] drop-shadow-[0_0_12px_rgba(34,211,238,0.7)] leading-tight">
                {robot.name}
              </h1>
            </div>

            <button
              onClick={() => router.push("/garage")}
              className="text-[10px] tracking-[0.2em] text-[#22d3ee]/40 hover:text-[#22d3ee]/80 transition-colors duration-200 border border-[#22d3ee]/10 hover:border-[#22d3ee]/30 px-4 py-2 rounded-lg bg-[#22d3ee]/5 hover:bg-[#22d3ee]/10"
            >
              ← BACK
            </button>
          </div>

          {/* ── Main layout: Viewer + Controls ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* 3-D viewer */}
            <div className="h-[480px] lg:h-[540px]">
              <RobotViewer file={robot.file} color={color} />
            </div>

            {/* Controls panel */}
            <div
              className="flex flex-col gap-6 border border-[#22d3ee]/10 rounded-xl p-6 bg-[#030712]/80 h-fit"
              style={{ animation: "glowPulse 4s ease-in-out infinite" }}
            >
              {/* Robot info */}
              <div className="border-b border-[#22d3ee]/10 pb-5">
                <p className="text-[8px] tracking-[0.28em] text-[#22d3ee]/35 mb-3 uppercase">
                  // UNIT_DATA
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] tracking-[0.12em]">
                    <span className="text-[#22d3ee]/40">DESIGNATION</span>
                    <span className="text-[#22d3ee]/80">{robot.name}</span>
                  </div>
                  <div className="flex justify-between text-[10px] tracking-[0.12em]">
                    <span className="text-[#22d3ee]/40">UNIT_ID</span>
                    <span className="text-[#22d3ee]/80">{robotId.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] tracking-[0.12em]">
                    <span className="text-[#22d3ee]/40">TINT_HEX</span>
                    <span style={{ color }}>{color.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Color picker */}
              <div className="border-b border-[#22d3ee]/10 pb-5">
                <ColorPicker selected={color} onChange={setColor} />
              </div>

              {/* Orbit controls hint */}
              <p className="text-[8px] tracking-[0.18em] text-[#22d3ee]/25 leading-relaxed">
                DRAG TO ORBIT · SCROLL TO ZOOM · RIGHT-DRAG TO PAN
              </p>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-lg border tracking-[0.22em] text-[12px] font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: saving ? "rgba(34,211,238,0.05)" : "rgba(34,211,238,0.10)",
                  borderColor: saving ? "rgba(34,211,238,0.15)" : "rgba(34,211,238,0.35)",
                  color: "#22d3ee",
                  boxShadow: saving ? "none" : "0 0 16px rgba(34,211,238,0.1)",
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(34,211,238,0.18)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 0 24px rgba(34,211,238,0.25)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(34,211,238,0.10)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 16px rgba(34,211,238,0.1)";
                }}
              >
                {saving ? "SAVING..." : "SAVE LOADOUT"}
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        <Toast toast={toast} />
      </div>
    </>
  );
}

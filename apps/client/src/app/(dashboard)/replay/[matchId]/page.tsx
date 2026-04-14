"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

/* ─── Types ─────────────────────────────────────────────── */
interface Vector2 {
  x: number;
  y: number;
}

interface RobotSnapshot {
  id: string;
  position: Vector2;
  health: number;
  color?: string;
  rotation?: number;
  isAlive?: boolean;
}

interface ProjectileSnapshot {
  id?: string;
  ownerId?: string;
  position: Vector2;
  velocity?: Vector2;
}

interface Snapshot {
  t: number;
  robots: RobotSnapshot[];
  projectiles: ProjectileSnapshot[];
}

interface ReplayData {
  id: string;
  replayData: Snapshot[] | null;
  winnerId: string | null;
  duration: number;
  createdAt: string;
}

/* ─── Canvas renderer ───────────────────────────────────── */
const CANVAS_W = 420;
const CANVAS_H = 315; // 420 * (600/800) — preserves 800×600 aspect ratio
const ARENA_W = 800;
const ARENA_H = 600;

function scaleX(x: number) { return (x / ARENA_W) * CANVAS_W; }
function scaleY(y: number) { return (y / ARENA_H) * CANVAS_H; }

const ROBOT_COLORS = [
  "#00ffff", "#ff00ff", "#f97316", "#22c55e",
  "#f43f5e", "#eab308", "#38bdf8", "#c084fc",
];

function getColorForId(idx: number): string {
  return ROBOT_COLORS[idx % ROBOT_COLORS.length];
}

function drawFrame(ctx: CanvasRenderingContext2D, snap: Snapshot | undefined) {
  const W = CANVAS_W;
  const H = CANVAS_H;

  // Background
  ctx.fillStyle = "#030712";
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = "rgba(8,145,178,0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath(); ctx.moveTo((i / 10) * W, 0); ctx.lineTo((i / 10) * W, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, (i / 10) * H); ctx.lineTo(W, (i / 10) * H); ctx.stroke();
  }

  // Arena border
  ctx.strokeStyle = "rgba(34,211,238,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // Fallback: no snapshot yet — draw a test dot so we know canvas works
  if (!snap) {
    ctx.fillStyle = "rgba(34,211,238,0.15)";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Projectiles  — shape: { position: { x, y } }
  snap.projectiles?.forEach((p) => {
    if (!p.position) return;
    const px = scaleX(p.position.x);
    const py = scaleY(p.position.y);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#22d3ee";
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Robots  — shape: { position: { x, y }, health, color, id }
  snap.robots?.forEach((robot, idx) => {
    if (!robot.position) return;
    const rx = scaleX(robot.position.x);
    const ry = scaleY(robot.position.y);
    const color = robot.color || getColorForId(idx);
    const radius = 12;

    // Health ring
    const healthPct = Math.max(0, Math.min(1, robot.health / 100));
    ctx.beginPath();
    ctx.arc(rx, ry, radius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * healthPct);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Robot body fill
    ctx.beginPath();
    ctx.arc(rx, ry, radius, 0, Math.PI * 2);
    ctx.fillStyle = `${color}30`;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Facing direction dot
    if (robot.rotation !== undefined) {
      const dotX = rx + Math.cos(robot.rotation) * (radius - 3);
      const dotY = ry + Math.sin(robot.rotation) * (radius - 3);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // ID label
    const shortId = robot.id.startsWith("bot") ? "BOT" : robot.id.slice(0, 5);
    ctx.fillStyle = color;
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shortId, rx, ry);
    ctx.textBaseline = "alphabetic";
  });
}

/* ─── Page ──────────────────────────────────────────────── */
export default function ReplayPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.matchId as string;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.5 | 1 | 2

  const totalFrames = snapshots.length;

  /* Fetch replay */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    const fetchReplay = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/users/matches/${matchId}/replay`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          if (res.status === 401) { router.push("/login"); return; }
          if (res.status === 404) throw new Error("Match not found");
          throw new Error(`Server error ${res.status}`);
        }
        const data: ReplayData = await res.json();
        setReplayData(data);
        const snaps = Array.isArray(data.replayData) ? data.replayData : [];
        // Diagnostics — confirm data shape in browser console
        if (snaps.length > 0) {
          console.log('[Replay] First snapshot:', snaps[0]);
          console.log('[Replay] Robot data sample:', snaps[0]?.robots?.[0]);
          console.log('[Replay] Projectile data sample:', snaps[0]?.projectiles?.[0]);
        }
        setSnapshots(snaps);
      } catch (e: any) {
        setError(e.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchReplay();
  }, [matchId, router]);

  // Draw whenever currentFrame changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFrame(ctx, snapshots[currentFrame]);
  }, [currentFrame, snapshots]);

  // Playback - use isPlaying as ONLY trigger, clear on every run
  useEffect(() => {
    // ALWAYS clear first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPlaying || snapshots.length === 0) return;

    const ms = Math.round(500 / speed);
    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= snapshots.length - 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, ms);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed, snapshots.length]);

  // Handle initial draw when snapshots load
  useEffect(() => {
    if (snapshots.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFrame(ctx, snapshots[0]);
    setCurrentFrame(0);
  }, [snapshots]);

  const handlePlay = () => {
    console.log('[handlePlay] snapshots.length:', snapshots.length);
    if (snapshots.length === 0) return;
    if (currentFrame >= snapshots.length - 1) {
      setCurrentFrame(0);
    }
    setIsPlaying(true);
  };
  const handlePause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
  };
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setCurrentFrame(Number(e.target.value));
  };

  /* ── Render ── */
  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.4); } 50% { box-shadow: 0 0 0 6px rgba(34,211,238,0); } }
        .replay-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 22px; border-radius: 6px; font-size: 11px;
          font-weight: 700; letter-spacing: 0.14em; cursor: pointer;
          border: 1px solid rgba(34,211,238,0.4); background: rgba(34,211,238,0.08);
          color: #22d3ee; font-family: var(--font-geist-mono, monospace);
          transition: all 0.2s;
        }
        .replay-btn:hover { background: rgba(34,211,238,0.18); border-color: rgba(34,211,238,0.7); box-shadow: 0 0 12px rgba(34,211,238,0.3); }
        .replay-btn.active { background: rgba(34,211,238,0.22); border-color: #22d3ee; animation: pulse 1.5s infinite; }
        .speed-btn { padding: 6px 12px; border-radius: 4px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; cursor: pointer; border: 1px solid rgba(34,211,238,0.2);
          background: rgba(0,0,0,0.4); color: rgba(34,211,238,0.5);
          font-family: var(--font-geist-mono, monospace); transition: all 0.2s; }
        .speed-btn.active { color: #22d3ee; border-color: rgba(34,211,238,0.6); background: rgba(34,211,238,0.12); }
        .speed-btn:hover { color: #22d3ee; border-color: rgba(34,211,238,0.45); }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 4px;
          background: rgba(34,211,238,0.1); border-radius: 4px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px;
          border-radius: 50%; background: #22d3ee; cursor: pointer;
          box-shadow: 0 0 8px rgba(34,211,238,0.7); border: 2px solid rgba(0,0,0,0.6); }
      `}</style>

      <div style={{
        minHeight: "100vh", backgroundColor: "#030712",
        fontFamily: "var(--font-geist-mono, monospace)", color: "rgba(34,211,238,0.9)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grid BG */}
        <div style={{
          position: "fixed", inset: 0,
          backgroundImage: "linear-gradient(rgba(8,145,178,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{
          maxWidth: "860px", margin: "0 auto", padding: "40px 24px 80px",
          position: "relative", zIndex: 1, animation: "fadeIn 0.35s ease",
        }}>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <button onClick={() => router.back()} style={{
              background: "none", border: "none", color: "rgba(34,211,238,0.4)",
              cursor: "pointer", fontSize: "10px", letterSpacing: "0.2em",
              fontFamily: "inherit", marginBottom: "16px", padding: 0,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              ← BACK
            </button>
            <p style={{ fontSize: "8px", letterSpacing: "0.28em", color: "rgba(34,211,238,0.3)", marginBottom: "6px" }}>
              // MATCH_REPLAY
            </p>
            <h1 style={{
              fontSize: "clamp(20px, 3.5vw, 30px)", fontWeight: 900,
              letterSpacing: "0.16em", color: "#22d3ee", margin: 0,
              textShadow: "0 0 10px rgba(34,211,238,0.6), 0 0 30px rgba(34,211,238,0.25)",
            }}>
              REPLAY VIEWER
            </h1>
            {replayData && (
              <p style={{ marginTop: "8px", fontSize: "9px", color: "rgba(34,211,238,0.3)", letterSpacing: "0.14em" }}>
                ID: {replayData.id.slice(0, 8)}… &nbsp;·&nbsp;
                DURATION: {replayData.duration}s &nbsp;·&nbsp;
                {new Date(replayData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px", padding: "20px 24px", color: "#fca5a5",
              fontSize: "11px", letterSpacing: "0.12em",
            }}>
              [ERR] REPLAY UPLINK FAILURE: {error}
            </div>
          )}

          {/* Loading */}
          {loading && !error && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(34,211,238,0.3)", letterSpacing: "0.2em", fontSize: "11px" }}>
              DECRYPTING REPLAY DATA…
            </div>
          )}

          {/* No replay data */}
          {!loading && !error && snapshots.length === 0 && (
            <div style={{
              textAlign: "center", padding: "60px", border: "1px solid rgba(34,211,238,0.08)",
              borderRadius: "10px", background: "rgba(0,0,0,0.4)", color: "rgba(34,211,238,0.25)",
              fontSize: "11px", letterSpacing: "0.18em",
            }}>
              NO REPLAY DATA AVAILABLE FOR THIS MATCH.
              <div style={{ marginTop: "10px", fontSize: "9px", color: "rgba(34,211,238,0.15)" }}>
                Only matches played after the replay system was enabled are recorded.
              </div>
            </div>
          )}

          {/* Viewer */}
          {!loading && !error && snapshots.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>

              {/* Canvas */}
              <div style={{
                position: "relative", borderRadius: "10px", overflow: "hidden",
                border: "1px solid rgba(34,211,238,0.18)",
                boxShadow: "0 0 40px rgba(34,211,238,0.06), 0 0 0 1px rgba(34,211,238,0.05)",
              }}>
                <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
                {/* Corner accents */}
                {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos, i) => (
                  <div key={i} style={{
                    position: "absolute", width: "16px", height: "16px",
                    borderTop: i < 2 ? "2px solid rgba(34,211,238,0.5)" : "none",
                    borderBottom: i >= 2 ? "2px solid rgba(34,211,238,0.5)" : "none",
                    borderLeft: i % 2 === 0 ? "2px solid rgba(34,211,238,0.5)" : "none",
                    borderRight: i % 2 === 1 ? "2px solid rgba(34,211,238,0.5)" : "none",
                    ...pos,
                  }} />
                ))}
              </div>

              {/* Controls panel */}
              <div style={{
                width: "100%", maxWidth: `${CANVAS_W}px`,
                background: "rgba(0,0,0,0.6)", border: "1px solid rgba(34,211,238,0.12)",
                borderRadius: "10px", padding: "20px 22px", backdropFilter: "blur(12px)",
                display: "flex", flexDirection: "column", gap: "18px",
              }}>

                {/* Frame counter + Speed */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", letterSpacing: "0.18em", color: "rgba(34,211,238,0.6)", fontWeight: 700 }}>
                    FRAME <span style={{ color: "#22d3ee" }}>{currentFrame + 1}</span> / {totalFrames}
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {([0.5, 1, 2] as const).map((s) => (
                      <button key={s} className={`speed-btn${speed === s ? " active" : ""}`} onClick={() => setSpeed(s)}>
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrubber */}
                <input
                  type="range"
                  min={0}
                  max={totalFrames - 1}
                  value={currentFrame}
                  onChange={handleScrub}
                />

                {/* Play / Pause */}
                <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                  {isPlaying ? (
                    <button className="replay-btn active" onClick={handlePause}>⏸ PAUSE</button>
                  ) : (
                    <button className="replay-btn" onClick={handlePlay}>▶ PLAY</button>
                  )}
                  <button className="replay-btn" onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setIsPlaying(false); setCurrentFrame(0); }}>
                    ⏮ RESET
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div style={{
                width: "100%", maxWidth: `${CANVAS_W}px`,
                background: "rgba(0,0,0,0.35)", border: "1px solid rgba(34,211,238,0.07)",
                borderRadius: "8px", padding: "12px 18px",
                display: "flex", gap: "20px", flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "0.14em", color: "rgba(34,211,238,0.4)" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(34,211,238,0.2)", border: "1.5px solid #22d3ee" }} />
                  ROBOT
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "0.14em", color: "rgba(34,211,238,0.4)" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 6px #22d3ee" }} />
                  PROJECTILE
                </div>
                <div style={{ marginLeft: "auto", fontSize: "9px", letterSpacing: "0.12em", color: "rgba(34,211,238,0.25)" }}>
                  SPEED: {replayData ? (snapshots.length / replayData.duration).toFixed(1) : "—"} FRAMES/s
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

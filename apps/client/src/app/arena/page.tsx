"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiClient } from "../../lib/api-client";
import { useSocket } from "../../lib/useGameState";
import { Scene3D } from "./components/Scene3D";
import { CommandConsole } from "./components/CommandConsole";
import { GameState } from "./types/game.types";

interface RobotScript {
  id: string;
  title: string;
  content: string;
}

const ArenaPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scriptId = searchParams.get("scriptId");

  const [script, setScript] = useState<RobotScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRobotId, setSelectedRobotId] = useState<string>("");

  const { socket, gameState, isConnected } = useSocket(scriptId);

  const gameStateRef = useRef<GameState>({ robots: [], projectiles: [], obstacles: [] } as any);

  useEffect(() => {
    if (gameState) {
      const robotsData = (gameState as any).players || (gameState as any).robots || [];
      gameStateRef.current = {
        ...gameState,
        robots: robotsData,
        projectiles: (gameState as any).projectiles || [],
      } as any;

      if (robotsData.length > 0 && !selectedRobotId) {
        setSelectedRobotId(robotsData[0].id);
      }
    }
  }, [gameState, selectedRobotId]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    if (!scriptId) {
      setError("No script ID provided.");
      setLoading(false);
      return;
    }
    const fetchScript = async () => {
      try {
        const response = await apiClient.get(`/scripts/${scriptId}`);
        setScript(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchScript();
  }, [scriptId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-cyan-500 font-mono tracking-widest animate-pulse">UPLINKING TO NEURAL NETWORK...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-mono">CRITICAL_SYSTEM_ERROR: {error}</div>;

  const robots = (gameState as any)?.players || (gameState as any)?.robots || [];
  const availableRobots = robots.map((r: any) => r.id);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono select-none">

      {/* Brand Identity Header */}
      <div className="absolute top-6 left-8 z-30 pointer-events-none">
        <h1 className="text-4xl font-black tracking-tighter text-cyan-400 italic leading-none drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          LOGIC ARENA
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]"></span>
          <p className="text-[10px] text-cyan-700 tracking-[0.2em] font-bold">
            v1.1.0-beta [SENTIENT UPDATE]
          </p>
        </div>
      </div>

      {/* Center Title */}
      <div className="absolute top-6 left-0 w-full z-20 pointer-events-none flex justify-center opacity-40">
        <h2 className="text-xl font-bold text-red-500/80 tracking-[0.5em] uppercase italic">
          Arena: {script?.title}
        </h2>
      </div>

      {/* Respawn Trigger */}
      <div className="absolute top-24 left-8 z-20">
        <button
          type="button"
          onClick={() => socket?.emit("resetGame")}
          className="group relative border border-red-900/50 bg-red-950/10 text-red-500 text-[10px] font-black px-6 py-2 transition-all hover:bg-red-500/20 hover:border-red-500 tracking-[0.2em]"
        >
          <span className="relative z-10">[ INITIALIZE RESPAWN ]</span>
          <div className="absolute inset-0 bg-red-500/5 blur-sm group-hover:blur-md transition-all"></div>
        </button>
      </div>

      {/* 3D Scene Container */}
      <div className="absolute inset-0 z-0">
        <Scene3D
          gameStateRef={gameStateRef}
          obstacles={(gameState as any)?.obstacles || []}
          firedTracer={null}
          speechBubble={null}
        />
      </div>

      {/* Sidebar Command Console */}
      <div className="absolute left-8 top-40 bottom-8 w-[400px] z-20">
        <div className="h-full bg-black/40 backdrop-blur-md border border-cyan-900/30 rounded-sm shadow-2xl overflow-hidden flex flex-col">
          <CommandConsole
            socket={socket}
            robotId={selectedRobotId}
            availableRobots={availableRobots}
            onRobotChange={setSelectedRobotId}
          />
        </div>
      </div>

      {/* Tactical Radar View */}
      <div className="absolute top-8 right-8 z-20 w-72 h-56 group">
        <div className="absolute inset-0 bg-cyan-950/10 backdrop-blur-xl border border-cyan-500/20 rounded-sm overflow-hidden transition-all group-hover:border-cyan-400/50 shadow-2xl">

          {/* Header with status indicators */}
          <div className="bg-cyan-900/20 px-3 py-2 flex justify-between items-center border-b border-cyan-500/20">
            <span className="text-cyan-400 text-[10px] font-black tracking-[0.3em]">TACTICAL_VIEW</span>
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-cyan-500/40 animate-pulse"></span>
              <span className="w-1 h-1 bg-cyan-500/40 animate-pulse [animation-delay:200ms]"></span>
            </div>
          </div>

          <div className="relative w-full h-[calc(100%-30px)] p-0 overflow-hidden bg-[radial-gradient(circle,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px]">

            {/* Radar Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/20 shadow-[0_0_15px_#22d3ee] animate-scan z-10"></div>

            {/* Static Grid Overlay */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-10 pointer-events-none">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-cyan-500/30"></div>
              ))}
            </div>

            {/* Entity Rendering */}
            {robots.map((robot: any) => {
              const posX = (robot.position.x / 800) * 100;
              const posY = (robot.position.y / 600) * 100;

              return (
                <div
                  key={robot.id}
                  className="absolute transition-all duration-300 ease-linear"
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-5 h-5 rounded-full border border-current opacity-20 animate-ping" style={{ color: robot.color || "#00ffff" }}></div>
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-current drop-shadow-[0_0_8px_currentColor]" style={{ color: robot.color || "#00ffff", transform: `rotate(${robot.rotation || 0}deg)` }}></div>
                    <div className="absolute -top-4 w-6 h-1 bg-gray-900 border border-white/10">
                      <div className="h-full bg-green-500" style={{ width: `${robot.health || 100}%` }}></div>
                    </div>
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-1 border border-cyan-500/20">
                      <span className="text-[7px] text-cyan-400 font-mono font-bold whitespace-nowrap tracking-tighter uppercase">
                        {robot.id.slice(0, 4)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {((gameState as any)?.projectiles || []).map((p: any) => (
              <div
                key={p.id}
                className="absolute"
                style={{
                  left: `${(p.position.x / 800) * 100}%`,
                  top: `${(p.position.y / 600) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="w-1 h-1 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
  @keyframes scan {
    0% { transform: translateY(-10px); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(180px); opacity: 0; }
  }
  .animate-scan {
    animation: scan 4s linear infinite;
  }
`}</style>

      {/* System Status Indicators */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-cyan-800 font-bold uppercase tracking-widest">Connection_Status</span>
          <span className={`text-[11px] font-black tracking-widest ${isConnected ? 'text-cyan-400' : 'text-yellow-500 animate-pulse'}`}>
            {isConnected ? 'UPLINK_STABLE' : 'REESTABLISHING_LINK...'}
          </span>
        </div>
        <div className="h-8 w-[1px] bg-cyan-900/50"></div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-cyan-800 font-bold uppercase tracking-widest">Network_Latency</span>
          <span className="text-[11px] text-cyan-400 font-black tracking-widest">12ms</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          from { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          to { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ArenaPage;
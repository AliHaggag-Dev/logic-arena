"use client";

import React, { useRef, useEffect } from "react";
import { Scene3D } from "./components/Scene3D";
import { CommandConsole } from "./components/CommandConsole";
import { useGameState } from "./hooks/useGameState";

const Arena: React.FC = () => {
  const { gameStateRef, uiState, firedTracer, speechBubble, selectedRobotId, setSelectedRobotId, availableRobots, socket } = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mini-map rendering logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = 256;
      canvas.height = 192;
    };
    updateSize();

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const state = uiState;

      // Draw Projectiles
      state.projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.position.x / 3, p.position.y / 3, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#00FFFF";
        ctx.fill();
        ctx.closePath();
      });

      // Draw Robots
      state.robots.forEach(robot => {
        if (robot.position) {
          const scale = 3.125;
          const radius = 5;
          const x = robot.position.x / scale;
          const y = robot.position.y / scale;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = robot.color || "#00ffcc";
          ctx.fill();
          ctx.closePath();

          if (typeof robot.rotation === "number") {
            const lineLength = 10;
            const lineX = x + Math.cos(robot.rotation) * lineLength;
            const lineY = y + Math.sin(robot.rotation) * lineLength;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(lineX, lineY);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.closePath();
          }

          // Health Bar
          ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
          ctx.fillRect(x - 6, y - 12, 12, 2);
          ctx.fillStyle = "#00FFcc";
          ctx.fillRect(x - 6, y - 12, (robot.health / 100) * 12, 2);
        }
      });
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [uiState]);

  return (
    <div className="relative w-full h-screen bg-gray-950 overflow-hidden font-mono selection:bg-cyan-500/30">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Scene3D
          gameStateRef={gameStateRef}
          obstacles={uiState.obstacles}
          firedTracer={firedTracer}
          speechBubble={speechBubble}
        />
      </div>

      {/* Mini-map Canvas - Upgraded styling */}
      <div className="absolute top-6 right-6 p-1 bg-black/40 backdrop-blur-md border border-cyan-900/50 rounded-lg shadow-[0_0_30px_rgba(8,145,178,0.15)] z-10 pointer-events-none">
        <canvas
          ref={canvasRef}
          className="w-64 h-48 rounded opacity-80"
        />
        <div className="absolute top-2 left-2 text-[10px] text-cyan-500/70 tracking-widest font-bold">TACTICAL_VIEW</div>
      </div>

      {/* LEFT HUD OVERLAY - This flex-col prevents all overlapping */}
      <div className="absolute top-0 left-0 h-full w-[420px] flex flex-col justify-between p-6 z-30 pointer-events-none">

        {/* Top Header Section */}
        <div className="flex flex-col gap-5 pointer-events-auto">
          <div className="flex flex-col gap-1">
            <h1 className="text-cyan-400 font-black text-3xl tracking-[0.15em] drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">LOGIC ARENA</h1>
            <div className="text-cyan-600 text-xs tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              v1.1.0-beta [SENTIENT UPDATE]
            </div>
          </div>

          <button
            type="button"
            onClick={() => socket.emit("resetGame")}
            className="w-fit px-5 py-2 bg-red-950/40 border border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-900/60 hover:text-red-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all rounded uppercase tracking-[0.15em] backdrop-blur-sm"
          >
            [ Initialize Respawn ]
          </button>
        </div>

        {/* Bottom Console Section */}
        <div className="pointer-events-auto h-[65vh]">
          <CommandConsole
            socket={socket}
            robotId={selectedRobotId}
            availableRobots={availableRobots}
            onRobotChange={setSelectedRobotId}
          />
        </div>
      </div>
    </div>
  );
};

export default Arena;
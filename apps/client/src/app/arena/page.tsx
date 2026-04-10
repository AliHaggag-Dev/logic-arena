"use client";

import React, { useRef, useEffect } from "react";
import { Scene3D } from "./components/Scene3D";
import { CommandConsole } from "./components/CommandConsole";
import { useGameState } from "./hooks/useGameState";
import { useSceneSetup } from "./hooks/useSceneSetup";

const Arena: React.FC = () => {
  const { gameState, firedTracer, speechBubble, selectedRobotId, setSelectedRobotId, availableRobots, socket } = useGameState();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // This useEffect block for the 2D canvas rendering should remain in page.tsx
  // if the mini-map is not refactored into its own component.
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

      const state = gameState; // Use directly from useGameState

      // Draw Projectiles on Mini-map (Scaled down)
      state.projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.position.x / 3, p.position.y / 3, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#00FFFF";
        ctx.fill();
        ctx.closePath();
      });

      // Draw Robots on Mini-map (Scaled down)
      state.robots.forEach(robot => {
        if (robot.position) {
          // 800 / 256 = 3.125 (This is the perfect scale)
          const scale = 3.125;
          const radius = 5; // Visual radius

          const x = robot.position.x / scale;
          const y = robot.position.y / scale;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = robot.color;
          ctx.fill();
          ctx.closePath();

          if (typeof robot.rotation === "number") {
            const lineLength = 10;
            const lineX = x + Math.cos(robot.rotation) * lineLength;
            const lineY = y + Math.sin(robot.rotation) * lineLength;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(lineX, lineY);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.closePath();
          }

          // Health Bar exactly above the circle
          ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
          ctx.fillRect(x - 5, y - 12, 10, 2);
          ctx.fillStyle = "#00FF00";
          ctx.fillRect(x - 5, y - 12, (robot.health / 100) * 10, 2);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]); // Depend on gameState to re-render mini-map

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Scene3D
          robots={gameState.robots}
          projectiles={gameState.projectiles}
          obstacles={gameState.obstacles}
          firedTracer={firedTracer}
          speechBubble={speechBubble}
        />
      </div>

      {/* Mini-map Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-4 right-4 w-64 h-48 border border-blue-500/30 pointer-events-none z-10 bg-black/40 backdrop-blur-sm"
      />

      {/* Top-Left UI elements */}
      <div className="absolute top-10 left-10 flex flex-col gap-4 z-30">
        <button
          type="button"
          onClick={() => socket.emit("resetGame")}
          className="px-6 py-2 bg-green-500/10 border border-green-500/50 text-green-400 font-mono text-sm hover:bg-green-500/30 transition-all rounded-md uppercase tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.2)]"
        >
          [ INITIALIZE RESPAWN ]
        </button>

        <div className="text-blue-400 font-mono text-xs opacity-70">LOGIC ARENA v1.0.0-alpha [SENTIENT UPDATE]</div>
      </div>

      {/* Command Console */}
      <CommandConsole
        socket={socket}
        robotId={selectedRobotId}
        availableRobots={availableRobots}
        onRobotChange={setSelectedRobotId}
      />
    </div>
  );
};

export default Arena;

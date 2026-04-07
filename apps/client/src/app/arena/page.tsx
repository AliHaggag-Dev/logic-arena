"use client";

import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { Scene3D } from "./Scene3D";
import CommandConsole from "./CommandConsole";

interface RobotState {
  id: string;
  position: { x: number; y: number };
  color: string;
  health: number;
}

interface ProjectileState {
  id: string;
  position: { x: number; y: number };
}

const Arena: React.FC = () => {
  const socketRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<{
    robots: RobotState[];
    projectiles: ProjectileState[];
  }>({ robots: [], projectiles: [] });

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", () => console.log("✅ Socket Connected!"));

    socket.on("gameState", (data: any) => {
      if (data && data.robots) {
        setGameState({
          robots: Array.isArray(data.robots) ? [...data.robots] : [],
          projectiles: Array.isArray(data.projectiles) ? [...data.projectiles] : [],
        });
      } else if (Array.isArray(data)) {
        setGameState({ robots: [...data], projectiles: [] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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

      // Draw Projectiles on Mini-map (Scaled down)
      gameState.projectiles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.position.x / 3, p.position.y / 3, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#00FFFF";
        ctx.fill();
        ctx.closePath();
      });

      // Draw Robots on Mini-map (Scaled down)
      gameState.robots.forEach((robot) => {
        if (robot.position) {
          // 800 / 256 = 3.125 (This is the perfect scale)
          const scale = 3.125;
          const radius = 5; // Visual radius

          // We subtract half the radius to keep it inside the stroke
          const x = robot.position.x / scale;
          const y = robot.position.y / scale;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = robot.color;
          ctx.fill();
          ctx.closePath();

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
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Scene3D
          robots={gameState.robots}
          projectiles={gameState.projectiles}
        />
      </div>

      <canvas
        ref={canvasRef}
        className="absolute top-4 right-4 w-64 h-48 border border-blue-500/30 pointer-events-none z-10 bg-black/40 backdrop-blur-sm"
      />

      <div className="absolute top-10 left-10 flex flex-col gap-4 z-30">
        <button
          type="button"
          onClick={() => socketRef.current?.emit("resetGame")}
          className="px-6 py-2 bg-green-500/10 border border-green-500/50 text-green-400 font-mono text-sm hover:bg-green-500/30 transition-all rounded-md uppercase tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.2)]"
        >
          [ INITIALIZE RESPAWN ]
        </button>

        <div className="text-blue-400 font-mono text-xs opacity-70">
          LOGIC ARENA v0.4.0 [3D MODE ENABLED]
        </div>
      </div>

      <CommandConsole socket={socketRef.current} robotId="bot-1" /> {/* Assuming bot-1 is the player-controlled robot */}
    </div>
  );
};

export default Arena;
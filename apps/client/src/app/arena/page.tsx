"use client";

import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { Scene3D } from "./Scene3D";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<{
    robots: RobotState[];
    projectiles: ProjectileState[];
  }>({ robots: [], projectiles: [] });

  useEffect(() => {
    const socket = io("http://localhost:3001");

    socket.on("connect", () => console.log("✅ Socket Connected!"));

    // Receive the full game state object
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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Projectiles (Neon Sparks)
      gameState.projectiles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.position.x, p.position.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = "#00FFFF";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FFFFFF";
        ctx.fill();
        ctx.closePath();
      });

      // 2. Draw Robots and Health Bars
      gameState.robots.forEach((robot) => {
        if (robot.position) {
          // Robot Body
          ctx.beginPath();
          ctx.arc(robot.position.x, robot.position.y, 15, 0, Math.PI * 2);
          ctx.fillStyle = robot.color;
          ctx.shadowColor = robot.color;
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.closePath();

          // Health Bar Background
          const barWidth = 30;
          const barHeight = 4;
          ctx.shadowBlur = 0; // Disable glow for UI elements
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fillRect(robot.position.x - 15, robot.position.y - 25, barWidth, barHeight);

          // Health Bar Foreground
          const healthWidth = (robot.health / 100) * barWidth;
          ctx.fillStyle = robot.health > 30 ? "#00FF00" : "#FF0000";
          ctx.fillRect(robot.position.x - 15, robot.position.y - 25, healthWidth, barHeight);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateSize);
    };
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Scene3D robots={gameState.robots} />
      </div>

      <canvas
        ref={canvasRef}
        className="absolute top-4 right-4 w-64 h-48 border border-blue-500/30 pointer-events-none z-10"
      />

      <div className="absolute bottom-10 left-10 text-blue-400 font-mono z-20">
        LOGIC ARENA v0.4.0 [3D MODE ENABLED]
      </div>
    </div>
  );
};

export default Arena;
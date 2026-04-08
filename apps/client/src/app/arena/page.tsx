"use client";

import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { Scene3D } from "./Scene3D";
import { CommandConsole } from "./CommandConsole";

interface RobotState {
  id: string;
  position: { x: number; y: number };
  color: string;
  health: number;
  rotation: number;
  spotted?: boolean;
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
  const [firedTracer, setFiredTracer] = useState<{ robotId: string; targetPosition: { x: number; y: number; }; } | null>(null);
  const [speechBubble, setSpeechBubble] = useState<{ robotId: string; message: string; } | null>(null);
  const [selectedRobotId, setSelectedRobotId] = useState<string>("bot-1");

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket Connected!");
      socket.emit("join", { userId: socket.id });
    });

    socket.on("gameState", (data: any) => {
      if (data && data.robots) {
        setGameState({
          robots: Array.isArray(data.robots)
            ? data.robots.map((robot: RobotState) => ({
                ...robot,
                rotation: typeof robot.rotation === "number" ? robot.rotation : 0,
                spotted: typeof robot.spotted === "boolean" ? robot.spotted : undefined,
              }))
            : [],
          projectiles: Array.isArray(data.projectiles) ? [...data.projectiles] : [],
        });
      }
    });

    socket.on("logicExecuted", (data: { robotId: string; action: string; message?: string }) => {
      if (data.action === "FIRE") {
        setGameState(current => {
          const targetRobot = current.robots.find(r => r.id !== data.robotId);
          if (targetRobot) {
            setFiredTracer({ robotId: data.robotId, targetPosition: targetRobot.position });
            setTimeout(() => setFiredTracer(null), 100);
          }
          return current;
        });
      }

      setSpeechBubble({ robotId: data.robotId, message: data.message ?? data.action });
      setTimeout(() => setSpeechBubble(null), 1000);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Empty dependency array to run once on mount

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
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Scene3D
          robots={gameState.robots}
          projectiles={gameState.projectiles}
          firedTracer={firedTracer}
          speechBubble={speechBubble}
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
          LOGIC ARENA v1.0.0-alpha [SENTIENT UPDATE]
        </div>
      </div>

      <CommandConsole
        socket={socketRef.current}
        robotId={selectedRobotId}
        availableRobots={gameState.robots.map(r => r.id)}
        onRobotChange={setSelectedRobotId}
      />
    </div>
  );
};

export default Arena;
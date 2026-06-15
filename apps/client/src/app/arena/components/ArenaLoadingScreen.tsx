'use client';

import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { getGlobalAudioContext } from '../../../context/SoundContext';

// Hardcoded tips extracted from logic-arena documentation and docsData
const TIPS: string[] = [
  "MOVE propels the robot forward and costs 2 energy per tick. High-speed propulsion (MOVE_FAST) doubles speed and energy cost.",
  "Use BACKUP for reverse thrust. It consumes 2 energy per tick and can be used to retreat while facing the enemy.",
  "PATHFIND calculates a weighted A* path to the nearest visible enemy, avoiding obstacles, for 3 energy per tick.",
  "STOP halts all movement immediately and costs 0 energy. It can be executed even when in STASIS.",
  "SCAN rotates the scanner +15° per call, updating scanned_distance, scanned_angle, and scanned_spotted. It costs 3 energy.",
  "WAIT N suspends script execution for N ticks (60 ticks ≈ 1 second) at 0 energy. Energy does NOT regenerate during WAIT.",
  "FIRE shoots a single precision projectile toward the nearest visible enemy, dealing 25 HP on hit for 8 energy.",
  "BURST_FIRE shoots a rapid 3-shot burst dealing up to 24 HP total (8 HP per hit) for 18 energy.",
  "TELEPORT x y instantly warps you to the specified coordinates and sets velocity to zero, costing 80 energy.",
  "SHIELD blocks all incoming damage and projectiles for 30 ticks (1.5 seconds), costing 60 energy.",
  "CLOAK turns the robot completely invisible to enemy sensors, FOV, and radar for 40 ticks (2 seconds) for 50 energy.",
  "MINE drops a proximity mine at your current location. It arms after 250ms and deals 35 damage for 40 energy.",
  "DASH distance triggers an instant lateral thrust in the direction the robot is facing, ideal for dodging at 30 energy.",
  "SET commands (like assigning variables) execute even during STASIS. Use them to update state machines while immobilized.",
  "Compound boolean operators like AND and OR short-circuit evaluate, meaning the second condition is skipped if the first determines the result.",
  "Avoid TLE! AliScript has a strict limit of 2,000 operations per tick. Deeply nested WHILE loops can easily trigger crash penalties.",
  "Steer your tracks using SET rotation = X (in radians). This directs your movement speed but does not affect fovDirection.",
  "SET fovDirection = X aims your scanner cone independently from your robot's tracks rotation, allowing you to drive one way and look another.",
  "Set lockVision = TRUE to automatically sync your scanner cone (fovDirection) with your tracks' rotation on every tick.",
  "If lockVision is active, manual assignments to rotation or fovDirection will automatically disable lockVision.",
  "Use scanned_distance, scanned_angle, and scanned_spotted to query results from your last successful SCAN execution.",
  "When energy hits 0, you enter STASIS. You can only exit STASIS when energy regenerates back to 20 or more.",
  "While in STASIS, movement, scanning, and weapons are blocked. However, SET and WAIT commands can still run.",
  "Use target_vx, target_vy, and bullet_speed (400 units/s) to calculate leading shots and hit moving targets with high accuracy.",
  "Identify nearby obstacles using CAN_SEE_OBSTACLE and NEAREST_OBSTACLE_TYPE, which returns 'SOLID', 'TRAP', or 'LAVA'.",
  "Collect stars spawned across the map to increase your team's score and secure a tactical advantage.",
  "Lava pools deal continuous damage over time, while traps slow your robot down. Avoid them using A* PATHFIND or manual routing.",
  "You can write instructions in plain English or Arabic (e.g. 'انطلق للأمام وأطلق النار') and the AI Generator will compile it to AliScript!",
  "Always keep an eye on your MY_ENERGY and ENERGY_PCT. Running out of energy in the middle of a duel makes you a sitting duck.",
  "Define reusable subroutines using FUNCTION name ... END, and invoke them anywhere in your script using CALL name."
];

interface ArenaLoadingScreenProps {
  socket: { connected: boolean } | null;
  uiState: { robots: { id: string }[] } | null;
  scriptReady: boolean;
  isSpectator: boolean;
  onComplete: () => void;
}

export const ArenaLoadingScreen = ({
  socket,
  uiState,
  scriptReady,
  isSpectator,
  onComplete,
}: ArenaLoadingScreenProps): React.JSX.Element => {
  const [glbProgress, setGlbProgress] = useState<number>(0);
  const [texturesProgress, setTexturesProgress] = useState<number>(0);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [fadeTip, setFadeTip] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const isWebsocketConnected = !!socket?.connected;
  const isInitStateReceived = !!(uiState && uiState.robots && uiState.robots.length > 0);

  // 1. Preload GLB models to trigger DefaultLoadingManager
  useEffect((): (() => void) => {
    const GLB_FILES: string[] = [
      '/robots/robot.glb',
      '/robots/robot2.glb',
      '/robots/armored-robot.glb',
      '/robots/sandman.glb',
      '/robots/mecha.glb',
      '/robots/npc-robot.glb',
      '/robots/red_mecha.glb',
    ];

    const manager = THREE.DefaultLoadingManager;
    const prevOnProgress = manager.onProgress;
    const prevOnLoad = manager.onLoad;

    manager.onProgress = (url: string, loaded: number, total: number): void => {
      if (total > 0) {
        setGlbProgress(loaded / total);
      }
      if (prevOnProgress) prevOnProgress(url, loaded, total);
    };

    manager.onLoad = (): void => {
      setGlbProgress(1);
      if (prevOnLoad) prevOnLoad();
    };

    // Begin preload request sequence
    GLB_FILES.forEach((file: string): void => {
      useGLTF.preload(file);
    });

    // Cache fallback: If resources load instantly or do not hit request managers
    const fallback = setTimeout((): void => {
      setGlbProgress(1);
    }, 2500);

    return (): void => {
      manager.onProgress = prevOnProgress;
      manager.onLoad = prevOnLoad;
      clearTimeout(fallback);
    };
  }, []);

  // 2. Simulate procedural textures compile pipeline
  useEffect((): (() => void) => {
    let current = 0;
    const interval = setInterval((): void => {
      if (current < 0.95) {
        current += 0.08 + Math.random() * 0.12;
        if (current >= 0.95) {
          current = 0.95;
          clearInterval(interval);
        }
        setTexturesProgress(current);
      }
    }, 100);
    return (): void => clearInterval(interval);
  }, []);

  // Listen for actual WebGL scene first-frame signal
  useEffect((): (() => void) => {
    const handleFirstFrame = (): void => {
      setTexturesProgress(1.0);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('scene-first-frame', handleFirstFrame);
    }
    return (): void => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scene-first-frame', handleFirstFrame);
      }
    };
  }, []);

  // 3. Audio Context connection check
  useEffect((): (() => void) => {
    const checkAudio = (): void => {
      const ctx = getGlobalAudioContext();
      if (ctx && ctx.state === 'running') {
        setAudioReady(true);
      } else {
        setAudioReady(false);
      }
    };

    checkAudio();
    const interval = setInterval(checkAudio, 300);

    return (): void => clearInterval(interval);
  }, []);

  // Audio activation trigger
  const handleActivateAudio = async (): Promise<void> => {
    const ctx = getGlobalAudioContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
        setAudioReady(true);
      } catch (e: unknown) {
        console.warn('Failed to resume AudioContext:', e);
      }
    }
  };

  // 4. Tips Rotation Loop (every 4 seconds)
  useEffect((): (() => void) => {
    const interval = setInterval((): void => {
      setFadeTip(false);
      setTimeout((): void => {
        setTipIndex((prev: number): number => (prev + 1) % TIPS.length);
        setFadeTip(true);
      }, 400);
    }, 4000);
    return (): void => clearInterval(interval);
  }, []);

  // Calculate percentages and weights
  const glbPct = Math.round(glbProgress * 100);
  const texturesPct = Math.round(texturesProgress * 100);

  const totalProgress = Math.min(100, Math.round(
    (glbProgress * 35) +
    (texturesProgress * 15) +
    (isWebsocketConnected ? 15 : 0) +
    (isInitStateReceived ? 20 : 0) +
    (scriptReady ? 10 : 0) +
    (audioReady ? 5 : 0)
  ));

  const allReadyExceptAudio = glbProgress === 1 && texturesProgress === 1 && isWebsocketConnected && isInitStateReceived && scriptReady;
  const isFullyLoaded = allReadyExceptAudio && audioReady;

  // Handle completion fade-out
  useEffect((): (() => void) | undefined => {
    let delay: NodeJS.Timeout | undefined;
    let unmountTimer: NodeJS.Timeout | undefined;

    if (isFullyLoaded) {
      delay = setTimeout((): void => {
        setIsFadingOut(true);
        unmountTimer = setTimeout((): void => {
          onComplete();
        }, 800); // 800ms match the CSS transition duration
      }, 500); // Wait 500ms at 100% before starting fade-out

      return (): void => {
        if (delay) clearTimeout(delay);
        if (unmountTimer) clearTimeout(unmountTimer);
      };
    }
    return undefined;
  }, [isFullyLoaded, onComplete]);

  return (
    <div className={`cyber-loader-container ${isFadingOut ? 'fade-out' : ''}`}>
      <style>{`
        .cyber-loader-container {
          --cyber-cyan: #00fff7;
          --cyber-bg: #050510;
          --cyber-dark-gray: #10121a;
          --cyber-darker-gray: #06070a;
          --cyber-green: #39ff14;
          --cyber-pink: #ff007f;
          --cyber-white: #ffffff;
          --cyber-blue: #0088ff;

          position: fixed;
          inset: 0;
          z-index: 9999;
          background-color: var(--cyber-bg);
          background-image: 
            linear-gradient(rgba(0, 255, 247, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 247, 0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: cyberGrid 25s linear infinite;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 3rem 2rem;
          color: var(--cyber-cyan);
          font-family: 'Orbitron', 'Space Grotesk', 'Courier New', Courier, monospace;
          transition: opacity 0.8s ease-in-out, visibility 0.8s ease-in-out;
          opacity: 1;
          visibility: visible;
          overflow: hidden;
        }

        .cyber-loader-container.fade-out {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        @keyframes cyberGrid {
          0% { background-position: 0 0; }
          100% { background-position: 1000px 1000px; }
        }

        .header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 1rem;
        }

        .glitch-title {
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: 0.5rem;
          text-transform: uppercase;
          position: relative;
          color: var(--cyber-white);
          text-shadow: 
            0 0 10px var(--cyber-cyan), 
            0 0 20px var(--cyber-cyan), 
            -2px 0 var(--cyber-pink), 
            2px 0 var(--cyber-blue);
          margin-bottom: 0.5rem;
          animation: titlePulse 2s infinite ease-in-out;
        }

        @keyframes titlePulse {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.02); opacity: 1; }
        }

        .subtitle {
          font-size: 0.8rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--cyber-cyan);
          opacity: 0.8;
          text-shadow: 0 0 5px rgba(0, 255, 247, 0.5);
        }

        .center-graphic {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 2rem 0;
        }

        .robot-svg-wrapper {
          width: 140px;
          height: 140px;
          position: relative;
          animation: pulseGlow 3s infinite ease-in-out;
        }

        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(0, 255, 247, 0.4)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 20px rgba(0, 255, 247, 0.8)); transform: scale(1.04); }
        }

        .scanline {
          position: absolute;
          width: 100%;
          height: 4px;
          background: linear-gradient(to bottom, rgba(0, 255, 247, 0), var(--cyber-cyan), rgba(0, 255, 247, 0));
          animation: scan 2s linear infinite;
          opacity: 0.7;
          pointer-events: none;
        }

        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }

        .status-panel {
          width: 100%;
          max-width: 550px;
          background: rgba(10, 11, 16, 0.75);
          border: 1px solid rgba(0, 255, 247, 0.2);
          border-radius: 4px;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 0 25px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(0, 255, 247, 0.05);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 0.75rem;
        }

        .overall-pct {
          font-size: 2rem;
          font-weight: 900;
          color: var(--cyber-white);
          text-shadow: 0 0 10px var(--cyber-cyan);
          line-height: 1;
        }

        .overall-label {
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.7;
        }

        .progress-bar-bg {
          width: 100%;
          height: 10px;
          background-color: var(--cyber-darker-gray);
          border: 1px solid rgba(0, 255, 247, 0.3);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 1.25rem;
          position: relative;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--cyber-cyan), var(--cyber-blue));
          box-shadow: 0 0 8px var(--cyber-cyan);
          transition: width 0.3s ease-out;
        }

        .stages-list {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
        }

        .stage-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Courier New', Courier, monospace;
        }

        .stage-name {
          opacity: 0.85;
          text-transform: uppercase;
        }

        .stage-status {
          font-weight: bold;
        }

        .status-ok {
          color: var(--cyber-green);
          text-shadow: 0 0 4px rgba(57, 255, 20, 0.5);
        }

        .status-loading {
          color: var(--cyber-cyan);
          animation: textPulse 1s infinite alternate;
        }

        @keyframes textPulse {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .status-pending {
          color: var(--cyber-pink);
          opacity: 0.7;
        }

        .audio-prompt-container {
          margin-top: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .cyber-btn {
          background: transparent;
          border: 1px solid var(--cyber-pink);
          color: var(--cyber-white);
          padding: 0.6rem 1.5rem;
          font-family: inherit;
          font-size: 0.75rem;
          font-weight: bold;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(255, 0, 127, 0.3);
          transition: all 0.2s ease;
          outline: none;
          position: relative;
        }

        .cyber-btn:hover {
          background-color: var(--cyber-pink);
          color: var(--cyber-bg);
          box-shadow: 0 0 20px var(--cyber-pink);
          text-shadow: none;
        }

        .tips-container {
          width: 100%;
          max-width: 650px;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(16, 18, 26, 0.45);
          border: 1px solid rgba(0, 255, 247, 0.1);
          border-radius: 4px;
          padding: 1rem 1.5rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .tips-label {
          font-size: 0.65rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--cyber-cyan);
          opacity: 0.6;
          margin-bottom: 0.5rem;
        }

        .tip-text {
          font-size: 0.75rem;
          line-height: 1.4;
          color: var(--cyber-white);
          opacity: 0.9;
          transition: opacity 0.4s ease-in-out;
          font-family: inherit;
        }

        .tip-text.fade-out {
          opacity: 0;
        }

        .tip-text.fade-in {
          opacity: 0.9;
        }
      `}</style>

      <div className="header">
        <h1 className="glitch-title">Logic Arena</h1>
        <div className="subtitle">Preparing your Arena</div>
      </div>

      <div className="center-graphic">
        <div className="robot-svg-wrapper">
          <svg className="robot-svg" viewBox="0 0 100 100" width="100%" height="100%" aria-label="Cyberpunk Robot Silhouette animate">
            <title>Cyberpunk Robot Silhouette</title>
            {/* Cyberpunk styled Robot silhouette */}
            <path 
              d="M25,25 L75,25 L82,55 L68,82 L32,82 L18,55 Z" 
              fill="none" 
              stroke="var(--cyber-cyan)" 
              strokeWidth="2.5" 
            />
            {/* Eyes */}
            <line x1="33" y1="42" x2="45" y2="42" stroke="var(--cyber-cyan)" strokeWidth="3" />
            <line x1="55" y1="42" x2="67" y2="42" stroke="var(--cyber-cyan)" strokeWidth="3" />
            {/* Mouth */}
            <path d="M42,62 L58,62" stroke="var(--cyber-cyan)" strokeWidth="2" fill="none" />
            {/* Ears */}
            <path d="M12,38 L18,43 L12,48" fill="none" stroke="var(--cyber-cyan)" strokeWidth="2" />
            <path d="M88,38 L82,43 L88,48" fill="none" stroke="var(--cyber-cyan)" strokeWidth="2" />
            {/* Antenna */}
            <line x1="50" y1="12" x2="50" y2="25" stroke="var(--cyber-cyan)" strokeWidth="2" />
            <circle cx="50" cy="11" r="3.5" fill="var(--cyber-cyan)" />
            {/* Interior circuitry details */}
            <path d="M32,82 L50,55 L68,82" stroke="rgba(0, 255, 247, 0.3)" strokeWidth="1" fill="none" />
          </svg>
          <div className="scanline" />
        </div>
      </div>

      <div className="status-panel">
        <div className="progress-header">
          <div>
            <div className="overall-label">Loading Progress</div>
            <div className="overall-pct">{totalProgress}%</div>
          </div>
          <div className="overall-label" style={{ opacity: 0.5 }}>
            {totalProgress === 100 ? 'LINK STABLE' : 'LOADING ROBOT MODELS...'}
          </div>
        </div>

        <div className="progress-bar-bg" aria-label="Loading Progress Bar" role="progressbar" aria-valuenow={totalProgress} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar-fill" style={{ width: `${totalProgress}%` }} />
        </div>

        <div className="stages-list">
          <div className="stage-row">
            <span className="stage-name">1. Loading Robot Models (35%)</span>
            <span className={`stage-status ${glbProgress === 1 ? 'status-ok' : 'status-loading'}`}>
              {glbProgress === 1 ? '[ OK ]' : `[ ${glbPct}% ]`}
            </span>
          </div>
          <div className="stage-row">
            <span className="stage-name">2. Building Arena Environment (15%)</span>
            <span className={`stage-status ${texturesProgress === 1 ? 'status-ok' : 'status-loading'}`}>
              {texturesProgress === 1 ? '[ OK ]' : `[ ${texturesPct}% ]`}
            </span>
          </div>
          <div className="stage-row">
            <span className="stage-name">3. Connecting to Server (15%)</span>
            <span className={`stage-status ${isWebsocketConnected ? 'status-ok' : 'status-pending'}`}>
              {isWebsocketConnected ? '[ OK ]' : '[ PENDING ]'}
            </span>
          </div>
          <div className="stage-row">
            <span className="stage-name">4. Syncing Match Data (20%)</span>
            <span className={`stage-status ${isInitStateReceived ? 'status-ok' : 'status-pending'}`}>
              {isInitStateReceived ? '[ OK ]' : '[ PENDING ]'}
            </span>
          </div>
          <div className="stage-row">
            <span className="stage-name">5. Loading Your Script (10%)</span>
            <span className={`stage-status ${scriptReady ? 'status-ok' : 'status-pending'}`}>
              {scriptReady ? '[ OK ]' : '[ PENDING ]'}
            </span>
          </div>
          <div className="stage-row">
            <span className="stage-name">6. Initializing Audio (5%)</span>
            <span className={`stage-status ${audioReady ? 'status-ok' : 'status-pending'}`}>
              {audioReady ? '[ OK ]' : '[ MUTED ]'}
            </span>
          </div>
        </div>

        {allReadyExceptAudio && !audioReady && (
          <div className="audio-prompt-container">
            <button 
              type="button" 
              onClick={handleActivateAudio}
              className="cyber-btn"
            >
              ESTABLISH NEURAL LINK
            </button>
          </div>
        )}
      </div>

      <div className="tips-container">
        <div className="tips-label">PRO TIP</div>
        <p className={`tip-text ${fadeTip ? 'fade-in' : 'fade-out'}`}>
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
};

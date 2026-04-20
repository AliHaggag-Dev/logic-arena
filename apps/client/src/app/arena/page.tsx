'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api-client';
import { useGameState } from './hooks/useGameState';
import { Scene3D } from './components/Scene3D';
import { CommandConsole } from './components/CommandConsole';
import WinnerScreen from './components/WinnerScreen';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { TacticalRadar } from './components/TacticalRadar';
import { BottomSheet } from './components/BottomSheet';
import { ArenaControls } from './components/ArenaControls';

interface RobotScript {
  id: string;
  title: string;
  content: string;
}

const ROBOT_FILES: Record<string, string> = {
  'unit-01': '/robot.glb',
  'unit-02': '/robot2.glb',
};

// ── FPS Hook ─────────────────────────────────────────────────────────────────
function useFPS() {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;
      if (delta >= 500) {
        setFps(Math.round((frameCount.current / delta) * 1000));
        frameCount.current = 0;
        lastTime.current = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}

// ── Mobile Top-Right HUD ──────────────────────────────────────────────────────
interface MobileHUDProps {
  fps: number;
  fogEnabled: boolean;
  setFogEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  socket: any;
  isConnected: boolean;
  robots: any[];
  obstacles: any[];
  projectiles: any[];
  displayMode: string;
}

const MobileTopRightHUD: React.FC<MobileHUDProps> = ({
  fps, fogEnabled, setFogEnabled, socket, isConnected,
  robots, obstacles, projectiles, displayMode,
}) => {
  const fpsColor = fps >= 50 ? '#4ade80' : fps >= 30 ? '#facc15' : '#f87171';

  return (
    <>
      {/* ── Top Right: Tactical Map + Action Buttons beside it ── */}
      <div className="fixed top-3 right-3 z-40 flex flex-row-reverse items-start gap-2">

        {/* Tactical Map */}
        <div className="w-28 bg-black/50 backdrop-blur-md border border-cyan-500/15 rounded-xl overflow-hidden shadow-xl">
          <div className="px-2 py-0.5 border-b border-cyan-500/10 flex justify-between items-center">
            <span className="text-[6px] text-cyan-700 font-black tracking-widest uppercase">Tactical</span>
            <span className="w-1 h-1 bg-cyan-400/60 rounded-full animate-pulse" />
          </div>
          <div className="aspect-square w-full">
            <TacticalRadar
              isMobile={true}
              isExpanded={false}
              robots={robots}
              obstacles={obstacles}
              projectiles={projectiles}
              fogEnabled={fogEnabled}
              displayMode={displayMode}
            />
          </div>
        </div>

        {/* Action Buttons — to the LEFT of the map, stacked vertically */}
        <div className="flex flex-col gap-2 pt-1">

          {/* Respawn Button */}
          <button
            onClick={() => socket?.emit('resetGame')}
            className="group flex items-center gap-1.5 px-2 py-1.5 bg-black/50 backdrop-blur-md border border-red-500/30 rounded-lg hover:border-red-400/60 hover:bg-red-950/30 active:scale-95 transition-all shadow-[0_0_8px_rgba(239,68,68,0.1)] hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
          >
            <span className="relative flex items-center justify-center w-2 h-2">
              <span className="absolute w-2 h-2 rounded-full bg-red-500/30 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
            </span>
            <span className="text-[7px] text-red-400/70 font-black tracking-widest uppercase">Respawn</span>
          </button>

          {/* Fog Button */}
          <button
            onClick={() => setFogEnabled(prev => !prev)}
            className={`group flex items-center gap-1.5 px-2 py-1.5 backdrop-blur-md border rounded-lg active:scale-95 transition-all ${fogEnabled
              ? 'bg-cyan-950/40 border-cyan-500/40 hover:border-cyan-400/70 hover:bg-cyan-900/30 shadow-[0_0_8px_rgba(34,211,238,0.15)] hover:shadow-[0_0_12px_rgba(34,211,238,0.35)]'
              : 'bg-black/50 border-white/10 hover:border-white/25 hover:bg-white/5'
              }`}
          >
            <span className="relative flex items-center justify-center w-2 h-2">
              {fogEnabled && <span className="absolute w-2 h-2 rounded-full bg-cyan-500/30 animate-ping" />}
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${fogEnabled
                ? 'bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]'
                : 'bg-white/25'
                }`} />
            </span>
            <span className={`text-[7px] font-black tracking-widest uppercase transition-colors ${fogEnabled ? 'text-cyan-400/70' : 'text-white/25'
              }`}>
              {fogEnabled ? 'Fog On' : 'Fog Off'}
            </span>
          </button>

        </div>
      </div>

      {/* ── Bottom Right: FPS + Connection ── */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/30 backdrop-blur-sm border border-white/5 rounded-full">
          <span className="text-[7px] text-white/20 font-mono uppercase tracking-widest">fps</span>
          <span
            className="text-[10px] font-black font-mono tabular-nums transition-colors duration-300"
            style={{ color: fpsColor }}
          >
            {fps}
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-black/30 backdrop-blur-sm border border-white/5 rounded-full">
          <span className={`w-1 h-1 rounded-full ${isConnected
            ? 'bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]'
            : 'bg-yellow-400 animate-pulse'
            }`} />
          <span className="text-[7px] font-mono text-white/20 tracking-widest uppercase">
            {isConnected ? 'uplink' : 'linking'}
          </span>
        </div>
      </div>
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ArenaPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scriptId = searchParams.get('scriptId');
  const urlMode = searchParams.get('mode') || 'COMBAT';
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const fps = useFPS();

  const [script, setScript] = useState<RobotScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [localRobotFile, setLocalRobotFile] = useState('/robot.glb');
  const [localRobotColor, setLocalRobotColor] = useState('#22d3ee');
  const [activeSheet, setActiveSheet] = useState<'controls' | 'tactical' | 'script' | null>(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const {
    socket, gameStateRef, uiState,
    selectedRobotId, setSelectedRobotId, availableRobots,
    matchResult, serverConfirmedMode,
    fogEnabled, setFogEnabled,
    firedTracer, speechBubble,
  } = useGameState(scriptId, urlMode);

  const displayMode = serverConfirmedMode;
  const projectileAnimRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => { projectileAnimRef.current = requestAnimationFrame(animate); };
    projectileAnimRef.current = requestAnimationFrame(animate);
    return () => { if (projectileAnimRef.current) cancelAnimationFrame(projectileAnimRef.current); };
  }, []);

  useEffect(() => {
    apiClient.get('/users/profile').then((res) => {
      const file = ROBOT_FILES[res.data.selectedRobotId] ?? '/robot.glb';
      setLocalRobotFile(file);
      if (res.data.selectedColor) setLocalRobotColor(res.data.selectedColor);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    if (!scriptId) { setError('No script ID provided.'); setLoading(false); return; }
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

  const robots = uiState?.robots || [];
  const obstacles = uiState?.obstacles || [];
  const projectiles = gameStateRef.current?.projectiles || [];
  const isConnected = !!socket?.connected;
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const matchId = searchParams.get('matchId') || 'default-match';

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono select-none">

      {/* ── Orientation Lock Overlay ── */}
      {isMobile && isPortrait && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center overflow-hidden">
          <div
            className="absolute inset-0 z-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(34,211,238,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.2) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-overlay opacity-20">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-[scanline_3s_linear_infinite]" />
          </div>
          <div className="relative mb-12">
            <div className="w-32 h-32 border-2 border-cyan-500/20 rounded-full animate-ping opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="relative animate-[rotate-phone_3s_ease-in-out_infinite]">
              <div className="w-16 h-28 border-4 border-cyan-500 rounded-2xl relative shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-700 rounded-full" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-cyan-700 rounded-full" />
                <div className="absolute inset-2 bg-cyan-500/10 rounded-sm overflow-hidden">
                  <div className="w-full h-1 bg-cyan-500/40 animate-scan" />
                </div>
              </div>
            </div>
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-cyan-400 text-4xl font-black animate-pulse">↻</div>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              <h2 className="text-cyan-400 text-xl font-black tracking-[0.2em] uppercase italic">Orientation_Lock</h2>
            </div>
            <p className="text-cyan-500/60 text-xs tracking-[0.3em] font-bold max-w-[240px] uppercase leading-relaxed">
              Combat systems optimized for horizontal field of view.
            </p>
            <div className="mt-8 px-6 py-4 border border-cyan-500/30 bg-cyan-500/5 rounded-lg">
              <span className="text-cyan-400 text-sm font-black tracking-[0.4em] uppercase animate-pulse">Rotate Device to Enter</span>
            </div>
          </div>
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-10 text-[10px] tracking-[1em] text-cyan-500 font-bold whitespace-nowrap">
            LOGIC_ARENA_SECURITY_PROTOCOL_V4.2
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes neural-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(34,211,238,0.1), inset 0 0 2px rgba(34,211,238,0.05); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(34,211,238,0.4), inset 0 0 8px rgba(34,211,238,0.2); border-color: rgba(34,211,238,0.7); }
        }
        .animate-neural-pulse { animation: neural-pulse 3s ease-in-out infinite; }
        .animate-neural-pulse-delayed { animation: neural-pulse 3s ease-in-out 1s infinite; }
        .animate-neural-pulse-more-delayed { animation: neural-pulse 3s ease-in-out 2s infinite; }
        @keyframes scanline {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes rotate-phone {
          0%, 100% { transform: rotate(0deg); }
          40%, 60% { transform: rotate(-90deg); }
        }
        @keyframes sweep {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>

      {matchResult && (
        <WinnerScreen
          matchResult={matchResult}
          currentUserId={currentUserId}
          socket={socket}
          matchId={matchId}
        />
      )}

      {/* ── 3D Scene ── */}
      <div className="absolute inset-0 z-0">
        <Scene3D
          gameStateRef={gameStateRef}
          obstacles={obstacles}
          firedTracer={firedTracer ?? null}
          speechBubble={speechBubble ?? null}
          fogEnabled={fogEnabled}
          localRobotFile={localRobotFile}
          localRobotColor={localRobotColor}
        />
      </div>

      {/* ── Mobile Top-Right HUD (Tactical + Dots + FPS + Status) ── */}
      {isMobile && (
        <MobileTopRightHUD
          fps={fps}
          fogEnabled={fogEnabled}
          setFogEnabled={setFogEnabled}
          socket={socket}
          isConnected={isConnected}
          robots={robots}
          obstacles={obstacles}
          projectiles={projectiles}
          displayMode={displayMode}
        />
      )}

      {/* ── Mobile Dual FABs ── */}
      {isMobile && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[50] flex flex-row items-center gap-5 pointer-events-auto">
          <button
            onClick={() => setActiveSheet(activeSheet === 'controls' ? null : 'controls')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${activeSheet === 'controls'
              ? 'bg-cyan-500/90 shadow-[0_0_16px_rgba(34,211,238,0.6)] scale-105'
              : 'bg-black/70 border border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.6)]'
              }`}
          >
            <span className="text-base">⚡</span>
          </button>

          <button
            onClick={() => setActiveSheet(activeSheet === 'script' ? null : 'script')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${activeSheet === 'script'
              ? 'bg-cyan-500/90 shadow-[0_0_16px_rgba(34,211,238,0.6)] scale-105'
              : 'bg-black/70 border border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.6)]'
              }`}
          >
            <span className="text-base">📟</span>
          </button>
        </div>
      )}

      {/* ── Bottom Sheets ── */}
      {isMobile && (
        <>
          {/* CONTROLS sheet — override + telemetry + bot selector */}
          <BottomSheet
            isMobile={isMobile}
            isOpen={activeSheet === 'controls'}
            onClose={() => setActiveSheet(null)}
            title="COMBAT_OVERRIDE"
          >
            <CommandConsole
              socket={socket}
              robotId={selectedRobotId}
              scriptId={scriptId}
              availableRobots={availableRobots}
              onRobotChange={setSelectedRobotId}
              isMobile={isMobile}
              mobileSheet="controls"
            />
          </BottomSheet>

          {/* SCRIPT sheet — zen editor + neural handbook */}
          <BottomSheet
            isMobile={isMobile}
            isOpen={activeSheet === 'script'}
            onClose={() => setActiveSheet(null)}
            title="ALISCRIPT_EDITOR"
          >
            <CommandConsole
              socket={socket}
              robotId={selectedRobotId}
              scriptId={scriptId}
              availableRobots={availableRobots}
              onRobotChange={setSelectedRobotId}
              isMobile={isMobile}
              mobileSheet="script"
            />
          </BottomSheet>
        </>
      )}

      {/* ── Desktop Toggle Button ── */}
      {!isMobile && (
        <button
          onClick={() => setIsLeftPanelOpen(prev => !prev)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-40 bg-black/80 backdrop-blur-xl border-y border-r border-cyan-500/50 rounded-r-2xl cursor-pointer group hover:w-16 hover:bg-cyan-950/80 transition-all shadow-[8px_0_30px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(34,211,238,0.2)]"
        >
          <div className="flex flex-col items-center justify-center gap-4 h-full w-full">
            <span className="text-cyan-400 font-black tracking-[0.2em] transform -rotate-90 whitespace-nowrap text-[10px] opacity-50 group-hover:opacity-100 transition-opacity">
              {isLeftPanelOpen ? 'ZEN_MODE' : 'SYS_HUD'}
            </span>
            <span className={`text-cyan-400 font-mono text-2xl font-black transition-transform duration-500 drop-shadow-[0_0_10px_#22d3ee] ${isLeftPanelOpen ? 'rotate-0' : 'rotate-180'}`}>
              {'<'}
            </span>
          </div>
        </button>
      )}

      {/* ── Desktop HUD ── */}
      {!isMobile && (
        <div className={`absolute inset-0 z-30 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
          <div className="absolute top-6 left-8 pointer-events-none">
            <h1 className="text-4xl font-black tracking-tighter text-cyan-400 italic leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
              LOGIC ARENA
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full animate-pulse ${displayMode === 'RACING' ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' :
                displayMode === 'TRAINING_SOLO' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' :
                  'bg-red-500 shadow-[0_0_8px_#ef4444]'
                }`} />
              <p className={`text-[10px] tracking-[0.2em] font-bold ${displayMode === 'RACING' ? 'text-yellow-700' :
                displayMode === 'TRAINING_SOLO' ? 'text-green-700' : 'text-red-700'
                }`}>
                v2.0.0 {displayMode === 'RACING' ? '[RACING OVAL]' : displayMode === 'TRAINING_SOLO' ? '[TRAINING SOLO]' : '[COMBAT ARENA]'}
              </p>
            </div>
          </div>

          <div className="absolute top-6 left-[450px] pointer-events-none flex opacity-40">
            <h2 className="text-xl font-bold text-red-500/80 tracking-[0.5em] uppercase italic">
              Arena: {script?.title}
            </h2>
          </div>

          <div className="absolute top-28 left-8 pointer-events-auto flex items-center gap-3 bg-black/80 backdrop-blur-xl border-l-4 border-cyan-500 p-4 rounded-r shadow-[10px_10px_30px_rgba(0,0,0,0.9)]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/50 to-transparent" />
            <button
              type="button"
              onClick={() => socket?.emit('resetGame')}
              className="group relative border border-red-900 bg-red-950/30 text-red-500 text-[10px] font-black px-6 py-2.5 transition-all hover:bg-red-900/50 hover:border-red-500 hover:text-white tracking-[0.2em] overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <span className="relative z-10">[ EXECUTE RESPAWN ]</span>
              <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-red-500/30 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
            </button>
            <button
              type="button"
              onClick={() => setFogEnabled(prev => !prev)}
              className={`group relative border text-[10px] font-black px-6 py-2.5 transition-all tracking-[0.2em] overflow-hidden ${fogEnabled
                ? 'border-cyan-500 bg-cyan-900/40 text-cyan-300 hover:bg-cyan-500/40 hover:text-white shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]'
                : 'border-white/20 bg-white/5 text-white/50 hover:bg-white/10 hover:border-white/40'
                }`}
            >
              <span className="relative z-10">[ FOG_SYSTEM: {fogEnabled ? 'ONLINE' : 'OFFLINE'} ]</span>
              {fogEnabled && (
                <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
              )}
            </button>
          </div>

          <div className="absolute left-8 top-44 bottom-8 pointer-events-auto flex" style={{ minWidth: '400px' }}>
            <CommandConsole
              socket={socket}
              robotId={selectedRobotId}
              scriptId={scriptId}
              availableRobots={availableRobots}
              onRobotChange={setSelectedRobotId}
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      {/* ── Desktop Tactical Radar ── */}
      {!isMobile && (
        <div className="absolute top-8 right-8 z-20 w-72 h-56 group">
          <div className="absolute inset-0 bg-cyan-950/10 backdrop-blur-xl border border-cyan-500/20 rounded-sm overflow-hidden transition-all group-hover:border-cyan-400/50 shadow-2xl">
            <div className="bg-cyan-900/20 px-3 py-2 flex justify-between items-center border-b border-cyan-500/20">
              <span className="text-cyan-400 text-[10px] font-black tracking-[0.3em]">TACTICAL_VIEW</span>
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-cyan-500/40 animate-pulse" />
                <span className="w-1 h-1 bg-cyan-500/40 animate-pulse [animation-delay:200ms]" />
              </div>
            </div>
            <TacticalRadar
              isMobile={isMobile}
              robots={robots}
              obstacles={obstacles}
              projectiles={projectiles}
              fogEnabled={fogEnabled}
              displayMode={displayMode}
            />
          </div>
        </div>
      )}

      {/* ── Desktop Status Bar ── */}
      {!isMobile && (
        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-cyan-800 font-bold uppercase tracking-widest">Connection_Status</span>
            <span className={`text-[11px] font-black tracking-widest ${isConnected ? 'text-cyan-400' : 'text-yellow-500 animate-pulse'}`}>
              {isConnected ? 'UPLINK_STABLE' : 'REESTABLISHING_LINK...'}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-cyan-900/50" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-cyan-800 font-bold uppercase tracking-widest">FOV_SYSTEM</span>
            <span className={`text-[11px] font-black tracking-widest ${fogEnabled ? 'text-cyan-400' : 'text-white/30'}`}>
              {fogEnabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

export default function ArenaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-cyan-500 font-mono tracking-widest animate-pulse">UPLINKING TO NEURAL NETWORK...</div>}>
      <ArenaPageContent />
    </Suspense>
  );
}
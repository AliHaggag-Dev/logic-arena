'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api-client';
import { useGameState } from './hooks/useGameState';
import { Scene3D } from './components/Scene3D';
import { CommandConsole } from './components/CommandConsole';
import WinnerScreen from './components/WinnerScreen';

interface RobotScript {
  id:      string;
  title:   string;
  content: string;
}

const ROBOT_FILES: Record<string, string> = {
  'unit-01': '/robot.glb',
  'unit-02': '/robot2.glb',
};

const ArenaPageContent = () => {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const scriptId     = searchParams.get('scriptId');
  const urlMode      = searchParams.get('mode') || 'COMBAT';

  const [script, setScript] = useState<RobotScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [localRobotFile,  setLocalRobotFile]  = useState('/robot.glb');
  const [localRobotColor, setLocalRobotColor] = useState('#22d3ee');

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
    const animate = () => {
      projectileAnimRef.current = requestAnimationFrame(animate);
    };
    projectileAnimRef.current = requestAnimationFrame(animate);
    return () => { if (projectileAnimRef.current) cancelAnimationFrame(projectileAnimRef.current); };
  }, []);

  // Fetch user's saved loadout once so the arena renders the correct robot + color
  useEffect(() => {
    apiClient.get('/users/profile').then((res) => {
      const file = ROBOT_FILES[res.data.selectedRobotId] ?? '/robot.glb';
      setLocalRobotFile(file);
      if (res.data.selectedColor) setLocalRobotColor(res.data.selectedColor);
    }).catch(() => {/* non-fatal — defaults remain */});
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
  if (error)   return <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-mono">CRITICAL_SYSTEM_ERROR: {error}</div>;

  const robots       = uiState?.robots || [];
  const isConnected  = !!socket?.connected;
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const matchId      = searchParams.get('matchId') || 'default-match';

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono select-none">
      {matchResult && (
        <WinnerScreen
          matchResult={matchResult}
          currentUserId={currentUserId}
          socket={socket}
          matchId={matchId}
        />
      )}

      {/* ── 3D Scene ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Scene3D
          gameStateRef={gameStateRef}
          obstacles={uiState?.obstacles || []}
          firedTracer={firedTracer ?? null}
          speechBubble={speechBubble ?? null}
          fogEnabled={fogEnabled}
          localRobotFile={localRobotFile}
          localRobotColor={localRobotColor}
        />
      </div>

      {/* ── Cinematic Toggle Button ──────────────────────────────── */}
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

      {/* ── Left Cinematic Wrapper ───────────────────────────────── */}
      <div 
        className={`absolute inset-0 z-30 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLeftPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'
        }`}
      >
        {/* ── Title bar ────────────────────────────────────────────── */}
        <div className="absolute top-6 left-8 pointer-events-none">
          <h1 className="text-4xl font-black tracking-tighter text-cyan-400 italic leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
            LOGIC ARENA
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              displayMode === 'RACING'        ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' :
              displayMode === 'TRAINING_SOLO' ? 'bg-green-500  shadow-[0_0_8px_#22c55e]' :
                                                'bg-red-500    shadow-[0_0_8px_#ef4444]'
            }`} />
            <p className={`text-[10px] tracking-[0.2em] font-bold ${
              displayMode === 'RACING'        ? 'text-yellow-700' :
              displayMode === 'TRAINING_SOLO' ? 'text-green-700'  : 'text-red-700'
            }`}>
              v2.0.0 {displayMode === 'RACING' ? '[RACING OVAL]' : displayMode === 'TRAINING_SOLO' ? '[TRAINING SOLO]' : '[COMBAT ARENA]'}
            </p>
          </div>
        </div>

        {/* ── Script name ──────────────────────────────────────────── */}
        <div className="absolute top-6 left-[450px] pointer-events-none flex opacity-40">
          <h2 className="text-xl font-bold text-red-500/80 tracking-[0.5em] uppercase italic">
            Arena: {script?.title}
          </h2>
        </div>

        {/* ── HUD control strip (top-left buttons) ─────────────────── */}
        <div className="absolute top-28 left-8 pointer-events-auto flex items-center gap-3 bg-black/80 backdrop-blur-xl border-l-4 border-cyan-500 p-4 rounded-r shadow-[10px_10px_30px_rgba(0,0,0,0.9)]">
          
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/50 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/50 to-transparent" />

          {/* Respawn */}
          <button
            type="button"
            onClick={() => socket?.emit('resetGame')}
            className="group relative border border-red-900 bg-red-950/30 text-red-500 text-[10px] font-black px-6 py-2.5 transition-all hover:bg-red-900/50 hover:border-red-500 hover:text-white tracking-[0.2em] overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <span className="relative z-10">[ EXECUTE RESPAWN ]</span>
            <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-red-500/30 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
          </button>

          {/* FOG toggle */}
          <button
            type="button"
            id="fog-toggle-btn"
            onClick={() => setFogEnabled(prev => !prev)}
            className={`group relative border text-[10px] font-black px-6 py-2.5 transition-all tracking-[0.2em] overflow-hidden ${
              fogEnabled
                ? 'border-cyan-500 bg-cyan-900/40 text-cyan-300 hover:bg-cyan-500/40 hover:text-white shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]'
                : 'border-white/20 bg-white/5 text-white/50 hover:bg-white/10 hover:border-white/40'
            }`}
          >
            <span className="relative z-10">
              [ FOG_SYSTEM: {fogEnabled ? 'ONLINE' : 'OFFLINE'} ]
            </span>
            {fogEnabled && (
              <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
            )}
          </button>
        </div>

        {/* ── Command Console ───────────────────────────────────────── */}
        <div className="absolute left-8 top-44 bottom-8 pointer-events-auto flex" style={{ minWidth: '400px' }}>
          <CommandConsole
            socket={socket}
            robotId={selectedRobotId}
            scriptId={scriptId}
            availableRobots={availableRobots}
            onRobotChange={setSelectedRobotId}
          />
        </div>
      </div>

      {/* ── Tactical Radar ────────────────────────────────────────── */}
      <div className="absolute top-8 right-8 z-20 w-72 h-56 group">
        <div className="absolute inset-0 bg-cyan-950/10 backdrop-blur-xl border border-cyan-500/20 rounded-sm overflow-hidden transition-all group-hover:border-cyan-400/50 shadow-2xl">
          <div className="bg-cyan-900/20 px-3 py-2 flex justify-between items-center border-b border-cyan-500/20">
            <span className="text-cyan-400 text-[10px] font-black tracking-[0.3em]">TACTICAL_VIEW</span>
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-cyan-500/40 animate-pulse" />
              <span className="w-1 h-1 bg-cyan-500/40 animate-pulse [animation-delay:200ms]" />
            </div>
          </div>
          <div className="relative w-full h-[calc(100%-30px)] p-0 overflow-hidden bg-[radial-gradient(circle,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/20 shadow-[0_0_15px_#22d3ee] animate-scan z-10" />
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-10 pointer-events-none">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-cyan-500/30" />
              ))}
            </div>

            {robots.map((robot: any) => {
              const posX = (robot.position.x / 800) * 100;
              const posY = (robot.position.y / 600) * 100;
              const energyPct = Math.round(((robot.energy ?? 1000) / (robot.maxEnergy ?? 1000)) * 100);

              // FOG: on radar, only show enemy blip if visible to at least one friendly robot
              const isVisible = !fogEnabled || robots.some(
                (r: any) => r.id !== robot.id && (r.visibleRobotIds ?? []).includes(robot.id)
              );

              return (
                <div
                  key={robot.id}
                  className="absolute transition-all duration-300 ease-linear"
                  style={{
                    left:      `${posX}%`,
                    top:       `${posY}%`,
                    transform: 'translate(-50%, -50%)',
                    opacity:   isVisible ? 1 : 0.25,
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Ping ring */}
                    <div
                      className="absolute w-5 h-5 rounded-full border border-current opacity-20 animate-ping"
                      style={{ color: robot.color || '#00ffff' }}
                    />
                    {/* Robot arrow */}
                    <div
                      className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-current drop-shadow-[0_0_8px_currentColor]"
                      style={{ color: robot.color || '#00ffff', transform: `rotate(${robot.rotation || 0}deg)` }}
                    />
                    {/* Health bar */}
                    <div className="absolute -top-4 w-6 h-1 bg-gray-900 border border-white/10">
                      <div className="h-full bg-green-500" style={{ width: `${robot.health || 100}%` }} />
                    </div>
                    {/* Energy arc (cyan bar below health) */}
                    <div className="absolute -top-2.5 w-6 h-[3px] bg-gray-900/80 border border-cyan-900/40">
                      <div
                        className={`h-full transition-all ${
                          robot.inStasis ? 'bg-blue-400' :
                          energyPct <= 20 ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${energyPct}%` }}
                      />
                    </div>
                    {/* ID label */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-1 border border-cyan-500/20">
                      <span className="text-[7px] text-cyan-400 font-mono font-bold whitespace-nowrap tracking-tighter uppercase">
                        {robot.id.slice(0, 4)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Projectiles */}
            {displayMode === 'COMBAT' && (gameStateRef.current?.projectiles || []).map((p: any) => (
              <div
                key={p.id}
                className="absolute"
                style={{ left: `${(p.position.x / 800) * 100}%`, top: `${(p.position.y / 600) * 100}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-1 h-1 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-cyan-800 font-bold uppercase tracking-widest">Connection_Status</span>
          <span className={`text-[11px] font-black tracking-widest ${isConnected ? 'text-cyan-400' : 'text-yellow-500 animate-pulse'}`}>
            {isConnected ? 'UPLINK_STABLE' : 'REESTABLISHING_LINK...'}
          </span>
        </div>
        <div className="h-8 w-[1px] bg-cyan-900/50" />
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-cyan-800 font-bold uppercase tracking-widest">FOV_SYSTEM</span>
          <span className={`text-[11px] font-black tracking-widest ${fogEnabled ? 'text-cyan-400' : 'text-white/30'}`}>
            {fogEnabled ? 'ACTIVE' : 'DISABLED'}
          </span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          from { top: 0%;   opacity: 0; }
          50%  {             opacity: 1; }
          to   { top: 100%; opacity: 0; }
        }
        @keyframes sweep {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>
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

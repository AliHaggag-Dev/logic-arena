'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api-client';
import { useGameState } from './hooks/useGameState';
import { Scene3D } from './components/Scene3D';
import WinnerScreen from './components/WinnerScreen';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// Refactored Components
import { useFPS } from './hooks/useFPS';
import { OrientationLock } from './components/OrientationLock';
import { MobileTopRightHUD } from './components/MobileTopRightHUD';
import { MobileControls } from './components/MobileControls';
import { DesktopHUD } from './components/DesktopHUD';
import { ArenaStyles } from './components/ArenaStyles';
import { TrainingHUD } from './components/TrainingMode/TrainingHUD';

interface RobotScript {
  id: string;
  title: string;
  content: string;
}

const ROBOT_FILES: Record<string, string> = {
  'unit-01': '/robot.glb',
  'unit-02': '/robot2.glb',
};

const ArenaPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlScriptId = searchParams.get('scriptId');
  const urlMode = searchParams.get('mode') || 'COMBAT';
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const fps = useFPS();

  const [resolvedScriptId, setResolvedScriptId] = useState<string | null>(urlScriptId);
  const [script, setScript] = useState<RobotScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localRobotFile, setLocalRobotFile] = useState('/robot.glb');
  const [localRobotColor, setLocalRobotColor] = useState('#22d3ee');

  const {
    socket, gameStateRef, uiState,
    selectedRobotId, setSelectedRobotId, availableRobots,
    matchResult, serverConfirmedMode, trainingStats,
    fogEnabled, setFogEnabled,
    firedTracer, speechBubble,
  } = useGameState(resolvedScriptId, urlMode);

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

    let isMounted = true;

    const resolveAndFetch = async () => {
      let targetScriptId = resolvedScriptId;

      // 1. Try to resolve if missing
      if (!targetScriptId) {
        const stored = localStorage.getItem('selectedScriptId');
        if (stored) {
          targetScriptId = stored;
          setResolvedScriptId(stored);
        } else {
          try {
            const res = await apiClient.get('/scripts');
            if (res.data && res.data.length > 0) {
              targetScriptId = res.data[0].id as string;
              localStorage.setItem('selectedScriptId', targetScriptId as string);
              setResolvedScriptId(targetScriptId);
            } else {
              if (isMounted) {
                setError('No scripts found. Please create a script in the Command Center first.');
                setLoading(false);
              }
              return;
            }
          } catch (err) {
            if (isMounted) {
              setError('Failed to fetch fallback scripts.');
              setLoading(false);
            }
            return;
          }
        }
      }

      // 2. Fetch the specific script
      try {
        const response = await apiClient.get(`/scripts/${targetScriptId}`);
        if (isMounted) {
          setScript(response.data);
          setLoading(false);
        }
      } catch (err: unknown) {
        // Self-healing: If the script is invalid (e.g. shared localStorage across accounts),
        // clear the invalid cache and fallback to the user's first available script.
        localStorage.removeItem('selectedScriptId');
        
        try {
          const res = await apiClient.get('/scripts');
          if (res.data && res.data.length > 0) {
            const fallbackId = res.data[0].id as string;
            localStorage.setItem('selectedScriptId', fallbackId);
            if (isMounted) {
              setResolvedScriptId(fallbackId); // Triggers re-run with valid ID
            }
          } else {
            if (isMounted) {
              setError('No scripts found. Please create a script in the Command Center first.');
              setLoading(false);
            }
          }
        } catch (fallbackErr) {
          if (isMounted) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e.response?.data?.message || e.message || 'Unknown error');
            setLoading(false);
          }
        }
      }
    };

    resolveAndFetch();

    return () => { isMounted = false; };
  }, [router, resolvedScriptId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-cyan-500 font-mono tracking-widest animate-pulse">UPLINKING TO NEURAL NETWORK...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-mono">CRITICAL_SYSTEM_ERROR: {error}</div>;

  const robots = uiState?.robots || [];
  const obstacles = uiState?.obstacles || [];
  const projectiles = gameStateRef.current?.projectiles || [];
  const isConnected = !!socket?.connected;
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const matchId = searchParams.get('matchId') || 'default-match';

  // Determine if this is a PvP match
  const isPvP = availableRobots.length >= 2 && !availableRobots.some(id => id.toLowerCase().includes('bot'));
  
  // If PvP, lock the user to their own robot so they cannot switch to the opponent
  const filteredAvailableRobots = isPvP && currentUserId && availableRobots.includes(currentUserId)
    ? [currentUserId]
    : availableRobots;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono select-none">
      <ArenaStyles />

      {isMobile && isPortrait && <OrientationLock />}

      {matchResult && (
        <WinnerScreen
          matchResult={matchResult}
          currentUserId={currentUserId}
          socket={socket}
          matchId={matchId}
        />
      )}

      <div className="absolute inset-0 z-0">
        <Scene3D
          gameStateRef={gameStateRef}
          obstacles={obstacles}
          firedTracer={firedTracer ?? null}
          speechBubble={speechBubble ?? null}
          fogEnabled={fogEnabled}
          localRobotFile={localRobotFile}
          localRobotColor={localRobotColor}
          displayMode={displayMode}
        />
      </div>

      {displayMode === 'TRAINING_SOLO' && (
        <TrainingHUD 
          playerRobot={robots.find(r => r.id === currentUserId)}
          shotsFired={trainingStats.shotsFired}
          dummiesDestroyed={trainingStats.dummiesDestroyed}
          startTime={trainingStats.startTime}
          isMobile={isMobile}
        />
      )}

      {isMobile ? (
        <>
          <MobileTopRightHUD
            fps={fps}
            fogEnabled={fogEnabled}
            setFogEnabled={setFogEnabled}
            socket={socket}
            isConnected={isConnected}
            robots={robots}
            projectiles={projectiles}
            displayMode={displayMode}
          />
          <MobileControls
            socket={socket}
            selectedRobotId={selectedRobotId}
            availableRobots={filteredAvailableRobots}
            setSelectedRobotId={setSelectedRobotId}
            isMobile={isMobile}
          />
        </>
      ) : (
        <DesktopHUD
          displayMode={displayMode}
          scriptTitle={script?.title}
          socket={socket}
          fogEnabled={fogEnabled}
          setFogEnabled={setFogEnabled}
          selectedRobotId={selectedRobotId}
          availableRobots={filteredAvailableRobots}
          setSelectedRobotId={setSelectedRobotId}
          isMobile={isMobile}
          robots={robots}
          projectiles={projectiles}
          isConnected={isConnected}
          isPvP={isPvP}
        />
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
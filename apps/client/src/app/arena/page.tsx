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
import { RacingHUD } from './components/TrainingMode/RacingHUD';

interface RobotScript {
  id: string;
  title: string;
  content: string;
}

const ROBOT_FILES: Record<string, string> = {
  'unit-01':         '/robots/robot.glb',
  'unit-02':         '/robots/robot2.glb',
  'chassis-unit-01': '/robots/robot.glb',
  'chassis-unit-02': '/robots/robot2.glb',
  'chassis-wraith':  '/robots/bunny.glb',
  'chassis-titan':   '/robots/armored-robot.glb',
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
  const [localRobotFile, setLocalRobotFile] = useState('/robots/robot.glb');
  const [localRobotColor, setLocalRobotColor] = useState('#22d3ee');
  const [soundFx, setSoundFx] = useState(true);
  const [graphicsQuality, setGraphicsQuality] = useState('medium');

  const {
    socket, gameStateRef, obstaclesRef, uiState,
    selectedRobotId, setSelectedRobotId, availableRobots,
    matchResult, serverConfirmedMode, trainingStats,
    fogEnabled, setFogEnabled,
    socketUserId,
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
      // 1. Visual robot model & color from Garage loadout
      const file = ROBOT_FILES[res.data.selectedRobotId] ?? '/robots/robot.glb';
      setLocalRobotFile(file);
      if (res.data.selectedColor) setLocalRobotColor(res.data.selectedColor);

      // 2. Arena preferences — sync soundFx and graphicsQuality from DB
      const prefs = res.data.arenaPreferences;
      if (prefs) {
        setSoundFx(prefs.soundFx !== false);
        if (prefs.graphicsQuality) setGraphicsQuality(prefs.graphicsQuality);
        // If no robot was already selected via URL/garage, honour arenaPreferences.defaultRobot
        if (!res.data.selectedRobotId && prefs.defaultRobot) {
          setLocalRobotFile(ROBOT_FILES[prefs.defaultRobot] ?? '/robots/robot.glb');
        }
      }
    }).catch(() => { });
  }, []);

  useEffect(() => {
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
                setError('No scripts found. Please create a script in the Dashboard first.');
                setLoading(false);
              }
              return;
            }
          } catch (err: unknown) {
            const axiosError = err as { response?: { status?: number } };
            if (axiosError.response?.status === 401 || !localStorage.getItem('token')) {
              if (isMounted) {
                setResolvedScriptId('guest-script');
                setScript({
                  id: 'guest-script',
                  title: 'Guest Script',
                  content: '// Guest Mode active\n// You can write temporary logic here'
                } as RobotScript);
                setLoading(false);
              }
              return;
            }

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
        const axiosError = err as { response?: { status?: number, data?: { message?: string } }, message?: string };
        
        // GUEST MODE: If unauthorized or script not found, provide a default training script
        if (axiosError.response?.status === 401 || !localStorage.getItem('token')) {
          if (isMounted) {
            setResolvedScriptId('guest-script');
            setScript({
              id: 'guest-script',
              title: 'Guest Script',
              content: '// Guest Mode active\n// You can write temporary logic here'
            });
            setLoading(false);
          }
          return;
        }

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
              setError('No scripts found. Please create a script in the Dashboard first.');
              setLoading(false);
            }
          }
        } catch (fallbackErr) {
          if (isMounted) {
            const e = fallbackErr as { response?: { data?: { message?: string } }; message?: string };
            setError(e.response?.data?.message || e.message || 'Unknown error');
            setLoading(false);
          }
        }
      }
    };

    resolveAndFetch();

    return () => { isMounted = false; };
  }, [router, resolvedScriptId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-cyan-500 font-mono tracking-widest animate-pulse">Loading Arena...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-mono">ERROR 404: {error}</div>;

  const robots = uiState?.robots || [];
  const obstacles = obstaclesRef.current || [];
  const projectiles = gameStateRef.current?.projectiles || [];
  const isConnected = !!socket?.connected;
  const activeUserId = (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) || socketUserId;
  const matchId = searchParams.get('matchId') || 'default-match';

  // Determine if this is a PvP match
  const isPvP = availableRobots.length >= 2 && !availableRobots.some(id => id.toLowerCase().includes('bot'));
  
  // If PvP, lock the user to their own robot so they cannot switch to the opponent
  const filteredAvailableRobots = isPvP && activeUserId && availableRobots.includes(activeUserId)
    ? [activeUserId]
    : availableRobots;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono select-none">
      <ArenaStyles />

      {isMobile && isPortrait && <OrientationLock />}

      {matchResult && (
        <WinnerScreen
          matchResult={matchResult}
          currentUserId={activeUserId}
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
          soundFx={soundFx}
          graphicsQuality={graphicsQuality}
          localRobotFile={localRobotFile}
          localRobotColor={localRobotColor}
          displayMode={displayMode}
        />
      </div>

      {displayMode === 'TRAINING_SOLO' && (
        <TrainingHUD 
          playerRobot={robots.find(r => r.id === activeUserId)}
          shotsFired={trainingStats.shotsFired}
          dummiesDestroyed={trainingStats.dummiesDestroyed}
          startTime={trainingStats.startTime}
          isMobile={isMobile}
          socket={socket}
          dummies={robots.filter(r => r.id.startsWith('dummy-'))}
        />
      )}

      {displayMode === 'RACING' && (
        <RacingHUD 
          playerRobot={robots.find(r => r.id === activeUserId)}
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
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-cyan-500 font-mono tracking-widest animate-pulse">Loading Arena...</div>}>
      <ArenaPageContent />
    </Suspense>
  );
}
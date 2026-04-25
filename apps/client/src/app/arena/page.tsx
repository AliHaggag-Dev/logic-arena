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
  const scriptId = searchParams.get('scriptId');
  const urlMode = searchParams.get('mode') || 'COMBAT';
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const fps = useFPS();

  const [script, setScript] = useState<RobotScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localRobotFile, setLocalRobotFile] = useState('/robot.glb');
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
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setError(e.response?.data?.message || e.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchScript();
  }, [router, scriptId]);

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
        />
      </div>

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
            availableRobots={availableRobots}
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
          availableRobots={availableRobots}
          setSelectedRobotId={setSelectedRobotId}
          isMobile={isMobile}
          robots={robots}
          projectiles={projectiles}
          isConnected={isConnected}
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
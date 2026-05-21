'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useGameState } from './hooks/game';
import { Scene3D } from './components/Scene3D';
import WinnerScreen from './components/WinnerScreen';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { getAuthUserId } from '../../lib/client-security';
import { useSoundContext } from '../../context/SoundContext';

// Refactored Components
import { useFPS } from './hooks/useFPS';
import { useScriptResolver } from './hooks/useScriptResolver';
import { OrientationLock } from './components/OrientationLock';
import { MobileTopRightHUD } from './components/MobileTopRightHUD';
import { MobileControls } from './components/MobileControls';
import { DesktopHUD } from './components/DesktopHUD';
import { ArenaStyles } from './components/ArenaStyles';
import { TrainingHUD } from './components/TrainingMode/TrainingHUD';
import { RacingHUD } from './components/TrainingMode/RacingHUD';
import { SpectatorHUD } from './components/SpectatorHUD';

const ROBOT_FILES: Record<string, string> = {
  'unit-01': '/robots/robot.glb',
  'unit-02': '/robots/robot2.glb',
  'chassis-unit-01': '/robots/robot.glb',
  'chassis-unit-02': '/robots/robot2.glb',
  'chassis-wraith': '/robots/bunny.glb',
  'chassis-titan': '/robots/armored-robot.glb',
  'chassis-sandman': '/robots/sandman.glb',
};

const ArenaPageContent = () => {
  const searchParams = useSearchParams();
  const urlScriptId = searchParams.get('scriptId');
  const urlMode = searchParams.get('mode') || 'COMBAT';
  const isSpectator = searchParams.get('spectate') === 'true';
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const fps = useFPS();

  const { script, loading, error, resolvedScriptId } = useScriptResolver(urlScriptId, isSpectator);
  const [localRobotFile, setLocalRobotFile] = useState('/robots/robot.glb');
  const [localRobotColor, setLocalRobotColor] = useState('#22d3ee');
  const [graphicsQuality, setGraphicsQuality] = useState('medium');
  const { arenaSoundsEnabled } = useSoundContext();

  const {
    socket, gameStateRef, obstaclesRef, uiState,
    selectedRobotId, setSelectedRobotId, availableRobots,
    matchResult, serverConfirmedMode, trainingStats,
    fogEnabled, setFogEnabled,
    socketUserId,
    firedTracer, speechBubble,
    spectatorCount,
  } = useGameState(isSpectator ? null : resolvedScriptId, urlMode, isSpectator);

  const displayMode = serverConfirmedMode;
  const projectileAnimRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => { projectileAnimRef.current = requestAnimationFrame(animate); };
    projectileAnimRef.current = requestAnimationFrame(animate);
    return () => { if (projectileAnimRef.current) cancelAnimationFrame(projectileAnimRef.current); };
  }, []);

  const { profile, loading: authLoading } = useAuth();

  // Load arena preferences from cached profile (skip for spectators)
  useEffect(() => {
    if (isSpectator) return;
    if (authLoading || !profile) return;

    const file = ROBOT_FILES[profile.selectedRobotId ?? ''] ?? '/robots/robot.glb';
    setLocalRobotFile(file);
    if (profile.selectedColor) setLocalRobotColor(profile.selectedColor);

    const prefs = profile.arenaPreferences;
    if (prefs) {
      if (prefs.graphicsQuality) setGraphicsQuality(prefs.graphicsQuality);
    }
  }, [profile, authLoading, isSpectator]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-cyan-500 font-mono tracking-widest animate-pulse">Loading Arena...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-mono">ERROR 404: {error}</div>;

  const robots = uiState?.robots || [];
  const obstacles = obstaclesRef.current || [];
  const projectiles = gameStateRef.current?.projectiles || [];
  const isConnected = !!socket?.connected;
  const activeUserId = getAuthUserId() || socketUserId;
  const matchId = searchParams.get('matchId') || 'default-match';

  const isPvP = availableRobots.length >= 2 && !availableRobots.some(id => id.toLowerCase().includes('bot'));

  const filteredAvailableRobots = isPvP && activeUserId && availableRobots.includes(activeUserId)
    ? [activeUserId]
    : availableRobots;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono select-none">
      <ArenaStyles />

      {isMobile && isPortrait && <OrientationLock />}

      {/* Spectator-only overlays */}
      {isSpectator && (
        <SpectatorHUD
          spectatorCount={spectatorCount}
          socket={socket}
          matchId={matchId}
        />
      )}

      {/* Spectator count visible to players too (top-center, subtle) */}
      {!isSpectator && spectatorCount > 0 && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] font-black tracking-widest uppercase select-none"
          style={{
            background: 'rgba(109,40,217,0.15)',
            border: '1px solid rgba(167,139,250,0.25)',
            backdropFilter: 'blur(8px)',
            color: 'rgba(196,181,253,0.7)',
          }}
          aria-label={`${spectatorCount} spectator${spectatorCount !== 1 ? 's' : ''} watching`}
        >
          <span aria-hidden="true">👁️</span>
          <span>{spectatorCount}</span>
        </div>
      )}

      {matchResult && !isSpectator && (
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
          soundFx={arenaSoundsEnabled}
          graphicsQuality={graphicsQuality}
          localRobotFile={localRobotFile}
          localRobotColor={localRobotColor}
          displayMode={displayMode}
        />
      </div>

      {/* Player-only HUD elements — hidden for spectators */}
      {!isSpectator && (
        <>
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
        </>
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
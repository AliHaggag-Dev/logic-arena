'use client';

import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGameState } from './hooks/game';
import WinnerScreen from './components/WinnerScreen';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { getAuthUserId } from '../../lib/client-security';
import { useSoundContext } from '../../context/SoundContext';

// Refactored Components
import { useScriptResolver } from './hooks/useScriptResolver';
import { OrientationLock } from './components/OrientationLock';
import { MobileTopRightHUD } from './components/MobileTopRightHUD';
import { MobileControls } from './components/MobileControls';
import { DesktopHUD } from './components/DesktopHUD';
import { ArenaStyles } from './components/ArenaStyles';
import { TrainingHUD } from './components/TrainingMode/TrainingHUD';
import { RacingHUD } from './components/TrainingMode/RacingHUD';
import { SpectatorHUD } from './components/SpectatorHUD';

import { RoundTransitionOverlay } from './components/Tactical/RoundTransitionOverlay';
import { PhaseBanner } from './components/Tactical/PhaseBanner';
import { ArenaLoadingScreen } from './components/ArenaLoadingScreen';
import { CHASSIS_MODEL_PATHS } from './components/Scene3D/models/RobotModelLoaders';

const Scene3D = dynamic(
  () => import('./components/Scene3D').then(m => m.Scene3D),
  { ssr: false },
);

const ROBOT_FILES: Record<string, string> = CHASSIS_MODEL_PATHS;

const CLASSIC_TOKEN_BUDGET = 10;

const ArenaPageContent = () => {
  const searchParams = useSearchParams();
  const urlScriptId = searchParams.get('scriptId');
  const urlMode = searchParams.get('mode') || 'COMBAT';
  const urlMatchMode = searchParams.get('matchMode') || 'HYBRID';
  const urlAiDifficulty = searchParams.get('aiDifficulty');
  const isSpectator = searchParams.get('spectate') === 'true';
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const isPortrait = useMediaQuery("(orientation: portrait)");

  const { script, loading, error, resolvedScriptId } = useScriptResolver(urlScriptId, isSpectator);
  const [localRobotFile, setLocalRobotFile] = useState('/robots/robot.glb');
  const [localRobotColor, setLocalRobotColor] = useState('#22d3ee');
  const [graphicsQuality, setGraphicsQuality] = useState('medium');
  const [classicTokensLeft, setClassicTokensLeft] = useState(CLASSIC_TOKEN_BUDGET);
  const { arenaSoundsEnabled } = useSoundContext();

  const {
    socket, gameStateRef, obstaclesRef, uiState,
    selectedRobotId, setSelectedRobotId, availableRobots,
    matchResult, serverConfirmedMode, trainingStats,
    fogEnabled, setFogEnabled,
    socketUserId,
    firedTracer, speechBubble,
    spectatorCount,
    matchPhase,
    clearMatchResult,
    sessionMatchId,
  } = useGameState(isSpectator ? null : resolvedScriptId, urlMode, urlMatchMode, isSpectator);

  const displayMode = ['CLASSIC', 'TACTICAL'].includes(serverConfirmedMode) 
    ? serverConfirmedMode 
    : urlMatchMode;
  const isClassicMode = displayMode === 'CLASSIC';


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

  useEffect(() => {
    if (!isMobile) return;
    const handleInteraction = async () => {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (e) {
        // Ignore silent failures
      }
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [isMobile]);

  const [loadingScreenCompleted, setLoadingScreenCompleted] = useState<boolean>(false);

  const handleLoadingComplete = useCallback((): void => {
    setLoadingScreenCompleted(true);
  }, []);

  if (error) return <div className="min-h-dvh flex items-center justify-center bg-black text-red-500 font-mono">ERROR 404: {error}</div>;

  const robots = uiState?.robots || [];
  const obstacles = obstaclesRef.current || [];
  const projectiles = gameStateRef.current?.projectiles || [];
  const isConnected = !!socket?.connected;
  const activeUserId = getAuthUserId() || socketUserId;
  const matchId = searchParams.get('matchId') || 'default-match';
  const modeData = uiState?.modeData || gameStateRef.current?.modeData;

  const handleClassicEdit = (nextScript: string, nextTokensLeft: number): void => {
    setClassicTokensLeft(nextTokensLeft);
    socket?.emit('match:classic-edit', {
      script: nextScript,
      tokensLeft: nextTokensLeft,
    });
  };

  const isPvP = availableRobots.length >= 2 && !availableRobots.some(id => id.toLowerCase().includes('bot') || id.toLowerCase().includes('dummy'));

  const filteredAvailableRobots = isPvP && activeUserId && availableRobots.includes(activeUserId)
    ? [activeUserId]
    : availableRobots;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-black overflow-hidden font-mono select-none">
      <ArenaStyles />

      {/* Render the 3D Scene immediately in the background so it can load and compile WebGL shaders */}
      <div className="absolute inset-0 z-0">
        <Scene3D
          key={`scene-${searchParams.get('theme') || 'CYBER'}`}
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
          mapTheme={searchParams.get('theme') || uiState?.mapTheme || 'CYBER'}
          selectedRobotId={selectedRobotId}
        />
      </div>

      {!loadingScreenCompleted && (
        <ArenaLoadingScreen
          socket={socket}
          uiState={uiState}
          scriptReady={!loading && (isSpectator || !!script)}
          isSpectator={isSpectator}
          onComplete={handleLoadingComplete}
        />
      )}

      {loadingScreenCompleted && (
        <>
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
          <Eye size={14} aria-hidden="true" />
          <span>{spectatorCount}</span>
        </div>
      )}

      {matchResult && !isSpectator && (
        <WinnerScreen
          matchResult={matchResult}
          currentUserId={activeUserId}
          socket={socket}
          matchId={matchId}
          onRematchClient={clearMatchResult}
        />
      )}

      {displayMode === 'TACTICAL' && matchPhase && (
        <RoundTransitionOverlay phase={matchPhase.phase as unknown as string} />
      )}

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

          {displayMode === 'TACTICAL' && matchPhase?.phase && (
            <PhaseBanner phase={matchPhase.phase as unknown as string} phaseEndsAt={matchPhase.phaseEndsAt} />
          )}

          {isMobile ? (
            <>
              <MobileTopRightHUD
                fogEnabled={fogEnabled}
                setFogEnabled={setFogEnabled}
                socket={socket}
                isConnected={isConnected}
                robots={robots}
                projectiles={projectiles}
                displayMode={displayMode}
                modeData={modeData}
                isPvP={isPvP}
              />
              <MobileControls
                socket={socket}
                selectedRobotId={selectedRobotId}
                availableRobots={filteredAvailableRobots}
                setSelectedRobotId={setSelectedRobotId}
                isMobile={isMobile}
                isClassicMode={isClassicMode}
                classicTokensLeft={classicTokensLeft}
                classicMaxTokens={CLASSIC_TOKEN_BUDGET}
                onClassicEdit={handleClassicEdit}
                initialScript={script?.content ?? ''}
                displayMode={displayMode}
                matchPhase={matchPhase?.phase as unknown as string}
                matchPhaseState={matchPhase}
                currentUserId={activeUserId}
                sessionMatchId={sessionMatchId}
              />
            </>
          ) : (
            <DesktopHUD
              displayMode={displayMode}
              modeData={modeData}
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
              isClassicMode={isClassicMode}
              classicTokensLeft={classicTokensLeft}
              classicMaxTokens={CLASSIC_TOKEN_BUDGET}
              onClassicEdit={handleClassicEdit}
              initialScript={script?.content ?? ''}
              matchPhase={matchPhase.phase as unknown as string}
              phaseEndsAt={matchPhase.phaseEndsAt}
              sessionMatchId={sessionMatchId}
            />
          )}
        </>
      )}
      </>
      )}
    </div>
  );
};

export default function ArenaPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-black flex items-center justify-center text-cyan-500 font-mono tracking-widest animate-pulse">Loading Arena...</div>}>
      <ArenaPageContent />
    </Suspense>
  );
}

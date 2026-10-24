'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DefaultLoadingManager } from 'three';
import { useGLTF } from '@react-three/drei';
import { getGlobalAudioContext } from '../../../../context/SoundContext';
import styles from './ArenaLoadingScreen.module.css';
import {
  TIPS,
  DEFAULT_MATCH_GLB_FILES,
  GLB_PROGRESS_WEIGHT,
  TEXTURES_PROGRESS_WEIGHT,
  WEBSOCKET_CONNECTED_WEIGHT,
  INIT_STATE_RECEIVED_WEIGHT,
  SCRIPT_READY_WEIGHT,
  AUDIO_CHECK_INTERVAL_MS,
  TEXTURE_CHECK_INTERVAL_MS,
  TIPS_ROTATION_INTERVAL_MS,
  TIPS_FADE_TRANSITION_MS,
  FADE_OUT_DELAY_MS,
  UNMOUNT_TIMER_MS,
  GLB_FALLBACK_TIMEOUT_MS,
  MASTER_WATCHDOG_TIMEOUT_MS,
} from './constants';

interface ArenaLoadingScreenProps {
  socket: { connected: boolean } | null;
  uiState: { robots: { id: string }[] } | null;
  scriptReady: boolean;
  isSpectator: boolean;
  localRobotFile?: string;
  onComplete: () => void;
}

export const ArenaLoadingScreen = ({
  socket,
  uiState,
  scriptReady,
  isSpectator,
  localRobotFile,
  onComplete,
}: ArenaLoadingScreenProps): React.JSX.Element => {
  const [glbProgress, setGlbProgress] = useState<number>(0);
  const [texturesProgress, setTexturesProgress] = useState<number>(0);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [fadeTip, setFadeTip] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isSafetyReleased, setIsSafetyReleased] = useState<boolean>(false);

  const isWebsocketConnected = !!socket?.connected;
  const hasRobots = !!(uiState && uiState.robots && uiState.robots.length > 0);

  // Sync timeout fallback: if socket is connected for 800ms, don't hold the screen hostage
  const [dataSyncTimeout, setDataSyncTimeout] = useState(false);
  useEffect(() => {
    if (isWebsocketConnected) {
      const timer = setTimeout(() => setDataSyncTimeout(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isWebsocketConnected]);

  const isInitStateReceived = isSpectator
    ? isWebsocketConnected
    : (hasRobots || dataSyncTimeout);

  // 1. Targeted preloading: run once on mount for the required models
  useEffect((): (() => void) => {
    const list = Array.from(new Set([...DEFAULT_MATCH_GLB_FILES, localRobotFile || '/robots/robot.glb']));
    list.forEach((file: string): void => {
      try {
        useGLTF.preload(file);
      } catch {
        // Safe ignore
      }
    });

    const manager = DefaultLoadingManager;
    const prevOnProgress = manager.onProgress;
    const prevOnLoad = manager.onLoad;

    manager.onProgress = (url: string, loaded: number, total: number): void => {
      if (total > 0) {
        setGlbProgress(Math.min(1, loaded / total));
      }
      if (prevOnProgress) prevOnProgress(url, loaded, total);
    };

    manager.onLoad = (): void => {
      setGlbProgress(1);
      if (prevOnLoad) prevOnLoad();
    };

    // Smooth fallback: guarantee models are marked ready within 800ms
    const fallback = setTimeout((): void => {
      setGlbProgress(1);
    }, 800);

    return (): void => {
      manager.onProgress = prevOnProgress;
      manager.onLoad = prevOnLoad;
      clearTimeout(fallback);
    };
  }, [localRobotFile]);

  // 2. WebGL first-frame and shader compile pipeline tracking
  useEffect((): (() => void) => {
    let current = 0;
    const interval = setInterval((): void => {
      if (typeof window !== 'undefined') {
        const win = window as unknown as Record<string, unknown>;
        if (win.__SCENE_FIRST_FRAME__) {
          setTexturesProgress(1.0);
          clearInterval(interval);
          return;
        }
      }
      if (current < 0.95) {
        current += 0.2;
        if (current >= 0.95) {
          current = 0.95;
        }
        setTexturesProgress(current);
      }
    }, 80);

    // Hard fallback: after 1000ms mark textures ready so the screen never hangs
    const hardFallback = setTimeout((): void => {
      setTexturesProgress(1.0);
      clearInterval(interval);
    }, 1000);

    const handleFirstFrame = (): void => {
      setTexturesProgress(1.0);
      clearInterval(interval);
      clearTimeout(hardFallback);
    };

    if (typeof window !== 'undefined') {
      const win = window as unknown as Record<string, unknown>;
      if (win.__SCENE_FIRST_FRAME__) {
        setTexturesProgress(1.0);
      } else {
        window.addEventListener('scene-first-frame', handleFirstFrame, { once: true });
      }
    }

    return (): void => {
      clearInterval(interval);
      clearTimeout(hardFallback);
      if (typeof window !== 'undefined') {
        window.removeEventListener('scene-first-frame', handleFirstFrame);
      }
    };
  }, []);

  // 3. Audio Context check (NON-BLOCKING: informational only)
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
    const interval = setInterval(checkAudio, AUDIO_CHECK_INTERVAL_MS);

    return (): void => clearInterval(interval);
  }, []);

  // 4. Master Safety Watchdog: hard cap 2000ms max loading screen time
  useEffect((): (() => void) => {
    const watchdog = setTimeout((): void => {
      setGlbProgress(1);
      setTexturesProgress(1);
      setIsSafetyReleased(true);
    }, 2000);

    return (): void => clearTimeout(watchdog);
  }, []);

  // 5. Tips Rotation Loop
  useEffect((): (() => void) => {
    const interval = setInterval((): void => {
      setFadeTip(false);
      setTimeout((): void => {
        setTipIndex((prev: number): number => (prev + 1) % TIPS.length);
        setFadeTip(true);
      }, TIPS_FADE_TRANSITION_MS);
    }, TIPS_ROTATION_INTERVAL_MS);
    return (): void => clearInterval(interval);
  }, []);

  // Calculate percentages and weights
  const glbPct = Math.round(glbProgress * 100);
  const texturesPct = Math.round(texturesProgress * 100);

  const totalProgress = Math.min(100, Math.round(
    (glbProgress * GLB_PROGRESS_WEIGHT) +
    (texturesProgress * TEXTURES_PROGRESS_WEIGHT) +
    (isWebsocketConnected ? WEBSOCKET_CONNECTED_WEIGHT : 0) +
    (isInitStateReceived ? INIT_STATE_RECEIVED_WEIGHT : 0) +
    (scriptReady ? SCRIPT_READY_WEIGHT : 0)
  ));

  // Audio is intentionally non-blocking: browsers require user interaction to resume Web Audio.
  // The match should proceed immediately once core 3D scene & network assets are ready!
  const allCoreReady = glbProgress === 1 && texturesProgress === 1 && isWebsocketConnected && isInitStateReceived && scriptReady;
  const isFullyLoaded = allCoreReady || isSafetyReleased;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Handle completion fade-out with snappy modern transitions
  useEffect((): (() => void) | undefined => {
    let delay: NodeJS.Timeout | undefined;
    let unmountTimer: NodeJS.Timeout | undefined;

    if (isFullyLoaded) {
      delay = setTimeout((): void => {
        setIsFadingOut(true);
        unmountTimer = setTimeout((): void => {
          onCompleteRef.current();
        }, UNMOUNT_TIMER_MS);
      }, FADE_OUT_DELAY_MS);

      return (): void => {
        if (delay) clearTimeout(delay);
        if (unmountTimer) clearTimeout(unmountTimer);
      };
    }
    return undefined;
  }, [isFullyLoaded]);

  return (
    <div className={`${styles.cyberLoaderContainer} ${isFadingOut ? styles.fadeOut : ''}`}>
      <div className={styles.cyberGrid} />

      <div className={styles.header}>
        <h1 className={styles.glitchTitle}>Logic Arena</h1>
        <div className={styles.subtitle}>Preparing your Arena</div>
      </div>

      <div className={styles.centerGraphic}>
        <div className={styles.robotSvgWrapper}>
          <svg className={styles.robotSvg} viewBox="0 0 100 100" width="100%" height="100%" aria-label="Cyberpunk Robot Silhouette animate">
            <title>Cyberpunk Robot Silhouette</title>
            <path 
              d="M25,25 L75,25 L82,55 L68,82 L32,82 L18,55 Z" 
              fill="none" 
              stroke="var(--cyber-cyan)" 
              strokeWidth="2.5" 
            />
            <line x1="33" y1="42" x2="45" y2="42" stroke="var(--cyber-cyan)" strokeWidth="3" />
            <line x1="55" y1="42" x2="67" y2="42" stroke="var(--cyber-cyan)" strokeWidth="3" />
            <path d="M42,62 L58,62" stroke="var(--cyber-cyan)" strokeWidth="2" fill="none" />
            <path d="M12,38 L18,43 L12,48" fill="none" stroke="var(--cyber-cyan)" strokeWidth="2" />
            <path d="M88,38 L82,43 L88,48" fill="none" stroke="var(--cyber-cyan)" strokeWidth="2" />
            <line x1="50" y1="12" x2="50" y2="25" stroke="var(--cyber-cyan)" strokeWidth="2" />
            <circle cx="50" cy="11" r="3.5" fill="var(--cyber-cyan)" />
            <path d="M32,82 L50,55 L68,82" stroke="rgba(0, 255, 247, 0.3)" strokeWidth="1" fill="none" />
          </svg>
          <div className={styles.scanline} />
        </div>
      </div>

      <div className={styles.statusPanel}>
        <div className={styles.progressHeader}>
          <div>
            <div className={styles.overallLabel}>Loading Progress</div>
            <div className={styles.overallPct}>{isFullyLoaded ? 100 : totalProgress}%</div>
          </div>
          <div className={styles.overallLabel} style={{ opacity: 0.5 }}>
            {isFullyLoaded || totalProgress === 100 ? 'LINK STABLE' : 'CALIBRATING BATTLEFIELD...'}
          </div>
        </div>

        <div className={styles.progressBarBg} aria-label="Loading Progress Bar" role="progressbar" aria-valuenow={isFullyLoaded ? 100 : totalProgress} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressBarFill} style={{ transform: `scaleX(${(isFullyLoaded ? 100 : totalProgress) / 100})` }} />
        </div>

        <div className={styles.stagesList}>
          <div className={styles.stageRow}>
            <span className={styles.stageName}>1. Loading Robot Models</span>
            <span className={`${styles.stageStatus} ${glbProgress === 1 ? styles.statusOk : styles.statusLoading}`}>
              {glbProgress === 1 ? '[ OK ]' : `[ ${glbPct}% ]`}
            </span>
          </div>
          <div className={styles.stageRow}>
            <span className={styles.stageName}>2. Building Arena Environment</span>
            <span className={`${styles.stageStatus} ${texturesProgress === 1 ? styles.statusOk : styles.statusLoading}`}>
              {texturesProgress === 1 ? '[ OK ]' : `[ ${texturesPct}% ]`}
            </span>
          </div>
          <div className={styles.stageRow}>
            <span className={styles.stageName}>3. Connecting to Server</span>
            <span className={`${styles.stageStatus} ${isWebsocketConnected ? styles.statusOk : styles.statusPending}`}>
              {isWebsocketConnected ? '[ OK ]' : '[ PENDING ]'}
            </span>
          </div>
          <div className={styles.stageRow}>
            <span className={styles.stageName}>4. Syncing Match Data</span>
            <span className={`${styles.stageStatus} ${isInitStateReceived ? styles.statusOk : styles.statusPending}`}>
              {isInitStateReceived ? '[ OK ]' : '[ PENDING ]'}
            </span>
          </div>
          <div className={styles.stageRow}>
            <span className={styles.stageName}>5. Loading Your Script</span>
            <span className={`${styles.stageStatus} ${scriptReady ? styles.statusOk : styles.statusPending}`}>
              {scriptReady ? '[ OK ]' : '[ PENDING ]'}
            </span>
          </div>
          <div className={styles.stageRow}>
            <span className={styles.stageName}>6. Audio Subsystem</span>
            <span className={`${styles.stageStatus} ${styles.statusOk}`}>
              {audioReady ? '[ ACTIVE ]' : '[ STANDBY ]'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.tipsContainer}>
        <div className={styles.tipsLabel}>PRO TIP</div>
        <p className={`${styles.tipText} ${fadeTip ? styles.fadeIn : styles.fadeOut}`}>
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
};

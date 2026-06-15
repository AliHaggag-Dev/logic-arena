'use client';

import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { getGlobalAudioContext } from '../../../../context/SoundContext';
import styles from './ArenaLoadingScreen.module.css';
import {
  TIPS,
  GLB_FILES,
  GLB_PROGRESS_WEIGHT,
  TEXTURES_PROGRESS_WEIGHT,
  WEBSOCKET_CONNECTED_WEIGHT,
  INIT_STATE_RECEIVED_WEIGHT,
  SCRIPT_READY_WEIGHT,
  AUDIO_READY_WEIGHT,
  AUDIO_CHECK_INTERVAL_MS,
  TEXTURE_CHECK_INTERVAL_MS,
  TIPS_ROTATION_INTERVAL_MS,
  TIPS_FADE_TRANSITION_MS,
  FADE_OUT_DELAY_MS,
  UNMOUNT_TIMER_MS,
  GLB_FALLBACK_TIMEOUT_MS,
} from './constants';

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
    }, GLB_FALLBACK_TIMEOUT_MS);

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
      if (typeof window !== 'undefined') {
        const win = window as unknown as Record<string, unknown>;
        if (win.__SCENE_FIRST_FRAME__) {
          setTexturesProgress(1.0);
          clearInterval(interval);
          return;
        }
      }
      if (current < 0.95) {
        current += 0.08 + Math.random() * 0.12;
        if (current >= 0.95) {
          current = 0.95;
          clearInterval(interval);
        }
        setTexturesProgress(current);
      }
    }, TEXTURE_CHECK_INTERVAL_MS);
    return (): void => clearInterval(interval);
  }, []);

  // Listen for actual WebGL scene first-frame signal
  useEffect((): (() => void) => {
    const handleFirstFrame = (): void => {
      setTexturesProgress(1.0);
    };
    if (typeof window !== 'undefined') {
      const win = window as unknown as Record<string, unknown>;
      if (win.__SCENE_FIRST_FRAME__) {
        setTexturesProgress(1.0);
      }
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
    const interval = setInterval(checkAudio, AUDIO_CHECK_INTERVAL_MS);

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

  // 4. Tips Rotation Loop
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
    (scriptReady ? SCRIPT_READY_WEIGHT : 0) +
    (audioReady ? AUDIO_READY_WEIGHT : 0)
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
        }, UNMOUNT_TIMER_MS);
      }, FADE_OUT_DELAY_MS);

      return (): void => {
        if (delay) clearTimeout(delay);
        if (unmountTimer) clearTimeout(unmountTimer);
      };
    }
    return undefined;
  }, [isFullyLoaded, onComplete]);

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
            <div className={styles.overallPct}>{totalProgress}%</div>
          </div>
          <div className={styles.overallLabel} style={{ opacity: 0.5 }}>
            {totalProgress === 100 ? 'LINK STABLE' : 'LOADING ROBOT MODELS...'}
          </div>
        </div>

        <div className={styles.progressBarBg} aria-label="Loading Progress Bar" role="progressbar" aria-valuenow={totalProgress} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressBarFill} style={{ transform: `scaleX(${totalProgress / 100})` }} />
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
            <span className={styles.stageName}>6. Initializing Audio</span>
            <span className={`${styles.stageStatus} ${audioReady ? styles.statusOk : styles.statusPending}`}>
              {audioReady ? '[ OK ]' : '[ MUTED ]'}
            </span>
          </div>
        </div>

        {allReadyExceptAudio && !audioReady && (
          <div className={styles.audioPromptContainer}>
            <button 
              type="button" 
              onClick={handleActivateAudio}
              className={styles.cyberBtn}
            >
              ESTABLISH NEURAL LINK
            </button>
          </div>
        )}
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

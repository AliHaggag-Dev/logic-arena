"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import React, { useMemo, useRef, useEffect, useState, MutableRefObject } from "react";
import { GameState } from "../../types";
import { interpolationBuffer } from "../../core/interpolation-buffer";

const FrameSignaler = (): null => {
  const signaledRef = useRef<boolean>(false);
  useFrame((): void => {
    if (!signaledRef.current) {
      signaledRef.current = true;
      if (typeof window !== 'undefined') {
        const win = window as unknown as Record<string, unknown>;
        win.__SCENE_FIRST_FRAME__ = true;
        window.dispatchEvent(new CustomEvent('scene-first-frame'));
      }
    }
  });
  return null;
};

/**
 * Sets up the R3F Canvas and basic scene environment.
 * dpr and gl are memoised so R3F never sees them as "changed" and
 * never reconstructs the WebGL renderer on parent re-renders.
 */
const toSceneX = (x: number) => (x / 40) - 10;
const toSceneZ = (y: number) => (y / 40) - 7.5;

interface CameraControllerProps {
  selectedRobotId?: string;
  gameStateRef?: MutableRefObject<GameState>;
  controlsRef: React.RefObject<any>;
}

const CameraController = ({
  selectedRobotId,
  gameStateRef,
  controlsRef,
}: CameraControllerProps) => {
  const { camera } = useThree();
  const [cameraMode, setCameraMode] = useState<'free' | 'robot'>('free');

  useEffect(() => {
    const handleModeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: 'free' | 'robot' }>;
      if (customEvent?.detail && customEvent.detail.mode) {
        setCameraMode(customEvent.detail.mode);
      }
    };

    const handleReset = () => {
      setCameraMode('free');
      window.dispatchEvent(new CustomEvent('camera-view-mode-synced', { detail: { mode: 'free' } }));
      
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        camera.position.set(0, 22, 14);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    };

    window.addEventListener('camera-view-mode-change', handleModeChange);
    window.addEventListener('camera-reset', handleReset);

    return () => {
      window.removeEventListener('camera-view-mode-change', handleModeChange);
      window.removeEventListener('camera-reset', handleReset);
    };
  }, [camera, controlsRef]);

  useFrame((state, delta) => {
    if (cameraMode === 'robot' && selectedRobotId) {
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }

      const interpolatedState = interpolationBuffer.getDelayedSnapshot();
      const robot = interpolatedState?.robots?.find(r => r.id === selectedRobotId)
        || gameStateRef?.current?.robots?.find(r => r.id === selectedRobotId);

      if (robot) {
        const sx = toSceneX(robot.position.x);
        const sz = toSceneZ(robot.position.y);
        
        const rotationAngle = robot.rotation ?? 0;
        const angleY = Math.PI / 2 - rotationAngle;

        const forwardX = Math.sin(angleY);
        const forwardZ = Math.cos(angleY);

        const targetCamX = sx - forwardX * 3.5;
        const targetCamZ = sz - forwardZ * 3.5;
        const targetCamY = 2.2;

        const targetLookX = sx + forwardX * 1.5;
        const targetLookZ = sz + forwardZ * 1.5;
        const targetLookY = 0.3;

        const lerpFactor = 1 - Math.pow(0.001, delta);

        camera.position.x += (targetCamX - camera.position.x) * lerpFactor;
        camera.position.y += (targetCamY - camera.position.y) * lerpFactor;
        camera.position.z += (targetCamZ - camera.position.z) * lerpFactor;

        if (controlsRef.current) {
          controlsRef.current.target.x += (targetLookX - controlsRef.current.target.x) * lerpFactor;
          controlsRef.current.target.y += (targetLookY - controlsRef.current.target.y) * lerpFactor;
          controlsRef.current.target.z += (targetLookZ - controlsRef.current.target.z) * lerpFactor;
          controlsRef.current.update();
        }
      } else {
        if (controlsRef.current && !controlsRef.current.enabled) {
          controlsRef.current.enabled = true;
        }
      }
    } else {
      if (controlsRef.current && !controlsRef.current.enabled) {
        controlsRef.current.enabled = true;
      }
    }
  });

  return null;
};

/**
 * Sets up the R3F Canvas and basic scene environment.
 * dpr and gl are memoised so R3F never sees them as "changed" and
 * never reconstructs the WebGL renderer on parent re-renders.
 */
export const SceneCanvas = ({
  children,
  graphicsQuality = 'medium',
  selectedRobotId,
  gameStateRef,
}: {
  children: React.ReactNode;
  graphicsQuality?: string;
  selectedRobotId?: string;
  gameStateRef?: MutableRefObject<GameState>;
}): React.JSX.Element => {
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);
  const controlsRef = useRef<any>(null);

  const dpr = useMemo<[number, number]>(() => {
    if (graphicsQuality === 'low') return [1, 1];
    if (isMobile) return [1, 1.5];
    return [1, 2];
  }, [graphicsQuality, isMobile]);

  const glProps = useMemo(() => ({
    powerPreference: 'high-performance' as const,
    antialias: graphicsQuality !== 'low',
  }), [graphicsQuality]);

  return (
    <Canvas dpr={dpr} gl={glProps}>
      <PerspectiveCamera makeDefault position={[0, 22, 14]} far={10000} />
      <OrbitControls ref={controlsRef} target={[0, 0, 0]} />
      <CameraController
        selectedRobotId={selectedRobotId}
        gameStateRef={gameStateRef}
        controlsRef={controlsRef}
      />
      <FrameSignaler />
      {children}
    </Canvas>
  );
};

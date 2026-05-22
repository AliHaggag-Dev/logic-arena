"use client";

import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, useProgress } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { useRobotColorTint } from "../hooks/useRobotColorTint";
import { ROBOTS } from "../constants/robots.constants";

/* ─── Preload all robot GLBs as soon as this module is imported ─────── */
ROBOTS.forEach((r) => useGLTF.preload(r.file));

/* ─── Robot model with shared color-tint hook ───────────────────────── */
function RobotModel({
  file,
  color,
  scale,
}: {
  file: string;
  color: string;
  scale?: number;
}) {
  const { scene } = useGLTF(file);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const groupRef = useRef<THREE.Group>(null!);
  const { invalidate } = useThree();

  // Shared hook handles tinting + disposal (fixes the material leak)
  useRobotColorTint(clonedScene as unknown as THREE.Group, color);

  // Explicitly trigger a re-render when the color changes since we use frameloop="demand"
  React.useEffect(() => {
    invalidate();
  }, [color, invalidate]);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={scale ?? 1.4} position={[0, -1.2, 0]} />
    </group>
  );
}

/* ─── Loading placeholder (CSS-based, outside WebGL) ────────────────── */
function ViewerLoadingOverlay() {
  const { active, progress } = useProgress();

  if (!active && progress >= 100) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <span className="text-accent/50 text-[10px] tracking-[0.25em] font-mono animate-pulse uppercase">
        LOADING MODEL {Math.round(progress)}%
      </span>
    </div>
  );
}

/* ─── RobotViewer ────────────────────────────────────────────────────── */
interface RobotViewerProps {
  file: string;
  color: string;
  scale?: number;
  isMobile?: boolean;
}

export function RobotViewer({ file, color, scale, isMobile }: RobotViewerProps) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-accent/10 bg-bg-secondary/80 relative shadow-2xl">
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent/40 rounded-tl-xl z-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent/40 rounded-br-xl z-20 pointer-events-none" />

      {/* Dot-grid background inside viewer */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(var(--accent-rgb), 0.5) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(var(--accent-rgb),0.5) 0px, rgba(var(--accent-rgb),0.5) 1px, transparent 1px, transparent 4px)",
        }}
      />

      {/* frameloop="demand" — only re-renders on OrbitControls interaction */}
      <Canvas
        camera={{ position: [0, 1.2, isMobile ? 6 : 5], fov: isMobile ? 45 : 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        frameloop="demand"
      >
        <ambientLight intensity={0.6} />
        {/* Use CSS variable references via theme-resolved values, not hardcoded hex */}
        <directionalLight position={[10, 10, 5]} intensity={2} color="var(--accent)" />
        <directionalLight position={[-10, 5, -5]} intensity={0.8} />
        <pointLight position={[0, -2, 0]} intensity={2} color="var(--accent)" distance={10} />

        <Suspense fallback={null}>
          <RobotModel file={file} color={color} scale={isMobile ? (scale ?? 1.4) * 0.85 : scale} />
          <Environment preset="night" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={isMobile ? 10 : 8}
          autoRotate={false}
          enableDamping
          dampingFactor={0.1}
          rotateSpeed={isMobile ? 0.8 : 1}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI * 0.75}
        />
      </Canvas>

      {/* CSS loading overlay tied to Drei loader progress */}
      <ViewerLoadingOverlay />
    </div>
  );
}

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Group, CanvasTexture, AdditiveBlending } from "three";
import { MapTheme } from "../../../types";
import { IS_MOBILE } from "./constants";

interface SpaceNebulaProps {
  position: [number, number, number];
  mapTheme: MapTheme;
  graphicsQuality?: string;
}

export const SpaceNebula = ({ position, mapTheme, graphicsQuality = "medium" }: SpaceNebulaProps) => {
  const nebulaRef = useRef<Group>(null);
  
  useFrame((_, delta) => {
    if (nebulaRef.current) {
      // Slow organic rotation
      nebulaRef.current.rotation.y += 0.003 * delta;
      nebulaRef.current.rotation.z += 0.001 * delta;
    }
  });

  // Programmatically generate a soft radial cloud puff texture
  // This is highly compatible, completely eliminates the cross/grid pixelation artifacts,
  // and renders beautiful smooth overlapping gas clouds on all devices!
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.75)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    return () => {
      cloudTexture.dispose();
    };
  }, [cloudTexture]);

  const nebulaData = useMemo(() => {
    // Increased particle density slightly for the larger spread
    const count = IS_MOBILE
      ? (graphicsQuality === "high" ? 1500 : graphicsQuality === "low" ? 1200 : 1000)
      : (graphicsQuality === "high" ? 4500 : graphicsQuality === "low" ? 1200 : 2800);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Setup theme color roles (soft, distributed hues inspired by "Stellar Nursery")
    let colBase = new Color("#7f1d1d");      // Deep ruby red
    let colRose = new Color("#e879f9");      // Bright violet-rose / pink
    let colBlue = new Color("#2563eb");      // Deep space blue
    let colCyan = new Color("#06b6d4");      // Vibrant turquoise/cyan
    let colPurple = new Color("#6d28d9");    // Deep purple
    let colGold = new Color("#f59e0b");      // Warm amber/gold highlight

    if (mapTheme === "LAVA") {
      colBase = new Color("#450a0a");
      colRose = new Color("#ea580c");
      colBlue = new Color("#f97316");
      colCyan = new Color("#eab308");
      colPurple = new Color("#7c2d12");
      colGold = new Color("#facc15");
    } else if (mapTheme === "ICE") {
      colBase = new Color("#1e3b8a");
      colRose = new Color("#0284c7");
      colBlue = new Color("#0369a1");
      colCyan = new Color("#06b6d4");
      colPurple = new Color("#312e81");
      colGold = new Color("#a5f3fc");
    }

    for (let i = 0; i < count; i++) {
      // Expanded size: radius up to 270 (was 125)
      const r = Math.pow(Math.random(), 1.4) * 270;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);

      // Low frequency sine billows for organic cloud lumpiness
      const lump = 1.0 + Math.sin(theta * 3.0) * Math.cos(phi * 2.0) * 0.22;
      const finalR = r * lump;

      // Ellipsoid flattening (slightly flatter along Y axis for cosmic disk feel)
      const x = finalR * Math.sin(phi) * Math.cos(theta);
      const y = finalR * Math.cos(phi) * 0.75;
      const z = finalR * Math.sin(phi) * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // --- Rich Multi-Color Blending Math ---
      // We combine different coordinates to make independent color lanes/zones
      const factorX = (Math.sin(x * 0.008) + 1.0) / 2.0;
      const factorY = (Math.cos(y * 0.010) + 1.0) / 2.0;
      const factorZ = (Math.sin(z * 0.007) + 1.0) / 2.0;

      let c = colBase.clone();

      // Mix 1: Base colors (Red, Purple, Blue) along X/Z wave
      const mixXZ = (factorX + factorZ) / 2.0;
      if (mixXZ < 0.35) {
        c.lerp(colPurple, mixXZ / 0.35);
      } else if (mixXZ < 0.7) {
        c.copy(colPurple).lerp(colBlue, (mixXZ - 0.35) / 0.35);
      } else {
        c.copy(colBlue).lerp(colRose, (mixXZ - 0.7) / 0.3);
      }

      // Mix 2: Add turquoise/cyan lanes in specific wave intersections
      const mixCyan = Math.sin(x * 0.005 + y * 0.006) * Math.cos(z * 0.005);
      if (mixCyan > 0.4) {
        c.lerp(colCyan, (mixCyan - 0.4) * 1.2);
      }

      // Mix 3: Add warm amber/gold dust highlights in other regions
      const mixGold = Math.cos(x * 0.007 - z * 0.007) * Math.sin(y * 0.008);
      if (mixGold > 0.55) {
        c.lerp(colGold, (mixGold - 0.55) * 1.5);
      }

      // Mix 4: Center light glow (soft white-cyan glow in center)
      const distToCenter = Math.sqrt(x*x + y*y + z*z);
      if (distToCenter < 160) {
        const centerFactor = (160 - distToCenter) / 160;
        const glowCol = mapTheme === "LAVA" ? new Color("#ffea00") : mapTheme === "ICE" ? new Color("#e0ffff") : new Color("#dbeafe");
        c.lerp(glowCol, centerFactor * 0.35); // soft 35% center lighting
      }

      // Add small color variation
      colors[i * 3] = Math.max(0, Math.min(1, c.r + (Math.random() - 0.5) * 0.03));
      colors[i * 3 + 1] = Math.max(0, Math.min(1, c.g + (Math.random() - 0.5) * 0.03));
      colors[i * 3 + 2] = Math.max(0, Math.min(1, c.b + (Math.random() - 0.5) * 0.03));
    }

    return { positions, colors };
  }, [mapTheme, graphicsQuality]);

  return (
    <group position={position} ref={nebulaRef}>
      {/* Volumetric gas cloud */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[nebulaData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[nebulaData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={graphicsQuality === "high" ? 75 : 55}
          sizeAttenuation={true}
          map={cloudTexture}
          transparent={true}
          opacity={0.3} // soft opacity for beautiful overlapping volume
          depthWrite={false}
          blending={AdditiveBlending}
          vertexColors={true}
        />
      </points>
    </group>
  );
};
export default SpaceNebula;

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Color, AdditiveBlending } from "three";
import { Billboard } from "@react-three/drei";
import { MapTheme } from "../../../types";
import { GlowingDisk } from "./GlowingDisk";

interface GalaxyBlackHoleProps {
  mapTheme: MapTheme;
}

export const GalaxyBlackHole = ({ mapTheme }: GalaxyBlackHoleProps) => {
  const ringsInnerRef = useRef<Group>(null);
  const ringsOuterRef = useRef<Group>(null);
  const haloRef = useRef<Group>(null);

  useFrame((state, delta) => {
    // 1. Counter-Rotating Accretion Disk loops for complex plasma shear effect
    if (ringsInnerRef.current) {
      ringsInnerRef.current.rotation.z -= delta * 0.35;
    }
    if (ringsOuterRef.current) {
      ringsOuterRef.current.rotation.z += delta * 0.12;
    }

    // 2. Gravitational lensing pulsation (Event Horizon "breathing" gravity waves)
    if (haloRef.current) {
      const time = state.clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(time * 1.4) * 0.05;
      haloRef.current.scale.setScalar(pulse);
    }
  });

  const { colorIn, colorOut, colorCore } = useMemo(() => {
    if (mapTheme === "LAVA") {
      return {
        colorIn: new Color("#ffaa00"),
        colorOut: new Color("#440000"),
        colorCore: new Color("#ff2200"),
      };
    }
    if (mapTheme === "ICE") {
      return {
        colorIn: new Color("#ffffff"),
        colorOut: new Color("#002255"),
        colorCore: new Color("#00aaff"),
      };
    }
    // CYBER Theme
    return {
      colorIn: new Color("#00ffff"),
      colorOut: new Color("#220044"),
      colorCore: new Color("#ff00ff"),
    };
  }, [mapTheme]);

  return (
    <group scale={2.2}>
      {/* Event Horizon (Pure Black Sphere) */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[14, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Gravitational Lensing Halo (Billboarded to mimic curved light path) */}
      <group ref={haloRef}>
        <Billboard>
          <GlowingDisk
            minRadius={14}
            maxRadius={32}
            opacityMultiplier={0.85}
            colorIn={colorIn}
            colorOut={colorOut}
          />
        </Billboard>
      </group>

      {/* Accretion Disk (Equatorial & Tilted) */}
      <group rotation={[0.25, 0.1, -0.15]}>
        {/* Inner Counter-Clockwise Accretion rings */}
        <group ref={ringsInnerRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[15.5, 1.2, 16, 100]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.85}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>

        {/* Outer Clockwise Accretion rings */}
        <group ref={ringsOuterRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[18, 2.2, 16, 100]} />
            <meshBasicMaterial
              color={colorCore}
              transparent
              opacity={0.5}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Outer accretion gradient */}
          <GlowingDisk
            minRadius={15}
            maxRadius={65}
            opacityMultiplier={0.95}
            rot={[-Math.PI / 2, 0, 0]}
            colorIn={colorIn}
            colorOut={colorOut}
          />
        </group>
      </group>
    </group>
  );
};
export default GalaxyBlackHole;

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Color, AdditiveBlending } from "three";
import { Billboard } from "@react-three/drei";
import { MapTheme } from "../../../../types";
import { GlowingDisk } from "../GlowingDisk";

interface GalaxyBlackHoleProps {
  mapTheme: MapTheme;
  scale?: number;
}

export const GalaxyBlackHole = ({ mapTheme, scale = 2.4 }: GalaxyBlackHoleProps) => {
  const ringsInnerRef = useRef<Group>(null);
  const ringsOuterRef = useRef<Group>(null);
  const haloRef = useRef<Group>(null);
  const photonRingRef = useRef<Group>(null);

  useFrame((state, delta) => {
    // 1. Counter-Rotating Accretion Disk loops for complex plasma shear effect
    if (ringsInnerRef.current) {
      ringsInnerRef.current.rotation.z -= delta * 0.42;
    }
    if (ringsOuterRef.current) {
      ringsOuterRef.current.rotation.z += delta * 0.14;
    }

    // 2. Gravitational lensing pulsation (Event Horizon breathing gravity waves)
    if (haloRef.current) {
      const time = state.clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(time * 1.5) * 0.04;
      haloRef.current.scale.setScalar(pulse);
    }

    // 3. Photon ring shimmer
    if (photonRingRef.current) {
      const time = state.clock.getElapsedTime();
      photonRingRef.current.rotation.z += delta * 0.08;
      const sh = 1.0 + Math.sin(time * 3.2) * 0.02;
      photonRingRef.current.scale.set(sh, sh, 1.0);
    }
  });

  const { colorIn, colorOut, colorCore, photonColor } = useMemo(() => {
    if (mapTheme === "LAVA") {
      return {
        colorIn: new Color("#ffbb33"),
        colorOut: new Color("#440000"),
        colorCore: new Color("#ff3300"),
        photonColor: new Color("#fff4cc"),
      };
    }
    if (mapTheme === "ICE") {
      return {
        colorIn: new Color("#e0f2fe"),
        colorOut: new Color("#021a36"),
        colorCore: new Color("#0284c7"),
        photonColor: new Color("#ffffff"),
      };
    }
    // CYBER Theme (Default)
    return {
      colorIn: new Color("#38bdf8"),
      colorOut: new Color("#1e1136"),
      colorCore: new Color("#d946ef"),
      photonColor: new Color("#fdf4ff"),
    };
  }, [mapTheme]);

  return (
    <group scale={scale}>
      {/* 🌑 Event Horizon (Pure Light-Absorbing Sphere) */}
      <mesh>
        <sphereGeometry args={[14, 24, 24]} />
        <meshBasicMaterial color="#000000" depthWrite={true} />
      </mesh>

      {/* ⚡ Relativistic Photon Ring (Extreme Doppler-Boosted Light Radius) */}
      <group ref={photonRingRef}>
        <Billboard>
          <mesh>
            <ringGeometry args={[14.1, 15.2, 64]} />
            <meshBasicMaterial
              color={photonColor}
              transparent
              opacity={0.95}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </Billboard>
      </group>

      {/* 💫 Gravitational Lensing Halo (Spherical Curvature of Background Light) */}
      <group ref={haloRef}>
        <Billboard>
          <GlowingDisk
            minRadius={14}
            maxRadius={38}
            opacityMultiplier={0.92}
            colorIn={colorIn}
            colorOut={colorOut}
          />
        </Billboard>
      </group>

      {/* 🔥 High-Energy Relativistic Accretion Disk (Equatorial & Tilted) */}
      <group rotation={[0.22, 0.08, -0.14]}>
        {/* Inner Counter-Clockwise Accretion rings (Ultra-Hot Infall Plasma) */}
        <group ref={ringsInnerRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[15.6, 1.1, 16, 96]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.9}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[17.2, 1.4, 16, 96]} />
            <meshBasicMaterial
              color={colorIn}
              transparent
              opacity={0.65}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>

        {/* Outer Clockwise Accretion rings */}
        <group ref={ringsOuterRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[20.5, 2.2, 16, 96]} />
            <meshBasicMaterial
              color={colorCore}
              transparent
              opacity={0.45}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Continuous Accretion Plasma Disk */}
          <GlowingDisk
            minRadius={15}
            maxRadius={78}
            opacityMultiplier={0.92}
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

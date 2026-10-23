import React, { useMemo, useEffect } from "react";
import { ShaderMaterial, AdditiveBlending, DoubleSide } from "three";
import { Billboard } from "@react-three/drei";
import {
  EINSTEIN_RING_POSITION,
  EINSTEIN_RING_RADIUS,
} from "./constants";
import {
  EINSTEIN_RING_VERT,
  EINSTEIN_RING_FRAG,
} from "./shaders";
import { MacroUniforms } from "./types";

interface EinsteinRingProps {
  uniforms: MacroUniforms;
}

export const EinsteinRing: React.FC<EinsteinRingProps> = ({ uniforms }) => {
  const ringMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: EINSTEIN_RING_VERT,
      fragmentShader: EINSTEIN_RING_FRAG,
      uniforms: {
        uTime: uniforms.uTime,
        uZoom: uniforms.uZoom,
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
  }, [uniforms]);

  // WebGL disposal
  useEffect(() => {
    return () => {
      ringMaterial.dispose();
    };
  }, [ringMaterial]);

  const planeSize = EINSTEIN_RING_RADIUS * 2.2;

  return (
    <group position={EINSTEIN_RING_POSITION}>
      <Billboard>
        {/* Gravitational Microlensing Einstein Ring (Cosmic Horseshoe LRG 3-757) */}
        <mesh material={ringMaterial}>
          <planeGeometry args={[planeSize, planeSize, 1, 1]} />
        </mesh>
      </Billboard>
    </group>
  );
};

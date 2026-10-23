import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Group,
  ShaderMaterial,
  PointsMaterial,
  AdditiveBlending,
  DoubleSide,
  Vector3,
  Quaternion,
  BufferGeometry,
  BufferAttribute,
} from "three";
import { Billboard } from "@react-three/drei";
import {
  COMET_HEAD_POSITION,
  COMET_TAIL_DIRECTION,
} from "./constants";
import {
  COMET_COMA_VERT,
  COMET_COMA_FRAG,
  COMET_TAIL_VERT,
  COMET_TAIL_FRAG,
} from "./shaders";
import { MacroCosmosPalette, MacroUniforms } from "./types";

interface InterstellarCometProps {
  palette: MacroCosmosPalette;
  uniforms: MacroUniforms;
}

export const InterstellarComet: React.FC<InterstellarCometProps> = ({
  palette,
  uniforms,
}) => {
  const cometRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);

  // Align the comet tail along the physical flight vector
  const tailOrientation = useMemo(() => {
    const dir = new Vector3(...COMET_TAIL_DIRECTION).normalize();
    const up = new Vector3(1, 0, 0); // initial plane x-axis
    const q = new Quaternion().setFromUnitVectors(up, dir);
    return q;
  }, []);

  // 1. Photorealistic Volumetric Coma & Star Nucleus Shader Material
  const comaMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: COMET_COMA_VERT,
      fragmentShader: COMET_COMA_FRAG,
      uniforms: {
        uColorHead: { value: palette.cometCore },
        uColorTail: { value: palette.cometTail },
        uTime: uniforms.uTime,
        uZoom: uniforms.uZoom,
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
  }, [palette, uniforms]);

  // 2. Photorealistic Dual-Stream Ion Tail Shader Material
  const tailMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: COMET_TAIL_VERT,
      fragmentShader: COMET_TAIL_FRAG,
      uniforms: {
        uColorHead: { value: palette.cometCore },
        uColorTail: { value: palette.cometTail },
        uTime: uniforms.uTime,
        uZoom: uniforms.uZoom,
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
  }, [palette, uniforms]);

  // 3. Sublimating Ice Crystal Dust Sparks trailing behind the nucleus
  const dustSparks = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distance along tail
      const dist = 30 + Math.pow(Math.random(), 1.4) * 1400;
      // Radial spread expands with distance
      const spread = (Math.random() - 0.5) * (30 + dist * 0.16);
      const angle = Math.random() * Math.PI * 2;

      positions[i * 3] = dist;
      positions[i * 3 + 1] = Math.cos(angle) * spread;
      positions[i * 3 + 2] = Math.sin(angle) * spread;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    return geo;
  }, []);

  const dustMaterial = useMemo(() => {
    return new PointsMaterial({
      color: palette.cometCore,
      size: 4.5,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    });
  }, [palette]);

  // Keep colors updated
  useEffect(() => {
    comaMaterial.uniforms.uColorHead.value = palette.cometCore;
    comaMaterial.uniforms.uColorTail.value = palette.cometTail;
    tailMaterial.uniforms.uColorHead.value = palette.cometCore;
    tailMaterial.uniforms.uColorTail.value = palette.cometTail;
    dustMaterial.color.copy(palette.cometCore);
  }, [palette, comaMaterial, tailMaterial, dustMaterial]);

  // Cleanup
  useEffect(() => {
    return () => {
      comaMaterial.dispose();
      tailMaterial.dispose();
      dustMaterial.dispose();
      dustSparks.dispose();
    };
  }, [comaMaterial, tailMaterial, dustMaterial, dustSparks]);

  // Organic micro-pulsation and subtle ion tail shimmering
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (headRef.current) {
      const shimmer = 1.0 + Math.sin(time * 3.2) * 0.04;
      headRef.current.scale.setScalar(shimmer);
    }
  });

  return (
    <group ref={cometRef} position={COMET_HEAD_POSITION}>
      {/* ☄️ 1. Astrophotography-Grade Volumetric Coma & Star Nucleus (Billboard Quad) */}
      <group ref={headRef}>
        <Billboard>
          <mesh material={comaMaterial}>
            <planeGeometry args={[320, 320, 1, 1]} />
          </mesh>
        </Billboard>
      </group>

      {/* 🌌 2. Sweeping Dual-Plane Ion Tail (Seamlessly flowing out of the Coma) */}
      <group quaternion={tailOrientation}>
        {/* Horizontal Tail Plane */}
        <mesh material={tailMaterial} position={[800, 0, 0]}>
          <planeGeometry args={[1600, 380, 1, 1]} />
        </mesh>
        {/* Vertical Cross Tail Plane (Creates 3D volumetric thickness from any camera angle) */}
        <mesh
          material={tailMaterial}
          position={[800, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1600, 380, 1, 1]} />
        </mesh>

        {/* ❄️ Sublimating Ice Crystal Dust Sparks inside the tail */}
        <points geometry={dustSparks} material={dustMaterial} />
      </group>
    </group>
  );
};

export default InterstellarComet;

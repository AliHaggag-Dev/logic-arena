import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Group, Mesh, AdditiveBlending, DoubleSide } from "three";
import { Billboard } from "@react-three/drei";
import { GlowingDisk } from "./GlowingDisk";

const BEAM_VERT = `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BEAM_FRAG = `
  uniform vec3 color;
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    // 3D Volumetric Softness: brightest in center, fades out at the round edges
    float edge = pow(abs(vNormal.z), 1.6);
    // Smooth length falloff: brightest near core (vUv.y=1.0 at tip), fades to black in space (vUv.y=0.0 at base)
    float lengthFade = pow(vUv.y, 1.6);
    gl_FragColor = vec4(color, edge * lengthFade * 0.45);
  }
`;

interface SpacePulsarProps {
  position: [number, number, number];
  color: Color;
  beamColor: Color;
}

export const SpacePulsar = ({ position, color, beamColor }: SpacePulsarProps) => {
  const pulsarRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (pulsarRef.current) {
      // Rotates the relativistic jet beams like a cosmic lighthouse
      pulsarRef.current.rotation.y += 0.35 * delta;
      pulsarRef.current.rotation.z += 0.08 * delta;
    }
    if (coreRef.current) {
      // Extremely rapid twinkling of the pulsar core (simulating high rotation frequency)
      const time = state.clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(time * 18.0) * 0.18;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  const beamUniformsA = useMemo(() => ({ color: { value: beamColor } }), [beamColor]);
  const beamUniformsB = useMemo(() => ({ color: { value: beamColor } }), [beamColor]);

  return (
    <group position={position}>
      {/* Soft Volumetric Pulsar Core Glow (No sharp borders) */}
      <Billboard>
        <GlowingDisk
          minRadius={0}
          maxRadius={22}
          opacityMultiplier={1.0}
          colorIn={color}
          colorOut={beamColor}
        />
      </Billboard>

      {/* Rotating relativistic energy jets */}
      <group ref={pulsarRef}>
        {/* Jet Beam A (pointing along positive Y, rotated to point along positive Z) */}
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, -300, 0]}>
            <coneGeometry args={[25, 600, 16, 1, true]} />
            <shaderMaterial
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
              uniforms={beamUniformsA}
              vertexShader={BEAM_VERT}
              fragmentShader={BEAM_FRAG}
            />
          </mesh>
        </group>

        {/* Jet Beam B (pointing along positive Y, rotated to point along negative Z) */}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <mesh position={[0, -300, 0]}>
            <coneGeometry args={[25, 600, 16, 1, true]} />
            <shaderMaterial
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
              uniforms={beamUniformsB}
              vertexShader={BEAM_VERT}
              fragmentShader={BEAM_FRAG}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};
export default SpacePulsar;

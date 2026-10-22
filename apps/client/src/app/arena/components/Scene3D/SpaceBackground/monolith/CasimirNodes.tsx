import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CylinderGeometry,
  Group,
  Mesh,
  Quaternion,
  ShaderMaterial,
  TorusGeometry,
  Vector3,
} from "three";
import {
  CASIMIR_NODE_POSITIONS,
  MONOLITH_EDGES,
} from "./physics";
import { QUANTUM_FILAMENT_FRAG, QUANTUM_FILAMENT_VERT } from "./shaders";
import { MonolithThemeColors } from "./types";

interface CasimirNodesProps {
  palette: MonolithThemeColors;
  observerFactor: number;
}

interface EdgeBeamData {
  midpoint: [number, number, number];
  quaternion: Quaternion;
  length: number;
}

export const CasimirNodes: React.FC<CasimirNodesProps> = ({ palette, observerFactor }) => {
  const gimbalsGroupRef = useRef<Group>(null);
  const ringRef1 = useRef<Group>(null);
  const ringRef2 = useRef<Group>(null);
  const ringRef3 = useRef<Group>(null);

  // Shader material for the 12 relativistic filaments
  const filamentMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: QUANTUM_FILAMENT_VERT,
      fragmentShader: QUANTUM_FILAMENT_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uBeamColor: { value: palette.beamFilament },
        uPulseRate: { value: 2.4 },
        uTurbulence: { value: 0.18 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
  }, [palette.beamFilament]);

  // Compute position, orientation and length of the 12 edges
  const edgeBeams = useMemo<EdgeBeamData[]>(() => {
    const beams: EdgeBeamData[] = [];
    const upVector = new Vector3(0, 1, 0);

    for (const [startIdx, endIdx] of MONOLITH_EDGES) {
      const p1 = new Vector3(...CASIMIR_NODE_POSITIONS[startIdx]);
      const p2 = new Vector3(...CASIMIR_NODE_POSITIONS[endIdx]);

      const dir = new Vector3().subVectors(p2, p1);
      const len = dir.length();
      const midpoint = new Vector3().addVectors(p1, p2).multiplyScalar(0.5);

      const quat = new Quaternion();
      dir.normalize();
      quat.setFromUnitVectors(upVector, dir);

      beams.push({
        midpoint: [midpoint.x, midpoint.y, midpoint.z],
        quaternion: quat,
        length: len,
      });
    }

    return beams;
  }, []);

  // Shared reusable geometries
  const sharedGeometries = useMemo(() => {
    return {
      singularityCore: new CylinderGeometry(0.12, 0.12, 0.12, 8),
      innerRing: new TorusGeometry(0.38, 0.024, 8, 24),
      middleRing: new TorusGeometry(0.48, 0.02, 8, 24),
      outerRing: new TorusGeometry(0.58, 0.016, 8, 24),
    };
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const speedBoost = 1.0 + observerFactor * 2.2;

    // Mutate filament shader time directly (zero re-render)
    filamentMaterial.uniforms.uTime.value = time;
    filamentMaterial.uniforms.uPulseRate.value = 2.4 * speedBoost;

    // Relativistic precession of containment rings
    if (ringRef1.current) {
      ringRef1.current.rotation.x += delta * 1.8 * speedBoost;
      ringRef1.current.rotation.y += delta * 0.9 * speedBoost;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.y -= delta * 1.5 * speedBoost;
      ringRef2.current.rotation.z += delta * 1.2 * speedBoost;
    }
    if (ringRef3.current) {
      ringRef3.current.rotation.z += delta * 2.1 * speedBoost;
      ringRef3.current.rotation.x -= delta * 0.7 * speedBoost;
    }
  });

  return (
    <group ref={gimbalsGroupRef}>
      {/* ════════════════════ 12 RELATIVISTIC EDGE FILAMENTS ════════════════════ */}
      {edgeBeams.map((beam, i) => (
        <mesh
          key={`filament-${i}`}
          position={beam.midpoint}
          quaternion={beam.quaternion}
          material={filamentMaterial}
        >
          <cylinderGeometry args={[0.07, 0.07, beam.length, 6, 1, true]} />
        </mesh>
      ))}

      {/* ════════════════════ 8 CASIMIR SINGULARITY NODES ════════════════════ */}
      {CASIMIR_NODE_POSITIONS.map((pos, i) => (
        <group key={`casimir-node-${i}`} position={pos}>
          {/* Micro-Event Horizon (Pure Black Void Center) */}
          <mesh geometry={sharedGeometries.singularityCore}>
            <meshBasicMaterial color="#000000" />
          </mesh>

          {/* Kerr Ergosphere Luminous Shell */}
          <mesh>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshBasicMaterial
              color={palette.singularity}
              transparent
              opacity={0.85}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Tri-Axial Containment Gimbals (Precessing Relativistic Magnetic Rings) */}
          <group ref={i === 0 ? ringRef1 : undefined}>
            <mesh geometry={sharedGeometries.innerRing}>
              <meshBasicMaterial
                color={palette.primary}
                transparent
                opacity={0.7}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>

          <group
            ref={i === 0 ? ringRef2 : undefined}
            rotation={[Math.PI / 3, 0, Math.PI / 4]}
          >
            <mesh geometry={sharedGeometries.middleRing}>
              <meshBasicMaterial
                color={palette.secondary}
                transparent
                opacity={0.6}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>

          <group
            ref={i === 0 ? ringRef3 : undefined}
            rotation={[0, Math.PI / 2, Math.PI / 6]}
          >
            <mesh geometry={sharedGeometries.outerRing}>
              <meshBasicMaterial
                color={palette.beamFilament}
                transparent
                opacity={0.5}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

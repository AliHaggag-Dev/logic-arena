import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  ShaderMaterial,
  Vector3,
} from "three";
import { stopMonolithAudio, updateMonolithAudio } from "../audio";
import { CasimirNodes } from "./CasimirNodes";
import {
  computeObserverCoupling,
  getMonolithThemePalette,
  MONOLITH_DEPTH,
  MONOLITH_DRIFT_AMPLITUDE,
  MONOLITH_DRIFT_SPEED,
  MONOLITH_HEIGHT,
  MONOLITH_TUMBLE_X,
  MONOLITH_TUMBLE_Y,
  MONOLITH_TUMBLE_Z,
  MONOLITH_WIDTH,
  MONOLITH_WORLD_POS,
  project4DVertex,
  TESSERACT_DATA,
} from "./physics";
import { MONOLITH_CORE_FRAG, MONOLITH_CORE_VERT } from "./shaders";
import { SpacetimeLensing } from "./SpacetimeLensing";
import { MonolithProps } from "./types";

const FOCAL_DISTANCE_4D = 2.45;
const TESSERACT_EDGE_COUNT = 32;

export const CosmicMonolith: React.FC<MonolithProps> = ({ mapTheme }) => {
  const groupRef = useRef<Group>(null);
  const coreMeshRef = useRef<Mesh>(null);
  const tesseractLinesRef = useRef<LineSegments>(null);

  const { camera } = useThree();

  // Resolved color palette for current map theme
  const palette = useMemo(() => getMonolithThemePalette(mapTheme), [mapTheme]);

  // Observer coupling state stored in ref for zero React re-renders
  const observerRef = useRef({
    proximity: 0,
    alignment: 0,
    factor: 0,
  });

  // 16 Vector3 instances for projected 4D tesseract vertices
  const projectedVertices = useMemo(() => {
    return Array.from({ length: 16 }, () => new Vector3());
  }, []);

  // Float32 buffer for the 32 edges (64 vertices = 192 floats)
  const linePositions = useMemo(() => {
    return new Float32Array(TESSERACT_EDGE_COUNT * 2 * 3);
  }, []);

  const lineGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(linePositions, 3));
    return geo;
  }, [linePositions]);

  // Monolith Core Shader Material
  const coreMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: MONOLITH_CORE_VERT,
      fragmentShader: MONOLITH_CORE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uCameraPosition: { value: new Vector3() },
        uObserverProximity: { value: 0 },
        uObserverAlignment: { value: 0 },
        uPrimaryColor: { value: palette.primary },
        uSecondaryColor: { value: palette.secondary },
        uSubsurfaceColor: { value: palette.subsurface },
        uDimensions: {
          value: new Vector3(MONOLITH_WIDTH, MONOLITH_HEIGHT, MONOLITH_DEPTH),
        },
        uTesseractVertices: { value: projectedVertices },
        uSubsurfaceDensity: { value: 1.4 },
        uDispersiveIndex: { value: 0.14 },
      },
      transparent: false,
    });
  }, [palette, projectedVertices]);

  // Internal hypercube line material
  const lineMaterial = useMemo(() => {
    return new LineBasicMaterial({
      color: palette.secondary,
      transparent: true,
      opacity: 0.65,
      blending: AdditiveBlending,
      depthWrite: false,
    });
  }, [palette.secondary]);

  // Stop spatial audio cleanly when unmounted
  useEffect(() => {
    return () => {
      stopMonolithAudio();
    };
  }, []);

  // Disposal of GPU memory on unmount
  useEffect(() => {
    return () => {
      coreMaterial.dispose();
      lineMaterial.dispose();
      lineGeometry.dispose();
    };
  }, [coreMaterial, lineMaterial, lineGeometry]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const group = groupRef.current;
    if (!group) return;

    // 1. Cosmic Drift and Relativistic Tumble
    group.rotation.y += MONOLITH_TUMBLE_Y * delta;
    group.rotation.x += MONOLITH_TUMBLE_X * delta;
    group.rotation.z += MONOLITH_TUMBLE_Z * delta;
    group.position.y =
      MONOLITH_WORLD_POS[1] +
      Math.sin(time * MONOLITH_DRIFT_SPEED) * MONOLITH_DRIFT_AMPLITUDE;

    // 2. Compute Quantum Observer Coupling (Camera Distance & Alignment)
    const cameraForward = new Vector3();
    camera.getWorldDirection(cameraForward);

    const { proximity, alignment } = computeObserverCoupling(
      group.position,
      camera.position,
      cameraForward,
    );

    observerRef.current.proximity = proximity;
    observerRef.current.alignment = alignment;
    observerRef.current.factor = Math.min(1.0, proximity * 1.5 + alignment * 0.5);

    // 3. Update Spatial Audio Resonance
    const distToCam = camera.position.distanceTo(group.position);
    updateMonolithAudio(distToCam, alignment);

    // 4. Update Core Shader Uniforms directly
    coreMaterial.uniforms.uTime.value = time;
    coreMaterial.uniforms.uCameraPosition.value.copy(camera.position);
    coreMaterial.uniforms.uObserverProximity.value = proximity;
    coreMaterial.uniforms.uObserverAlignment.value = alignment;

    // 5. 4D Tesseract Rotation & Stereographic Projection
    // Observer factor accelerates the 4D rotation (Quantum excitation)
    const speedMultiplier = 1.0 + observerRef.current.factor * 1.8;
    const theta1 = time * 0.45 * speedMultiplier;
    const theta2 = time * 0.32 * speedMultiplier;

    for (let i = 0; i < 16; i++) {
      project4DVertex(
        TESSERACT_DATA.vertices4D[i],
        theta1,
        theta2,
        FOCAL_DISTANCE_4D,
        projectedVertices[i],
      );
    }

    // Update internal line buffer for the 32 hypercube edges
    const posAttr = lineGeometry.attributes.position as BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let e = 0; e < TESSERACT_EDGE_COUNT; e++) {
      const [i1, i2] = TESSERACT_DATA.edges[e];
      const p1 = projectedVertices[i1];
      const p2 = projectedVertices[i2];

      const offset = e * 6;
      arr[offset] = p1.x;
      arr[offset + 1] = p1.y;
      arr[offset + 2] = p1.z;
      arr[offset + 3] = p2.x;
      arr[offset + 4] = p2.y;
      arr[offset + 5] = p2.z;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group position={MONOLITH_WORLD_POS} ref={groupRef}>
      {/* ════════════════════ 1. MONOLITH CORE (4D OBSIDIAN PBR) ════════════════════ */}
      <mesh ref={coreMeshRef} material={coreMaterial}>
        <boxGeometry args={[MONOLITH_WIDTH, MONOLITH_HEIGHT, MONOLITH_DEPTH]} />
      </mesh>

      {/* ════════════════════ 2. 4D HYPERCUBE INTERNAL QUANTUM LATTICE ════════════════════ */}
      <lineSegments
        ref={tesseractLinesRef}
        geometry={lineGeometry}
        material={lineMaterial}
      />

      {/* ════════════════════ 3. ULTRA-THIN OPTICAL OBSIDIAN REFLECTIVE SHELL ════════════════════ */}
      <mesh scale={[1.006, 1.002, 1.018]}>
        <boxGeometry args={[MONOLITH_WIDTH, MONOLITH_HEIGHT, MONOLITH_DEPTH]} />
        <meshStandardMaterial
          color="#010103"
          roughness={0.03}
          metalness={0.96}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* ════════════════════ 4. SPACETIME GRAVITATIONAL LENSING ENVELOPE ════════════════════ */}
      <SpacetimeLensing
        palette={palette}
        observerFactor={observerRef.current.factor}
      />

      {/* ════════════════════ 5. CASIMIR SINGULARITY NODES & EDGE FILAMENTS ════════════════════ */}
      <CasimirNodes
        palette={palette}
        observerFactor={observerRef.current.factor}
      />
    </group>
  );
};

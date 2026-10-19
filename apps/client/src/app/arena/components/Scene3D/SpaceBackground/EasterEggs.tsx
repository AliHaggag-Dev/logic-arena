import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Group,
  Mesh,
  Points,
  Vector3,
  MeshStandardMaterial,
  MeshBasicMaterial,
  PointsMaterial,
  AdditiveBlending,
  DoubleSide,
  Color,
  ShaderMaterial
} from "three";
import { MapTheme } from "../../../types";
import { playExplosionSound, playSatellitePing } from "./audio";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const SATELLITE_POSITION: [number, number, number] = [-420, 120, 360];
const SATELLITE_DRIFT_SPEED = 0.4;
const SATELLITE_DRIFT_AMPLITUDE = 6;
const SATELLITE_TUMBLE_Y = 0.08;
const SATELLITE_TUMBLE_X = 0.04;
const BEACON_BLINK_FREQUENCY = 5.0;
const PING_EXPAND_SPEED = 25;
const PING_MAX_SCALE = 110;
const PING_OPACITY_DIVISOR = 110;
const PING_MAX_OPACITY = 0.22;

const MONOLITH_POSITION: [number, number, number] = [430, -90, -380];
const MONOLITH_ROTATION_SPEED = 0.06;
const MONOLITH_DRIFT_SPEED = 0.3;
const MONOLITH_DRIFT_AMPLITUDE = 5;
const MONOLITH_GLOW_SPEED = 0.7;
const MONOLITH_GLOW_BASE = 0.2;
const MONOLITH_GLOW_RANGE = 0.5;
const MONOLITH_SCALE_OUTLINE = 1.035;

const EXPLODING_DRIFT_DURATION_BASE = 30.0;
const EXPLODING_DRIFT_OFFSET_FACTOR = 8;
const EXPLODING_CHARGE_DURATION = 3.5;
const EXPLODING_BURST_DURATION = 1.6;
const EXPLODING_COOLDOWN_DURATION = 15.0;
const EXPLODING_SHAKE_FREQUENCY = 45.0;
const EXPLODING_SHAKE_MAX_AMPLITUDE = 0.06;
const EXPLODING_PARTICLE_SPEED = 130;
const EXPLODING_PARTICLE_COUNT = 30;
const EXPLODING_DRIFT_Y_SPEED = 0.35;
const EXPLODING_DRIFT_Y_AMPLITUDE = 7;

// Solar panel shader: realistic photovoltaic cell pattern with iridescent reflections
const SOLAR_PANEL_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const SOLAR_PANEL_FRAG = `
  uniform vec3 cellColor;
  uniform vec3 gridColor;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    // Photovoltaic cell grid pattern
    float cellsX = 8.0;
    float cellsY = 4.0;
    vec2 cell = fract(vUv * vec2(cellsX, cellsY));
    float gridWidth = 0.04;
    float grid = step(gridWidth, cell.x) * step(gridWidth, cell.y) *
                 step(cell.x, 1.0 - gridWidth) * step(cell.y, 1.0 - gridWidth);

    // Subtle iridescent sheen based on view angle (thin-film interference)
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    float iridescence = fresnel * fresnel;
    vec3 iriColor = mix(
      vec3(0.05, 0.08, 0.35),
      vec3(0.15, 0.05, 0.4),
      sin(fresnel * 6.28 + time * 0.2) * 0.5 + 0.5
    );

    // Each cell has a slightly different shade (procedural variation)
    float cellIdx = floor(vUv.x * cellsX) + floor(vUv.y * cellsY) * cellsX;
    float cellVar = fract(sin(cellIdx * 43.5453) * 23421.631) * 0.12 - 0.06;

    vec3 baseCell = cellColor + cellVar;
    vec3 finalColor = mix(gridColor, baseCell + iriColor * iridescence * 0.5, grid);

    // Subtle specular highlight
    float spec = pow(max(dot(reflect(-vViewDir, vNormal), vec3(0.5, 0.8, 0.3)), 0.0), 32.0);
    finalColor += vec3(spec * 0.3);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Monolith hieroglyph shader: alien glowing symbols carved into the surface
const MONOLITH_GLYPH_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const MONOLITH_GLYPH_FRAG = `
  uniform vec3 glowColor;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float glyphPattern(vec2 uv) {
    // Create a grid of alien symbols
    vec2 grid = floor(uv * vec2(5.0, 12.0));
    vec2 local = fract(uv * vec2(5.0, 12.0));
    float seed = hash(grid);

    // Symbol shape: combination of lines and dots
    float symbol = 0.0;
    // Vertical bar
    symbol += step(0.42, local.x) * step(local.x, 0.58) * step(0.15, local.y) * step(local.y, 0.85) * step(seed, 0.7);
    // Horizontal bar
    symbol += step(0.15, local.x) * step(local.x, 0.85) * step(0.42, local.y) * step(local.y, 0.58) * step(0.3, seed);
    // Central dot
    float dotDist = length(local - 0.5);
    symbol += smoothstep(0.18, 0.12, dotDist) * step(0.5, seed);
    // Corner arcs
    symbol += smoothstep(0.32, 0.26, length(local - vec2(0.15, 0.15))) * step(seed, 0.4);
    symbol += smoothstep(0.32, 0.26, length(local - vec2(0.85, 0.85))) * step(0.6, seed);

    return clamp(symbol, 0.0, 1.0);
  }

  void main() {
    // Deep obsidian base
    vec3 baseColor = vec3(0.008, 0.008, 0.015);

    // Alien glyph pattern
    float glyph = glyphPattern(vUv);

    // Traveling activation wave (symbols light up in sequence)
    float wave = sin(vUv.y * 12.0 - time * 1.2) * 0.5 + 0.5;
    float activation = wave * glyph;

    // Pulsing intensity
    float pulse = 0.6 + sin(time * 1.8) * 0.4;

    // Fresnel rim for alien energy field
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    float rim = pow(fresnel, 3.0) * 0.6;

    // Combine: dark base + glowing symbols + rim energy
    vec3 glyphEmission = glowColor * activation * pulse * 1.5;
    vec3 rimEmission = glowColor * rim * 0.8;

    vec3 finalColor = baseColor + glyphEmission + rimEmission;
    float alpha = 1.0;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ---------------------------------------------------------------------------
// EASTER EGG: ABANDONED SATELLITE (VANGUARD-IX)
// ---------------------------------------------------------------------------

interface AbandonedSatelliteProps {
  mapTheme: MapTheme;
}

export const AbandonedSatellite = ({ mapTheme }: AbandonedSatelliteProps) => {
  const groupRef = useRef<Group>(null);
  const beaconRef = useRef<Mesh>(null);
  const beaconRef2 = useRef<Mesh>(null);
  const pingRef = useRef<Mesh>(null);
  const solarPanelLeftRef = useRef<Mesh>(null);
  const solarPanelRightRef = useRef<Mesh>(null);
  const pingScaleRef = useRef(0);
  const { camera } = useThree();

  // Solar panel shader uniforms
  const solarUniforms = useMemo(() => ({
    cellColor: { value: new Color("#0a1a4d") },
    gridColor: { value: new Color("#1a1a2a") },
    time: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Update shader time
    solarUniforms.time.value = time;

    // 1. Slow tumbling (derelict drift)
    if (groupRef.current) {
      groupRef.current.rotation.y += SATELLITE_TUMBLE_Y * delta;
      groupRef.current.rotation.x += SATELLITE_TUMBLE_X * delta;
      groupRef.current.position.y = SATELLITE_POSITION[1] + Math.sin(time * SATELLITE_DRIFT_SPEED) * SATELLITE_DRIFT_AMPLITUDE;
    }

    // 2. Blinking navigation beacons (red/green port/starboard)
    if (beaconRef.current) {
      const blink = Math.sin(time * BEACON_BLINK_FREQUENCY) > 0;
      const material = beaconRef.current.material as MeshStandardMaterial;
      if (blink) {
        material.emissive.set("#ef4444");
        material.emissiveIntensity = 3.0;
      } else {
        material.emissive.set("#000000");
        material.emissiveIntensity = 0;
      }
    }

    if (beaconRef2.current) {
      const blink2 = Math.sin(time * BEACON_BLINK_FREQUENCY + Math.PI) > 0;
      const material2 = beaconRef2.current.material as MeshStandardMaterial;
      if (blink2) {
        material2.emissive.set("#22c55e");
        material2.emissiveIntensity = 3.0;
      } else {
        material2.emissive.set("#000000");
        material2.emissiveIntensity = 0;
      }
    }

    // 3. Expanding signal radar pings
    if (pingRef.current) {
      pingScaleRef.current += PING_EXPAND_SPEED * delta;
      if (pingScaleRef.current > PING_MAX_SCALE) {
        pingScaleRef.current = 0;
        const satellitePos = groupRef.current ? groupRef.current.position : new Vector3(...SATELLITE_POSITION);
        const dist = camera.position.distanceTo(satellitePos);
        playSatellitePing(dist);
      }
      pingRef.current.scale.setScalar(pingScaleRef.current);
      const material = pingRef.current.material as MeshBasicMaterial;
      material.opacity = Math.max(0, 1 - (pingScaleRef.current / PING_OPACITY_DIVISOR)) * PING_MAX_OPACITY;
    }
  });

  const accentColor = useMemo(() => {
    return mapTheme === "CYBER" ? "#00ffff" : mapTheme === "LAVA" ? "#ffaa00" : "#ffffff";
  }, [mapTheme]);

  return (
    <group position={SATELLITE_POSITION} ref={groupRef}>
      {/* ════════════════════ MAIN BUS (Central Body) ════════════════════ */}
      {/* Primary hull: octagonal cylinder with gold thermal blanket appearance */}
      <mesh>
        <cylinderGeometry args={[5, 5, 18, 8]} />
        <meshStandardMaterial
          color="#b8960f"
          roughness={0.35}
          metalness={0.85}
          emissive="#3d2f00"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Dark thermal shield bands wrapping the body */}
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[5.15, 5.15, 2.5, 8]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>
      <mesh position={[0, -6, 0]}>
        <cylinderGeometry args={[5.15, 5.15, 2.5, 8]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>

      {/* Top cap (antenna mounting plate) */}
      <mesh position={[0, 9.2, 0]}>
        <cylinderGeometry args={[5.3, 5.0, 0.6, 8]} />
        <meshStandardMaterial
          color="#808080"
          roughness={0.5}
          metalness={0.9}
        />
      </mesh>

      {/* Bottom cap (thruster plate) */}
      <mesh position={[0, -9.2, 0]}>
        <cylinderGeometry args={[5.0, 4.5, 0.8, 8]} />
        <meshStandardMaterial
          color="#505050"
          roughness={0.6}
          metalness={0.85}
        />
      </mesh>

      {/* ════════════════════ SOLAR PANEL ARRAYS ════════════════════ */}
      {/* Structural arm - Left */}
      <mesh position={[-8, 0, 0]}>
        <boxGeometry args={[3, 0.4, 0.4]} />
        <meshStandardMaterial
          color="#606060"
          roughness={0.5}
          metalness={0.9}
        />
      </mesh>

      {/* Solar Panel - Left (with photovoltaic cell shader) */}
      <mesh position={[-17, 0, 0]} ref={solarPanelLeftRef}>
        <boxGeometry args={[15, 8, 0.3]} />
        <shaderMaterial
          uniforms={solarUniforms}
          vertexShader={SOLAR_PANEL_VERT}
          fragmentShader={SOLAR_PANEL_FRAG}
        />
      </mesh>

      {/* Solar panel frame - Left */}
      <mesh position={[-17, 0, 0]}>
        <boxGeometry args={[15.4, 8.4, 0.15]} />
        <meshStandardMaterial
          color="#c0c0c0"
          roughness={0.3}
          metalness={0.95}
          wireframe
        />
      </mesh>

      {/* Structural arm - Right */}
      <mesh position={[8, 0, 0]}>
        <boxGeometry args={[3, 0.4, 0.4]} />
        <meshStandardMaterial
          color="#606060"
          roughness={0.5}
          metalness={0.9}
        />
      </mesh>

      {/* Solar Panel - Right (with photovoltaic cell shader) */}
      <mesh position={[17, 0, 0]} ref={solarPanelRightRef}>
        <boxGeometry args={[15, 8, 0.3]} />
        <shaderMaterial
          uniforms={solarUniforms}
          vertexShader={SOLAR_PANEL_VERT}
          fragmentShader={SOLAR_PANEL_FRAG}
        />
      </mesh>

      {/* Solar panel frame - Right */}
      <mesh position={[17, 0, 0]}>
        <boxGeometry args={[15.4, 8.4, 0.15]} />
        <meshStandardMaterial
          color="#c0c0c0"
          roughness={0.3}
          metalness={0.95}
          wireframe
        />
      </mesh>

      {/* ════════════════════ PARABOLIC DISH ANTENNA ════════════════════ */}
      {/* Dish reflector (concave parabolic surface) */}
      <mesh position={[0, 12, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[5.5, 3.0, 16, 1, true]} />
        <meshStandardMaterial
          color="#e8e8e8"
          roughness={0.15}
          metalness={0.95}
          side={DoubleSide}
        />
      </mesh>

      {/* Dish rim (structural ring) */}
      <mesh position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.5, 0.2, 8, 32]} />
        <meshStandardMaterial
          color="#909090"
          roughness={0.4}
          metalness={0.9}
        />
      </mesh>

      {/* Feed horn support struts (3 struts holding center feed) */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        const strutLen = 4.5;
        const midX = Math.cos(angle) * strutLen * 0.5;
        const midZ = Math.sin(angle) * strutLen * 0.5;
        const rotZ = -Math.atan2(3.5, strutLen);
        return (
          <mesh
            key={`strut-${i}`}
            position={[midX, 14.5, midZ]}
            rotation={[0, -angle, rotZ]}
          >
            <cylinderGeometry args={[0.12, 0.12, 5.5, 4]} />
            <meshStandardMaterial
              color="#707070"
              roughness={0.5}
              metalness={0.9}
            />
          </mesh>
        );
      })}

      {/* Feed horn (center of dish) */}
      <mesh position={[0, 15.5, 0]}>
        <cylinderGeometry args={[0.6, 0.3, 1.8, 8]} />
        <meshStandardMaterial
          color="#808080"
          roughness={0.3}
          metalness={0.95}
        />
      </mesh>

      {/* ════════════════════ NAVIGATION BEACONS ════════════════════ */}
      {/* Port beacon (red, blinking) */}
      <mesh position={[-24.5, 0, 0]} ref={beaconRef}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshStandardMaterial
          color="#200000"
          emissive="#ef4444"
          emissiveIntensity={3.0}
          roughness={0.2}
          metalness={0.0}
        />
      </mesh>

      {/* Starboard beacon (green, blinking) */}
      <mesh position={[24.5, 0, 0]} ref={beaconRef2}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshStandardMaterial
          color="#001000"
          emissive="#22c55e"
          emissiveIntensity={3.0}
          roughness={0.2}
          metalness={0.0}
        />
      </mesh>

      {/* ════════════════════ RCS THRUSTER QUADS ════════════════════ */}
      {/* Small reaction control system thrusters on the body */}
      {[45, 135, 225, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const thrusterRadius = 5.3;
        return (
          <mesh
            key={`rcs-${deg}`}
            position={[
              Math.cos(rad) * thrusterRadius,
              7,
              Math.sin(rad) * thrusterRadius
            ]}
            rotation={[0, -rad, 0]}
          >
            <cylinderGeometry args={[0.5, 0.7, 1.2, 6]} />
            <meshStandardMaterial
              color="#404040"
              roughness={0.6}
              metalness={0.85}
            />
          </mesh>
        );
      })}

      {/* ════════════════════ ANTENNA MAST (bottom) ════════════════════ */}
      <mesh position={[0, -11.5, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 4, 4]} />
        <meshStandardMaterial
          color="#606060"
          roughness={0.5}
          metalness={0.9}
        />
      </mesh>

      {/* Omni antenna tip */}
      <mesh position={[0, -14, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial
          color="#c0c0c0"
          roughness={0.3}
          metalness={0.95}
        />
      </mesh>

      {/* ════════════════════ SIGNAL PING ════════════════════ */}
      <mesh position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} ref={pingRef}>
        <ringGeometry args={[0.9, 1.0, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0}
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// EASTER EGG: COSMIC MONOLITH (UNKNOWN ORIGIN)
// ---------------------------------------------------------------------------

interface CosmicMonolithProps {
  mapTheme: MapTheme;
}

export const CosmicMonolith = ({ mapTheme }: CosmicMonolithProps) => {
  const groupRef = useRef<Group>(null);
  const glyphMaterialRef = useRef<ShaderMaterial>(null);
  const forceFieldRef = useRef<Mesh>(null);

  const glowColor = useMemo(() => {
    return mapTheme === "CYBER" ? new Color("#ff00ff") : mapTheme === "LAVA" ? new Color("#ff2200") : new Color("#aaddff");
  }, [mapTheme]);

  // Monolith glyph shader uniforms
  const glyphUniforms = useMemo(() => ({
    glowColor: { value: glowColor },
    time: { value: 0 },
  }), [glowColor]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Slow cosmic drift and Y-axis rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += MONOLITH_ROTATION_SPEED * delta;
      groupRef.current.position.y = MONOLITH_POSITION[1] + Math.sin(time * MONOLITH_DRIFT_SPEED) * MONOLITH_DRIFT_AMPLITUDE;
    }

    // 2. Update shader time
    glyphUniforms.time.value = time;

    // 3. Force field pulsation
    if (forceFieldRef.current) {
      const material = forceFieldRef.current.material as MeshBasicMaterial;
      material.opacity = MONOLITH_GLOW_BASE + Math.abs(Math.sin(time * MONOLITH_GLOW_SPEED)) * MONOLITH_GLOW_RANGE;
      const pulse = 1.0 + Math.sin(time * 1.2) * 0.03;
      forceFieldRef.current.scale.setScalar(pulse);
    }
  });

  const glowColorHex = useMemo(() => {
    return mapTheme === "CYBER" ? "#ff00ff" : mapTheme === "LAVA" ? "#ff2200" : "#aaddff";
  }, [mapTheme]);

  return (
    <group position={MONOLITH_POSITION} ref={groupRef}>
      {/* Obsidian monolith core with alien hieroglyphs */}
      <mesh>
        <boxGeometry args={[9, 23, 2.5]} />
        <shaderMaterial
          ref={glyphMaterialRef}
          uniforms={glyphUniforms}
          vertexShader={MONOLITH_GLYPH_VERT}
          fragmentShader={MONOLITH_GLYPH_FRAG}
        />
      </mesh>

      {/* Ultra-thin reflective obsidian surface shell */}
      <mesh scale={1.005}>
        <boxGeometry args={[9, 23, 2.5]} />
        <meshStandardMaterial
          color="#020204"
          roughness={0.05}
          metalness={1.0}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Holographic force-field membrane */}
      <mesh scale={MONOLITH_SCALE_OUTLINE} ref={forceFieldRef}>
        <boxGeometry args={[9, 23, 2.5]} />
        <meshBasicMaterial
          color={glowColorHex}
          wireframe
          transparent
          opacity={0.5}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Corner energy emitters */}
      {[
        [-4.8, 11.8, 1.5], [4.8, 11.8, 1.5], [-4.8, -11.8, 1.5], [4.8, -11.8, 1.5],
        [-4.8, 11.8, -1.5], [4.8, 11.8, -1.5], [-4.8, -11.8, -1.5], [4.8, -11.8, -1.5]
      ].map((pos, i) => (
        <mesh key={`emitter-${i}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.4, 6, 6]} />
          <meshStandardMaterial
            color="#000000"
            emissive={glowColorHex}
            emissiveIntensity={2.5}
            roughness={0.1}
            metalness={0.0}
          />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------
// DYNAMIC EVENT: EXPLODING ASTEROID (DETONATING EVENTS)
// ---------------------------------------------------------------------------

interface ExplodingAsteroidProps {
  startPos: [number, number, number];
  size: number;
  mapTheme: MapTheme;
}

export const ExplodingAsteroid = ({ startPos, size, mapTheme }: ExplodingAsteroidProps) => {
  const groupRef = useRef<Group>(null);
  const rockRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const particlesRef = useRef<Points>(null);
  const { camera } = useThree();

  const stateRef = useRef({
    phase: "drift", // drift -> charge -> burst -> cooldown
    timer: Math.random() * 20, // random stagger start offset
    scale: size,
    glow: 0,
    particleProgress: 0,
  });

  // Precomputed direction vectors for debris
  const particleDirs = useMemo(() => {
    const dirs = [];
    for (let i = 0; i < EXPLODING_PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      dirs.push([
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      ]);
    }
    return dirs;
  }, []);

  const particlePos = useMemo(() => new Float32Array(EXPLODING_PARTICLE_COUNT * 3), []);

  useFrame((state, delta) => {
    const data = stateRef.current;
    data.timer += delta;

    // 1. Slow background drift and rotation
    if (groupRef.current && data.phase !== "burst") {
      groupRef.current.rotation.y += 0.06 * delta;
      groupRef.current.rotation.x += 0.03 * delta;
      groupRef.current.position.y =
        startPos[1] + Math.sin(state.clock.getElapsedTime() * EXPLODING_DRIFT_Y_SPEED + startPos[0]) * EXPLODING_DRIFT_Y_AMPLITUDE;
    }

    if (data.phase === "drift") {
      if (data.timer > EXPLODING_DRIFT_DURATION_BASE + Math.sin(startPos[2]) * EXPLODING_DRIFT_OFFSET_FACTOR) {
        data.phase = "charge";
        data.timer = 0;
      }
      if (rockRef.current) rockRef.current.scale.setScalar(size);
      if (glowRef.current) glowRef.current.scale.setScalar(0);
    } 
    else if (data.phase === "charge") {
      const progress = Math.min(1.0, data.timer / EXPLODING_CHARGE_DURATION);
      data.glow = progress * 1.5;

      const shake = 1.0 + Math.sin(data.timer * EXPLODING_SHAKE_FREQUENCY) * EXPLODING_SHAKE_MAX_AMPLITUDE * progress;
      if (rockRef.current) rockRef.current.scale.setScalar(size * shake);
      
      if (glowRef.current) {
        glowRef.current.scale.setScalar(size * 1.15 * shake);
        const material = glowRef.current.material as MeshBasicMaterial;
        material.opacity = progress * 0.85;
      }

      if (data.timer > EXPLODING_CHARGE_DURATION) {
        data.phase = "burst";
        data.timer = 0;
        
        const asteroidPos = groupRef.current ? groupRef.current.position : new Vector3(...startPos);
        const dist = camera.position.distanceTo(asteroidPos);
        playExplosionSound(dist);

        for (let i = 0; i < EXPLODING_PARTICLE_COUNT; i++) {
          particlePos[i * 3] = 0;
          particlePos[i * 3 + 1] = 0;
          particlePos[i * 3 + 2] = 0;
        }
        if (particlesRef.current) {
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }
    } 
    else if (data.phase === "burst") {
      const progress = Math.min(1.0, data.timer / EXPLODING_BURST_DURATION);

      if (rockRef.current) rockRef.current.scale.setScalar(size * Math.max(0, 1 - progress * 4.0));
      
      if (glowRef.current) {
        glowRef.current.scale.setScalar(size * 2.8 * progress);
        const material = glowRef.current.material as MeshBasicMaterial;
        material.opacity = Math.max(0, 1 - progress) * 0.95;
      }

      const speed = EXPLODING_PARTICLE_SPEED * delta;
      for (let i = 0; i < EXPLODING_PARTICLE_COUNT; i++) {
        particlePos[i * 3] += particleDirs[i][0] * speed;
        particlePos[i * 3 + 1] += particleDirs[i][1] * speed;
        particlePos[i * 3 + 2] += particleDirs[i][2] * speed;
      }
      if (particlesRef.current) {
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        const material = particlesRef.current.material as PointsMaterial;
        material.opacity = Math.max(0, 1 - progress) * 0.95;
      }

      if (data.timer > EXPLODING_BURST_DURATION) {
        data.phase = "cooldown";
        data.timer = 0;
      }
    } 
    else if (data.phase === "cooldown") {
      if (glowRef.current) glowRef.current.scale.setScalar(0);
      if (particlesRef.current) {
        const material = particlesRef.current.material as PointsMaterial;
        material.opacity = 0;
      }

      if (data.timer > EXPLODING_COOLDOWN_DURATION) {
        data.phase = "drift";
        data.timer = 0;
      }
    }
  });

  const rockColor = "#221810";
  const glowColor = useMemo(() => {
    return mapTheme === "CYBER" ? "#00ffff" : mapTheme === "LAVA" ? "#ff3300" : "#bae6fd";
  }, [mapTheme]);

  return (
    <group position={startPos} ref={groupRef}>
      {/* Solid Asteroid Body */}
      <mesh ref={rockRef}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={rockColor} roughness={0.9} flatShading />
      </mesh>

      {/* Energy core charging sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Glowing fragment particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePos, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={7.5}
          color={glowColor}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

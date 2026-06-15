import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Group,
  Mesh,
  Points,
  Vector3,
  MeshBasicMaterial,
  PointsMaterial,
  AdditiveBlending,
  DoubleSide
} from "three";
import { MapTheme } from "../../../types";
import { playExplosionSound, playSatellitePing } from "./audio";

// ---------------------------------------------------------------------------
// EASTER EGG: ABANDONED SATELLITE (VANGUARD-IX)
// ---------------------------------------------------------------------------

interface AbandonedSatelliteProps {
  mapTheme: MapTheme;
}

export const AbandonedSatellite = ({ mapTheme }: AbandonedSatelliteProps) => {
  const groupRef = useRef<Group>(null);
  const beaconRef = useRef<Mesh>(null);
  const pingRef = useRef<Mesh>(null);
  const pingScaleRef = useRef(0);
  const { camera } = useThree();

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Slow tumbling
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.08 * delta;
      groupRef.current.rotation.x += 0.04 * delta;
      // Soft floating drift
      groupRef.current.position.y = 120 + Math.sin(time * 0.4) * 6;
    }

    // 2. Blinking beacon (swapping red and green colors directly on the material)
    if (beaconRef.current) {
      const blink = Math.sin(time * 5.0) > 0;
      const material = beaconRef.current.material as MeshBasicMaterial;
      if (blink) {
        material.color.set("#ef4444"); // bright red
      } else {
        material.color.set("#22c55e"); // bright green
      }
    }

    // 3. Expanding signal radar pings
    if (pingRef.current) {
      pingScaleRef.current += 25 * delta;
      if (pingScaleRef.current > 110) {
        pingScaleRef.current = 0;
        // Trigger soft satellite telemetry beep
        const satellitePos = groupRef.current ? groupRef.current.position : new Vector3(-420, 120, 360);
        const dist = camera.position.distanceTo(satellitePos);
        playSatellitePing(dist);
      }
      pingRef.current.scale.setScalar(pingScaleRef.current);
      const material = pingRef.current.material as MeshBasicMaterial;
      material.opacity = Math.max(0, 1 - (pingScaleRef.current / 110)) * 0.22;
    }
  });

  const wireColor = useMemo(() => {
    return mapTheme === "CYBER" ? "#00ffff" : mapTheme === "LAVA" ? "#ffaa00" : "#ffffff";
  }, [mapTheme]);

  return (
    <group position={[-420, 120, 360]} ref={groupRef}>
      {/* Central Cylinder Body */}
      <mesh>
        <cylinderGeometry args={[5, 5, 18, 8]} />
        <meshBasicMaterial color="#0b0b1a" wireframe />
      </mesh>
      
      {/* Solar Panel array wing - Left */}
      <mesh position={[-16, 0, 0]}>
        <boxGeometry args={[14, 7, 0.8]} />
        <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.25} />
      </mesh>

      {/* Solar Panel array wing - Right */}
      <mesh position={[16, 0, 0]}>
        <boxGeometry args={[14, 7, 0.8]} />
        <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.25} />
      </mesh>

      {/* Dish Antenna on top */}
      <mesh position={[0, 11, 0]}>
        <coneGeometry args={[4.5, 3.5, 8, 1, true]} />
        <meshBasicMaterial color={wireColor} wireframe />
      </mesh>

      {/* Blinking Beacon light tip */}
      <mesh position={[0, 13.5, 0]} ref={beaconRef}>
        <sphereGeometry args={[1.0, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Expanding signal ring */}
      <mesh position={[0, 11, 0]} rotation={[Math.PI / 2, 0, 0]} ref={pingRef}>
        <ringGeometry args={[0.9, 1.0, 32]} />
        <meshBasicMaterial
          color={wireColor}
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
  const glowMaterialRef = useRef<MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Slow cosmic drift and Y-axis rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.06 * delta;
      groupRef.current.position.y = -90 + Math.sin(time * 0.3) * 5;
    }

    // 2. Slow breathing glow effect on wireframe outline
    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity = 0.2 + Math.abs(Math.sin(time * 0.7)) * 0.5;
    }
  });

  const glowColor = useMemo(() => {
    return mapTheme === "CYBER" ? "#ff00ff" : mapTheme === "LAVA" ? "#ff2200" : "#aaddff";
  }, [mapTheme]);

  return (
    <group position={[430, -90, -380]} ref={groupRef}>
      {/* Pure black monolith block */}
      <mesh>
        <boxGeometry args={[9, 23, 2.5]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Holographic glowing neon outline */}
      <mesh scale={1.035}>
        <boxGeometry args={[9, 23, 2.5]} />
        <meshBasicMaterial
          ref={glowMaterialRef}
          color={glowColor}
          wireframe
          transparent
          opacity={0.5}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
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

  const particleCount = 30;

  // Precomputed direction vectors for debris
  const particleDirs = useMemo(() => {
    const dirs = [];
    for (let i = 0; i < particleCount; i++) {
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

  const particlePos = useMemo(() => new Float32Array(particleCount * 3), []);

  useFrame((state, delta) => {
    const data = stateRef.current;
    data.timer += delta;

    // 1. Slow background drift and rotation
    if (groupRef.current && data.phase !== "burst") {
      groupRef.current.rotation.y += 0.06 * delta;
      groupRef.current.rotation.x += 0.03 * delta;
      groupRef.current.position.y =
        startPos[1] + Math.sin(state.clock.getElapsedTime() * 0.35 + startPos[0]) * 7;
    }

    if (data.phase === "drift") {
      // Drift for 25 to 45 seconds before charging
      if (data.timer > 30.0 + Math.sin(startPos[2]) * 8) {
        data.phase = "charge";
        data.timer = 0;
      }
      if (rockRef.current) rockRef.current.scale.setScalar(size);
      if (glowRef.current) glowRef.current.scale.setScalar(0);
    } 
    else if (data.phase === "charge") {
      // Charge / Build up for 3.5 seconds
      const progress = Math.min(1.0, data.timer / 3.5);
      data.glow = progress * 1.5;

      // Unstable shaking/vibration effect as it charges up
      const shake = 1.0 + Math.sin(data.timer * 45.0) * 0.06 * progress;
      if (rockRef.current) rockRef.current.scale.setScalar(size * shake);
      
      if (glowRef.current) {
        glowRef.current.scale.setScalar(size * 1.15 * shake);
        const material = glowRef.current.material as MeshBasicMaterial;
        material.opacity = progress * 0.85;
      }

      if (data.timer > 3.5) {
        data.phase = "burst";
        data.timer = 0;
        
        // Trigger simulated speed-of-sound explosion audio
        const asteroidPos = groupRef.current ? groupRef.current.position : new Vector3(...startPos);
        const dist = camera.position.distanceTo(asteroidPos);
        playExplosionSound(dist);

        // Reset debris particles to center point
        for (let i = 0; i < particleCount; i++) {
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
      // Exploding burst animation lasts 1.6 seconds
      const progress = Math.min(1.0, data.timer / 1.6);

      // Shrink core rock instantly to 0
      if (rockRef.current) rockRef.current.scale.setScalar(size * Math.max(0, 1 - progress * 4.0));
      
      // Blast wave shell expands and fades out
      if (glowRef.current) {
        glowRef.current.scale.setScalar(size * 2.8 * progress);
        const material = glowRef.current.material as MeshBasicMaterial;
        material.opacity = Math.max(0, 1 - progress) * 0.95;
      }

      // Fly out particles along random dirs
      const speed = 130 * delta;
      for (let i = 0; i < particleCount; i++) {
        particlePos[i * 3] += particleDirs[i][0] * speed;
        particlePos[i * 3 + 1] += particleDirs[i][1] * speed;
        particlePos[i * 3 + 2] += particleDirs[i][2] * speed;
      }
      if (particlesRef.current) {
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        const material = particlesRef.current.material as PointsMaterial;
        material.opacity = Math.max(0, 1 - progress) * 0.95;
      }

      if (data.timer > 1.6) {
        data.phase = "cooldown";
        data.timer = 0;
      }
    } 
    else if (data.phase === "cooldown") {
      // Cooldown for 15 seconds before asteroid reforms
      if (glowRef.current) glowRef.current.scale.setScalar(0);
      if (particlesRef.current) {
        const material = particlesRef.current.material as PointsMaterial;
        material.opacity = 0;
      }

      if (data.timer > 15.0) {
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

"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Group, Mesh, AdditiveBlending, DoubleSide, Vector3, MeshBasicMaterial, PointsMaterial } from "three";
import { Billboard, Stars } from "@react-three/drei";
import { MapTheme } from "../../types";
import { getGlobalAudioContext } from "../../../../context/SoundContext";

// ---------------------------------------------------------------------------
// AUDIO WEB AUDIO API PROCEDURAL GENERATORS (ASTEROID & SATELLITE PING)
// ---------------------------------------------------------------------------

const playExplosionSound = (distance: number) => {
  const ctx = getGlobalAudioContext();
  if (!ctx || ctx.state !== "running") return;

  // Simulate speed of sound delay (distance / speed)
  const speedOfSound = 220; // Units per second
  const delay = distance / speedOfSound;
  const playTime = ctx.currentTime + delay;

  // 1. Deep Sub-bass Impact Thump (low frequency sine sweep)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, playTime);
  osc.frequency.exponentialRampToValueAtTime(10, playTime + 0.8);

  // 2. Volumetric noise explosion rumble/crackle
  const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    channelData[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(250, playTime);
  filter.frequency.exponentialRampToValueAtTime(30, playTime + 1.2);
  filter.Q.setValueAtTime(2.0, playTime);

  // Gain Node with distance attenuation
  const gainNode = ctx.createGain();
  const maxAudibleDist = 950;
  let vol = 1.0 - Math.min(distance / maxAudibleDist, 1.0);
  vol = Math.pow(vol, 1.5) * 0.95; // realistic sound attenuation curve

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.setValueAtTime(vol, playTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + 1.4);

  // Connections
  osc.connect(gainNode);
  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(playTime);
  osc.stop(playTime + 1.5);
  noise.start(playTime);
  noise.stop(playTime + 1.5);
};

const playSatellitePing = (distance: number) => {
  const ctx = getGlobalAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  
  // 1. Deep, warm frequency (instead of high-pitch meow)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(240, now); // Warm, deep sonar-like frequency (240Hz)

  // 2. Soft sub-harmonics for warmth
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(120, now); // Sub-bass octave (120Hz)

  // Biquad lowpass filter to muffle high-frequency transients and make it deep
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(350, now); // Cut off any buzz

  // Gain node with distance attenuation
  const gainNode = ctx.createGain();
  const maxAudibleDist = 380; // Highly localized (silent at the arena which is ~566 units away)
  
  let vol = 1.0 - Math.min(distance / maxAudibleDist, 1.0);
  vol = Math.pow(vol, 2.5) * 0.14; // Soft volume curve

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(vol, now + 0.05); // slightly slower attack (50ms) for soft hum
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8); // Fades over 0.8s (longer, smoother decay)

  // Soft echo loop to give space vacuum depth
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.22; // 220ms echo

  const feedback = ctx.createGain();
  feedback.gain.value = 0.25; // quieter echo feedback loop

  gainNode.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  
  gainNode.connect(ctx.destination);
  delay.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.9);
  osc2.start(now);
  osc2.stop(now + 0.9);
};

interface SpaceBackgroundProps {
  mapTheme: MapTheme;
  graphicsQuality?: string;
}

interface DistantPlanetProps {
  position: [number, number, number];
  size: number;
  coreColor: string;
  wireColor: string;
  ringColor?: string;
  rotationSpeed?: number;
}

const DistantPlanet = ({
  position,
  size,
  coreColor,
  wireColor,
  ringColor,
  rotationSpeed = 0.05,
}: DistantPlanetProps) => {
  const planetRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed * delta;
      planetRef.current.rotation.x += rotationSpeed * 0.3 * delta;
    }
    if (coreRef.current) {
      // Cosmic "breathing" effect for the core (unique phase offset based on X position)
      const time = state.clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(time * 0.6 + position[0]) * 0.06;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position} ref={planetRef}>
      {/* Outer Geodesic Sphere */}
      <mesh>
        <icosahedronGeometry args={[size, 2]} />
        <meshBasicMaterial
          color={wireColor}
          wireframe
          transparent
          opacity={0.12}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Inner Glowing Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[size * 0.7, 16, 16]} />
        <meshBasicMaterial
          color={coreColor}
          transparent
          opacity={0.35}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Optional Planetary Ring */}
      {ringColor && (
        <mesh rotation={[Math.PI / 3, Math.PI / 8, 0]}>
          <ringGeometry args={[size * 1.2, size * 1.5, 64]} />
          <meshBasicMaterial
            color={ringColor}
            side={DoubleSide}
            transparent
            opacity={0.2}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------
// GALAXY CENTRAL BLACK HOLE SHADER & COMPONENT
// ---------------------------------------------------------------------------

const DISK_VERT = `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISK_FRAG = `
  uniform vec3 colorIn;
  uniform vec3 colorOut;
  uniform float minR;
  uniform float maxR;
  uniform float mult;
  varying vec2 vPos;
  void main() {
    float dist = length(vPos);
    float t = clamp((dist - minR) / (maxR - minR), 0.0, 1.0);
    float alpha = pow(1.0 - t, 2.0) * mult;
    vec3 color = mix(colorIn, colorOut, t);
    gl_FragColor = vec4(color, alpha);
  }
`;

interface GlowingDiskProps {
  minRadius: number;
  maxRadius: number;
  opacityMultiplier?: number;
  rot?: [number, number, number];
  colorIn: Color;
  colorOut: Color;
}

const GlowingDisk = ({
  minRadius,
  maxRadius,
  opacityMultiplier = 1,
  rot = [0, 0, 0],
  colorIn,
  colorOut,
}: GlowingDiskProps) => {
  const uniforms = useMemo(
    () => ({
      colorIn: { value: colorIn },
      colorOut: { value: colorOut },
      minR: { value: minRadius },
      maxR: { value: maxRadius },
      mult: { value: opacityMultiplier },
    }),
    [minRadius, maxRadius, opacityMultiplier, colorIn, colorOut]
  );

  return (
    <mesh rotation={rot}>
      <ringGeometry args={[minRadius, maxRadius, 64]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        uniforms={uniforms}
        vertexShader={DISK_VERT}
        fragmentShader={DISK_FRAG}
      />
    </mesh>
  );
};

interface GalaxyBlackHoleProps {
  mapTheme: MapTheme;
}

const GalaxyBlackHole = ({ mapTheme }: GalaxyBlackHoleProps) => {
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

// ---------------------------------------------------------------------------
// COSMIC NEUTRON STAR (PULSAR) VOLUMETRIC LIGHTHOUSE SHADERS
// ---------------------------------------------------------------------------

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

const SpacePulsar = ({ position, color, beamColor }: SpacePulsarProps) => {
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

// ---------------------------------------------------------------------------
// EASTER EGG: ABANDONED SATELLITE (VANGUARD-IX)
// ---------------------------------------------------------------------------

interface AbandonedSatelliteProps {
  mapTheme: MapTheme;
}

const AbandonedSatellite = ({ mapTheme }: AbandonedSatelliteProps) => {
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
      <mesh position={[0, 11, 0]} rotation={[0, 0, 0]}>
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

const CosmicMonolith = ({ mapTheme }: CosmicMonolithProps) => {
  const groupRef = useRef<Group>(null);
  const glowMaterialRef = useRef<any>(null);

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

const ExplodingAsteroid = ({ startPos, size, mapTheme }: ExplodingAsteroidProps) => {
  const groupRef = useRef<Group>(null);
  const rockRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const particlesRef = useRef<any>(null);
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

// ---------------------------------------------------------------------------
// MAIN SPACE BACKGROUND COMPONENT
// ---------------------------------------------------------------------------

export const SpaceBackground = ({ mapTheme, graphicsQuality = "medium" }: SpaceBackgroundProps) => {
  const backgroundRef = useRef<Group>(null);
  const galaxyRef = useRef<Group>(null);
  const { camera } = useThree();

  // Keep the background centered on the camera at all times (Infinite Parallax effect)
  useFrame((_, delta) => {
    if (backgroundRef.current) {
      backgroundRef.current.position.copy(camera.position);
    }
    if (galaxyRef.current) {
      // Slowly rotate the galaxy for a living universe feel
      galaxyRef.current.rotation.y += 0.005 * delta;
    }
  });

  // Procedural Spiral Galaxy Generation
  const galaxyData = useMemo(() => {
    // Quality-based star density - increased for a lush, premium celestial cloud
    const count = graphicsQuality === "high" ? 6000 : graphicsQuality === "low" ? 1200 : 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Dynamic coloring based on active map theme
    let colorInStr = "#ff00ff"; // magenta
    let colorOutStr = "#00ffff"; // cyan

    if (mapTheme === "LAVA") {
      colorInStr = "#ff2200"; // hot red
      colorOutStr = "#ffaa00"; // bright orange
    } else if (mapTheme === "ICE") {
      colorInStr = "#ffffff"; // pure white
      colorOutStr = "#00aaff"; // deep ice blue
    }

    const colorInside = new Color(colorInStr);
    const colorOutside = new Color(colorOutStr);

    for (let i = 0; i < count; i++) {
      const randType = Math.random();

      if (randType < 0.30) {
        // 1. Central Bulge (Ellipsoid Core) - 30% of stars
        // Highly concentrated at the center, spherical/ellipsoid shape
        const r = Math.pow(Math.random(), 1.5) * 160;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        // Ellipsoid flattening (Y-axis is thin, X and Z are wider)
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi) * 0.45; // flattened core
        const z = r * Math.sin(phi) * Math.sin(theta);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Core is brighter, shifting towards white/yellow/cyan depending on theme
        const centerGlow = colorInside.clone().lerp(new Color("#ffffff"), 0.5 - (r / 160) * 0.4);
        
        // Subtle star temperature variation
        colors[i * 3] = Math.max(0, Math.min(1, centerGlow.r + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, centerGlow.g + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, centerGlow.b + (Math.random() - 0.5) * 0.05));

      } else if (randType < 0.85) {
        // 2. Spiral Arms - 55% of stars
        // Distribute radius from 80 to 920 units
        const r = 80 + Math.pow(Math.random(), 1.2) * 840;
        
        // 2 main spiral arms
        const armIndex = i % 2;
        const armAngle = (armIndex * 2 * Math.PI) / 2;
        
        // Spiral curve wrapping factor
        const spiralFactor = 0.0055;
        const spiralAngle = r * spiralFactor;

        // Arm thickness (angular spread) - wider near the core, tapering at outer edges
        // Using an average of 3 random numbers to approximate a Gaussian bell curve (central focus)
        const armSpread = ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 0.7;
        const angle = spiralAngle + armAngle + armSpread;

        // Add small radial offset for fluffiness and organic boundary blending
        const radialOffset = (Math.random() - 0.5) * 45;
        const finalR = Math.max(0, r + radialOffset);

        // Flatter disk at outer edges (Y thickness tapers exponentially)
        const yThickness = 28 * Math.exp(-finalR / 450);
        const y = (Math.random() - 0.5) * yThickness;

        positions[i * 3] = Math.cos(angle) * finalR;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * finalR;

        // Arm colors interpolate from inside to outside
        const mixedColor = colorInside.clone().lerp(colorOutside, finalR / 920);
        
        // Star color temperature variance
        colors[i * 3] = Math.max(0, Math.min(1, mixedColor.r + (Math.random() - 0.5) * 0.08));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, mixedColor.g + (Math.random() - 0.5) * 0.08));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, mixedColor.b + (Math.random() - 0.5) * 0.08));

      } else {
        // 3. Ambient Galactic Disk (Background Stars between arms) - 15% of stars
        // Uniformly distributed across the disk to make it look full and organic
        const r = Math.pow(Math.random(), 1.5) * 920;
        const angle = Math.random() * Math.PI * 2;
        
        // Vertical thickness also tapers exponentially
        const yThickness = 32 * Math.exp(-r / 350);
        const y = (Math.random() - 0.5) * yThickness;

        positions[i * 3] = Math.cos(angle) * r;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * r;

        // Ambient disk stars are slightly fainter and merge with outside color
        const mixedColor = colorInside.clone().lerp(colorOutside, r / 920).multiplyScalar(0.7);
        
        colors[i * 3] = Math.max(0, Math.min(1, mixedColor.r + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, mixedColor.g + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, mixedColor.b + (Math.random() - 0.5) * 0.05));
      }
    }

    return { positions, colors };
  }, [mapTheme, graphicsQuality]);

  // Distant celestial body configurations (adapted to themes)
  const planetsConfig = useMemo(() => {
    if (mapTheme === "LAVA") {
      return [
        {
          position: [-1000, 400, -1200] as [number, number, number],
          size: 130,
          coreColor: "#ff3300",
          wireColor: "#ffaa00",
          ringColor: "#ff5500",
          rotationSpeed: 0.04,
        },
        {
          position: [1200, -300, -800] as [number, number, number],
          size: 70,
          coreColor: "#880000",
          wireColor: "#ff0000",
          rotationSpeed: -0.06,
        },
        {
          position: [-800, -600, 1000] as [number, number, number],
          size: 90,
          coreColor: "#ff8800",
          wireColor: "#ffdd00",
          ringColor: "#ffcc00",
          rotationSpeed: 0.02,
        },
      ];
    }

    if (mapTheme === "ICE") {
      return [
        {
          position: [-1100, 500, -1000] as [number, number, number],
          size: 120,
          coreColor: "#00ccff",
          wireColor: "#ffffff",
          ringColor: "#aaddff",
          rotationSpeed: 0.03,
        },
        {
          position: [1300, -200, -900] as [number, number, number],
          size: 80,
          coreColor: "#001133",
          wireColor: "#00ffff",
          rotationSpeed: -0.05,
        },
        {
          position: [-900, -500, 1100] as [number, number, number],
          size: 60,
          coreColor: "#80e5ff",
          wireColor: "#ffffff",
          ringColor: "#bae6fd",
          rotationSpeed: 0.02,
        },
      ];
    }

    // Default / CYBER (Neo-Cyber) Theme
    return [
      {
        position: [-1200, 300, -1100] as [number, number, number],
        size: 140,
        coreColor: "#ff00ff", // Magenta glowing core
        wireColor: "#00ffff", // Cyan wireframe
        ringColor: "#ff00ff", // Magenta ring
        rotationSpeed: 0.05,
      },
      {
        position: [1400, -400, -900] as [number, number, number],
        size: 80,
        coreColor: "#002244", // Deep dark blue core
        wireColor: "#00ffcc", // Mint cyan wireframe
        rotationSpeed: -0.07,
      },
      {
        position: [-1000, -500, 1200] as [number, number, number],
        size: 75,
        coreColor: "#8a2be2", // Purple core
        wireColor: "#ff00ff", // Magenta wireframe
        ringColor: "#00ffff", // Cyan ring
        rotationSpeed: 0.03,
      },
    ];
  }, [mapTheme]);

  // Dynamic Theme-based Pulsar configs
  const pulsarConfig = useMemo(() => {
    let colorStr = "#ffffff";
    let beamColorStr = "#00ffff"; // cyan

    if (mapTheme === "LAVA") {
      beamColorStr = "#ff3300"; // red
    } else if (mapTheme === "ICE") {
      beamColorStr = "#80ccff"; // light ice blue
    }

    return {
      position: [-1400, -200, 1400] as [number, number, number],
      color: new Color(colorStr),
      beamColor: new Color(beamColorStr),
    };
  }, [mapTheme]);

  const starCount = useMemo(() => {
    return graphicsQuality === "high" ? 5000 : graphicsQuality === "low" ? 400 : 1500;
  }, [graphicsQuality]);

  // Position of galaxy: far away and tilted
  const galaxyTransform = useMemo(() => {
    return {
      position: [1600, -500, -1600] as [number, number, number],
      rotation: [0.6, 0.4, -0.5] as [number, number, number],
    };
  }, []);

  return (
    <>
      {/* ----------------- INFINITE PARALLAX SKYBOX LAYER ----------------- */}
      <group ref={backgroundRef}>
        {/* 🌟 Infinite Parallax Starfield */}
        <Stars
          radius={350}
          depth={80}
          count={starCount}
          factor={7}
          saturation={0}
          fade
          speed={1.2}
        />

        {/* 🌌 Procedural Spiral Galaxy */}
        <group
          ref={galaxyRef}
          position={galaxyTransform.position}
          rotation={galaxyTransform.rotation}
        >
          {/* 🕳️ Scary Massive Black Hole in the center of the galaxy */}
          <GalaxyBlackHole mapTheme={mapTheme} />

          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[galaxyData.positions, 3]}
              />
              <bufferAttribute
                attach="attributes-color"
                args={[galaxyData.colors, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={graphicsQuality === "high" ? 5.5 : graphicsQuality === "low" ? 3.0 : 4.5}
              sizeAttenuation={true}
              vertexColors={true}
              transparent={true}
              opacity={graphicsQuality === "low" ? 0.5 : 0.7}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </points>
        </group>

        {/* 🚨 Neutron Star (Pulsar) Lighthouse */}
        {graphicsQuality !== "low" && (
          <SpacePulsar
            position={pulsarConfig.position}
            color={pulsarConfig.color}
            beamColor={pulsarConfig.beamColor}
          />
        )}

        {/* 🪐 Distant Celestial Planets */}
        {graphicsQuality !== "low" &&
          planetsConfig.map((config, index) => (
            <DistantPlanet
              key={`distant-planet-${index}`}
              position={config.position}
              size={config.size}
              coreColor={config.coreColor}
              wireColor={config.wireColor}
              ringColor={config.ringColor}
              rotationSpeed={config.rotationSpeed}
            />
          ))}
      </group>

      {/* ----------------- REACHABLE WORLD-SPACE EASTER EGGS ----------------- */}
      {graphicsQuality !== "low" && (
        <>
          {/* 📡 Abandoned Satellite (Vanguard-IX) */}
          <AbandonedSatellite mapTheme={mapTheme} />

          {/* 🕋 Cosmic Monolith (Unknown Origin) */}
          <CosmicMonolith mapTheme={mapTheme} />

          {/* ☄️ Distant Exploding Asteroids (Drifting & Periodic Detonation) */}
          <ExplodingAsteroid startPos={[-320, -100, -350]} size={6} mapTheme={mapTheme} />
          <ExplodingAsteroid startPos={[350, 150, 280]} size={9} mapTheme={mapTheme} />
        </>
      )}
    </>
  );
};

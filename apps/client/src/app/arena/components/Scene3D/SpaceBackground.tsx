"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Group, Mesh, AdditiveBlending, DoubleSide } from "three";
import { Billboard, Stars } from "@react-three/drei";
import { MapTheme } from "../../types";

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
// MAIN SPACE BACKGROUND COMPONENT
// ---------------------------------------------------------------------------

export const SpaceBackground = ({ mapTheme, graphicsQuality = "medium" }: SpaceBackgroundProps) => {
  const backgroundRef = useRef<Group>(null);
  const galaxyRef = useRef<Group>(null);
  const { camera } = useThree();

  const starCount = useMemo(() => {
    return graphicsQuality === "high" ? 5000 : graphicsQuality === "low" ? 400 : 1500;
  }, [graphicsQuality]);

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
    // Quality-based star density
    const count = graphicsQuality === "high" ? 4000 : graphicsQuality === "low" ? 800 : 2000;
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
      // Distance from center of the spiral
      const r = Math.pow(Math.random(), 2.2) * 900;
      
      // 2 spiral arms
      const armAngle = ((i % 2) * 2 * Math.PI) / 2;
      const spiralFactor = 0.004;
      const angle = r * spiralFactor + armAngle;

      // Natural dispersion/spread to make it look like a volumetric cloud
      const dispersionPower = 2.5;
      const randomX = (Math.pow(Math.random(), dispersionPower) * (Math.random() < 0.5 ? 1 : -1) * r) / 3;
      const randomY = (Math.pow(Math.random(), dispersionPower) * (Math.random() < 0.5 ? 1 : -1) * r) / 8;
      const randomZ = (Math.pow(Math.random(), dispersionPower) * (Math.random() < 0.5 ? 1 : -1) * r) / 3;

      positions[i * 3] = Math.cos(angle) * r + randomX;
      positions[i * 3 + 1] = randomY;
      positions[i * 3 + 2] = Math.sin(angle) * r + randomZ;

      // Color interpolation from core to outer arms
      const mixedColor = colorInside.clone().lerp(colorOutside, r / 900);
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
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

  // Position of galaxy: far away and tilted
  const galaxyTransform = useMemo(() => {
    return {
      position: [1600, -500, -1600] as [number, number, number],
      rotation: [0.6, 0.4, -0.5] as [number, number, number],
    };
  }, []);

  return (
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
            size={graphicsQuality === "high" ? 14 : graphicsQuality === "low" ? 8 : 11}
            sizeAttenuation={true}
            vertexColors={true}
            transparent={true}
            opacity={graphicsQuality === "low" ? 0.45 : 0.65}
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
  );
};

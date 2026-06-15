import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  Group,
  Mesh,
  AdditiveBlending,
  DoubleSide,
  FrontSide,
  InstancedMesh,
  Object3D,
  BufferGeometry,
  Material
} from "three";
import { Billboard } from "@react-three/drei";
import { IS_MOBILE } from "./constants";
import { usePlanetAudio } from "./usePlanetAudio";
import {
  createProceduralPlanetTexture,
  createProceduralCloudTexture,
  createProceduralMoonTextureColored,
  createProceduralRingTexture
} from "./textures";
import { GlowingDisk } from "./GlowingDisk";

interface MoonConfig {
  scale: number;
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
  ref: React.RefObject<Mesh | null>;
}

interface RockConfig {
  radius: number;
  speed: number;
  angle: number;
  yOffset: number;
  sizeScale: number;
  rotX: number;
  rotY: number;
}

export interface ProceduralPlanetItemProps {
  pos: [number, number, number];
  scale: number;
  type: "gas" | "lava" | "ice" | "terrestrial" | "desert" | "plasma";
  color1: Color;
  color2: Color;
  rotationSpeed?: number;
  hasRings?: boolean;
  hasRockRings?: boolean;
  hasClouds?: boolean;
  moonsCount?: number;
  audioName?: "lava" | "ice" | "gas" | "desert" | "plasma" | "ocean" | "terrestrial";
}

export const ProceduralPlanetItem = ({
  pos,
  scale,
  type,
  color1,
  color2,
  rotationSpeed = 0.02,
  hasRings = false,
  hasRockRings = false,
  hasClouds = false,
  moonsCount = 0,
  audioName,
}: ProceduralPlanetItemProps) => {
  usePlanetAudio(pos, scale, audioName);

  const planetRef = useRef<Group>(null);
  const cloudRef = useRef<Mesh>(null);
  const innerStormRef1 = useRef<Mesh>(null);
  const innerStormRef2 = useRef<Mesh>(null);
  const instancedMeshRef = useRef<InstancedMesh>(null);
  const _dummy = useMemo(() => new Object3D(), []);
  const sphereSegs = IS_MOBILE ? 32 : 64;

  // Orbiting moons config
  const moons = useMemo<MoonConfig[]>(() => {
    const arr: MoonConfig[] = [];
    // Custom moon color palettes: volcanic orange-peach and dusty grey for Lava planet; bright silver-grey for others
    const moonColors = type === "lava"
      ? ["#b0b0b0", "#e59866", "#9e7a7a", "#dfa842"]
      : ["#ffffff", "#e5e5e5", "#d4d4d4", "#cc5533"];
    for (let i = 0; i < moonsCount; i++) {
      arr.push({
        scale: 0.22 + Math.random() * 0.05,       // Larger moon size (realistic relative to planet)
        orbitRadius: 2.6 + i * 0.8,               // Pushed out to avoid clipping
        orbitSpeed: 0.06 + Math.random() * 0.06,  // Slower, majestic orbital speed
        color: moonColors[i % moonColors.length],
        ref: React.createRef<Mesh>(),
      });
    }
    return arr;
  }, [moonsCount, type]);

  // Generate unique canvas textures
  const textures = useMemo(() => createProceduralPlanetTexture(type, color1, color2), [type, color1, color2]);
  const cloudTexture = useMemo(() => (hasClouds ? createProceduralCloudTexture() : null), [hasClouds]);
  const moonTextures = useMemo(() => {
    if (moonsCount <= 0) return [];
    return moons.map((moon, index) => createProceduralMoonTextureColored(type, index, moon.color));
  }, [moons, type, moonsCount]);
  const ringTexture = useMemo(() => (hasRings ? createProceduralRingTexture(color1) : null), [hasRings, color1]);

  // Dispose of old textures to prevent GPU memory leaks and WebGL context loss
  useEffect(() => {
    return () => {
      textures.map.dispose();
      if (textures.bumpMap) textures.bumpMap.dispose();
    };
  }, [textures]);

  useEffect(() => {
    return () => {
      if (cloudTexture) cloudTexture.dispose();
    };
  }, [cloudTexture]);

  useEffect(() => {
    return () => {
      moonTextures.forEach((texs) => {
        texs.map.dispose();
        texs.bumpMap.dispose();
      });
    };
  }, [moonTextures]);

  useEffect(() => {
    return () => {
      if (ringTexture) ringTexture.dispose();
    };
  }, [ringTexture]);

  // Orbiting rock ring particles config
  const rockRing = useMemo<RockConfig[]>(() => {
    if (!hasRockRings) return [];
    const count = 48;
    const arr: RockConfig[] = [];
    for (let i = 0; i < count; i++) {
      const radius = 2.0 + Math.random() * 0.95;
      const speed = 0.03 + Math.random() * 0.04;
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.12;
      const yOffset = (Math.random() - 0.5) * 0.06;
      const sizeScale = 0.02 + Math.random() * 0.03;
      arr.push({
        radius,
        speed,
        angle,
        yOffset,
        sizeScale,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [hasRockRings]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Rotate planet mesh
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed * delta;
    }
    // Rotate clouds at different speed
    if (cloudRef.current) {
      cloudRef.current.rotation.y += (rotationSpeed * 1.35) * delta;
    }
    // Rotate inner storm shells for desert planet
    if (innerStormRef1.current) {
      innerStormRef1.current.rotation.y -= (rotationSpeed * 3.5) * delta;
      innerStormRef1.current.rotation.x += (rotationSpeed * 1.2) * delta;
    }
    if (innerStormRef2.current) {
      innerStormRef2.current.rotation.y += (rotationSpeed * 5.0) * delta;
      innerStormRef2.current.rotation.z -= (rotationSpeed * 1.8) * delta;
    }

    // Orbit moons
    moons.forEach((moon, idx) => {
      if (moon.ref.current) {
        const angle = time * moon.orbitSpeed + idx * Math.PI;
        moon.ref.current.position.set(
          Math.cos(angle) * moon.orbitRadius,
          Math.sin(angle) * 0.18 * moon.orbitRadius,
          Math.sin(angle) * moon.orbitRadius
        );
        moon.ref.current.rotation.y += 0.15 * delta;
      }
    });

    // Orbit rock ring particles
    if (hasRockRings && instancedMeshRef.current) {
      rockRing.forEach((rock, index) => {
        const currentAngle = time * rock.speed + rock.angle;
        rock.rotY += 0.5 * delta;
        rock.rotX += 0.2 * delta;

        _dummy.position.set(
          Math.cos(currentAngle) * rock.radius,
          rock.yOffset,
          Math.sin(currentAngle) * rock.radius
        );
        _dummy.rotation.set(rock.rotX, rock.rotY, 0);
        _dummy.scale.setScalar(rock.sizeScale);
        _dummy.updateMatrix();

        instancedMeshRef.current!.setMatrixAt(index, _dummy.matrix);
      });
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={pos} scale={scale}>
      {/* Rotatable body */}
      <group ref={planetRef}>
        <mesh>
          <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
          <meshStandardMaterial
            map={textures.map}
            side={FrontSide}
            roughness={type === "ice" ? 0.3 : 0.8}
            metalness={type === "ice" ? 0.8 : 0.1}
            emissive={type === "plasma" ? color1 : type === "lava" ? new Color("#ff3300") : new Color("#000000")}
            emissiveMap={type === "lava" ? textures.map : undefined}
            emissiveIntensity={type === "plasma" ? 1.4 : type === "lava" ? 1.8 : 0.0}
            bumpMap={textures.bumpMap}
            bumpScale={type === "lava" ? 0.045 : type === "desert" ? 0.035 : type === "terrestrial" ? 0.03 : type === "ice" ? 0.025 : 0.0}
          />
        </mesh>

        {/* Volumetric stormy interior for desert planet */}
        {type === "desert" && (
          <>
            <mesh scale={0.97}>
              <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
              <meshBasicMaterial
                map={textures.map}
                transparent
                opacity={0.65}
                side={FrontSide}
                depthWrite={false}
                blending={AdditiveBlending}
              />
            </mesh>
            <mesh scale={0.93} ref={innerStormRef1}>
              <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
              <meshBasicMaterial
                map={textures.map}
                transparent
                opacity={0.8}
                side={FrontSide}
                depthWrite={false}
              />
            </mesh>
            <mesh scale={0.85} ref={innerStormRef2}>
              <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
              <meshBasicMaterial
                map={textures.map}
                transparent
                opacity={0.9}
                side={FrontSide}
                depthWrite={false}
              />
            </mesh>
          </>
        )}

        {/* Habitable/Gas Clouds */}
        {hasClouds && cloudTexture && (
          <mesh scale={1.02} ref={cloudRef}>
            <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
            <meshStandardMaterial
              map={cloudTexture}
              transparent
              opacity={0.65}
              depthWrite={false}
              side={FrontSide}
            />
          </mesh>
        )}

        {/* Orbiting moons meshes */}
        {moons.map((moon, index) => (
          <mesh key={index} ref={moon.ref} scale={moon.scale}>
            <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
            <meshStandardMaterial
              map={moonTextures[index]?.map}
              bumpMap={moonTextures[index]?.bumpMap}
              bumpScale={0.06}
              roughness={0.9}
              metalness={0.1}
              side={FrontSide}
            />
          </mesh>
        ))}
      </group>

      {/* Tilted Ring System */}
      {hasRings && ringTexture && (
        <mesh rotation={[Math.PI / 2.5, Math.PI / 12, 0]}>
          <ringGeometry args={[1.4, 2.4, 128]} />
          <meshBasicMaterial
            map={ringTexture}
            side={DoubleSide}
            transparent
            opacity={1.0}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Tilted Asteroid Ring Belt */}
      {hasRockRings && (
        <group rotation={[0.15, 0, 0]}>
          <instancedMesh ref={instancedMeshRef} args={[null as unknown as BufferGeometry, null as unknown as Material, 48]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={color1.clone().lerp(new Color("#332b3d"), 0.55)}
              roughness={0.9}
              metalness={0.2}
              flatShading
            />
          </instancedMesh>
        </group>
      )}

      {/* Outer atmosphere halo (Concentric 2D Billboarded GlowingDisk, starting exactly at the planet's edge) */}
      <Billboard>
        <GlowingDisk
          minRadius={0.98}
          maxRadius={1.38}
          opacityMultiplier={type === "plasma" ? 1.3 : type === "terrestrial" ? 0.95 : 0.8}
          colorIn={type === "terrestrial" ? new Color("#38bdf8") : color1}
          colorOut={new Color("#000000")}
        />
      </Billboard>
    </group>
  );
};
export default ProceduralPlanetItem;

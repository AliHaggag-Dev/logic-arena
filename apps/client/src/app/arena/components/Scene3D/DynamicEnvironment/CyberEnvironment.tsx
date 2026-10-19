import React, { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles, Clouds, Cloud } from "@react-three/drei";
import {
  Group,
  Mesh,
  Vector3,
  MeshBasicMaterial,
  AdditiveBlending,
  FrontSide,
  DoubleSide
} from "three";
import { IS_MOBILE, CYBER_SHIPS, getRandomPos } from "./constants";
import { AmbientSynthesizer } from "./AmbientSynthesizer";
import { BlackHole } from "./BlackHole";
import { AsteroidField } from "./asteroids/AsteroidField";
import type { AsteroidPlacement, Vec3Tuple } from "./asteroids/types";

/* ------------------------------- Sightline -------------------------------- */
const BLACK_HOLE_COORDINATES: Vec3Tuple = [200, 80, -250];
const DEFAULT_CAM_COORDINATES: Vec3Tuple = [0, 22, 14];
const SIGHTLINE_CLEARANCE_RADIUS = 220;
const SIGHTLINE_CONE_COS = 0.82;
const SIGHTLINE_CYLINDER_RADIUS_SQ = 120 * 120;
const SIGHTLINE_CYLINDER_EXTEND = 150;

/* --------------------------- Asteroid population -------------------------- */
const ASTEROID_COUNT = 25;
const ASTEROID_MIN_SIZE = 2;
const ASTEROID_SIZE_SPREAD = 8;
const MAX_PLACEMENT_ATTEMPTS = ASTEROID_COUNT * 15;

/* ─────────── Ship geometry constants ─────────── */
const COCKPIT_EMISSIVE_INTENSITY = 1.8;
const HULL_ROUGHNESS = 0.35;
const HULL_METALNESS = 0.92;
const ENGINE_GLOW_INTENSITY = 4.0;

interface CyberEnvironmentProps {
  isHighQuality: boolean;
}

export const CyberEnvironment = ({ isHighQuality }: CyberEnvironmentProps): React.JSX.Element => {
  const shipsRef = useRef<(Group | null)[]>([]);
  const tempPosRef = useRef(new Vector3());
  
  useFrame((_, delta) => {
    
    CYBER_SHIPS.forEach((config, i) => {
      const ship = shipsRef.current[i];
      if (ship) {
        ship.position[config.axis] += config.speed * delta;
        if (config.axis === 'z' && ship.position.z > 300) ship.position.z = -300;
        else if (config.axis === 'z' && ship.position.z < -300) ship.position.z = 300;
        else if (config.axis === 'x' && ship.position.x > 300) ship.position.x = -300;
        else if (config.axis === 'x' && ship.position.x < -300) ship.position.x = 300;
        else if (config.axis === 'y' && ship.position.y > 300) ship.position.y = -300;
        else if (config.axis === 'y' && ship.position.y < -300) ship.position.y = 300;
      }
    });
  });

  const DEFAULT_CAM_POS = useMemo(() => new Vector3(...DEFAULT_CAM_COORDINATES), []);
  const BLACK_HOLE_POS = useMemo(() => new Vector3(...BLACK_HOLE_COORDINATES), []);
  const SIGHTLINE_DIR = useMemo(
    () => new Vector3().subVectors(BLACK_HOLE_POS, DEFAULT_CAM_POS).normalize(),
    [BLACK_HOLE_POS, DEFAULT_CAM_POS]
  );
  const SIGHTLINE_LEN = useMemo(
    () => DEFAULT_CAM_POS.distanceTo(BLACK_HOLE_POS),
    [BLACK_HOLE_POS, DEFAULT_CAM_POS]
  );

  const isNearBlackHoleOrSightline = useCallback(
    (pos: [number, number, number]): boolean => {
      // 1. Direct 3D distance to the black hole center (covers entire lensing bound radius + halo)
      const distToHole = Math.hypot(
        pos[0] - BLACK_HOLE_POS.x,
        pos[1] - BLACK_HOLE_POS.y,
        pos[2] - BLACK_HOLE_POS.z
      );
      if (distToHole < SIGHTLINE_CLEARANCE_RADIUS) return true;

      // 2. Line of sight corridor from default arena camera to the black hole
      const toPointX = pos[0] - DEFAULT_CAM_POS.x;
      const toPointY = pos[1] - DEFAULT_CAM_POS.y;
      const toPointZ = pos[2] - DEFAULT_CAM_POS.z;
      const toPointDist = Math.hypot(toPointX, toPointY, toPointZ);

      if (toPointDist > 0) {
        // Angular cone check: exclude any object within ~35 degrees of the black hole sightline
        const cosAngle =
          (toPointX * SIGHTLINE_DIR.x + toPointY * SIGHTLINE_DIR.y + toPointZ * SIGHTLINE_DIR.z) /
          toPointDist;
        if (cosAngle > SIGHTLINE_CONE_COS) return true;

        // Cylinder corridor around the ray from camera to black hole (clears foreground corridor)
        const proj =
          toPointX * SIGHTLINE_DIR.x + toPointY * SIGHTLINE_DIR.y + toPointZ * SIGHTLINE_DIR.z;
        if (proj > 10 && proj < SIGHTLINE_LEN + SIGHTLINE_CYLINDER_EXTEND) {
          const perpDistSq = toPointDist * toPointDist - proj * proj;
          if (perpDistSq < SIGHTLINE_CYLINDER_RADIUS_SQ) return true;
        }
      }

      return false;
    },
    [BLACK_HOLE_POS, DEFAULT_CAM_POS, SIGHTLINE_DIR, SIGHTLINE_LEN]
  );

  const cubeData = useMemo<AsteroidPlacement[]>(() => {
    const cubes: AsteroidPlacement[] = [];
    let attempts = 0;
    while (cubes.length < ASTEROID_COUNT && attempts < MAX_PLACEMENT_ATTEMPTS) {
      attempts++;
      const pos = getRandomPos(100, 300, -20, 150);
      if (!isNearBlackHoleOrSightline(pos)) {
        cubes.push({
          size: Math.random() * ASTEROID_SIZE_SPREAD + ASTEROID_MIN_SIZE,
          pos,
        });
      }
    }
    return cubes;
  }, [isNearBlackHoleOrSightline]);

  const getCubeDist = useCallback(
    (camPos: Vector3): number => {
      let minD = Infinity;
      for (let i = 0; i < cubeData.length; i++) {
        const p = cubeData[i].pos;
        const target = tempPosRef.current.set(p[0], p[1], p[2]);
        const d = camPos.distanceTo(target);
        if (d < minD) minD = d;
      }
      return minD;
    },
    [cubeData]
  );

  const cloudData = useMemo(() => {
    const clouds = [];
    let attempts = 0;
    while (clouds.length < 12 && attempts < 150) {
      attempts++;
      const pos = getRandomPos(120, 250, 20, 80);
      if (!isNearBlackHoleOrSightline(pos)) {
        clouds.push({
          pos,
          color: clouds.length % 2 === 0 ? "#05051a" : "#00ffff",
          seed: clouds.length
        });
      }
    }
    return clouds;
  }, [isNearBlackHoleOrSightline]);

  return (
    <>
      <Sparkles count={IS_MOBILE ? 80 : (isHighQuality ? 600 : 150)} scale={[150, 50, 150]} position={[0, 20, 0]} size={2} speed={0.4} opacity={0.5} color="#00ffff" />

      {isHighQuality && (
        <group>
          <AmbientSynthesizer type="blackhole" position={BLACK_HOLE_COORDINATES} maxDistance={480} maxVol={1.2} />
          {/* Massive Interstellar Black Hole */}
          <BlackHole position={BLACK_HOLE_COORDINATES} scale={2.5} />

          {/* ═══════ Distant Cyber Ships — Sleek Sci-fi Spacecraft ═══════ */}
          {CYBER_SHIPS.map((ship, i) => {
            const rotY = ship.axis === 'z' ? (ship.speed > 0 ? 0 : Math.PI) : ship.axis === 'x' ? (ship.speed > 0 ? -Math.PI / 2 : Math.PI / 2) : (ship.speed > 0 ? 0 : Math.PI);
            return (
              <group key={`ship-${i}`} ref={(el) => { shipsRef.current[i] = el; }} position={ship.startPos} rotation={[0, rotY, 0]}>
                {/* Forward fuselage (tapered nose cone) */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 3]}>
                  <coneGeometry args={[1.2, 6, 6]} />
                  <meshStandardMaterial
                    color="#0a0a12"
                    roughness={HULL_ROUGHNESS}
                    metalness={HULL_METALNESS}
                    emissive={ship.color}
                    emissiveIntensity={0.15}
                  />
                </mesh>

                {/* Cockpit canopy (glass dome) */}
                <mesh position={[0, 0.8, 2.5]}>
                  <sphereGeometry args={[0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial
                    color="#001122"
                    roughness={0.05}
                    metalness={0.95}
                    emissive={ship.color}
                    emissiveIntensity={COCKPIT_EMISSIVE_INTENSITY}
                    transparent
                    opacity={0.8}
                  />
                </mesh>

                {/* Main hull (center fuselage) */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[1.8, 1.5, 6, 6]} />
                  <meshStandardMaterial
                    color="#080810"
                    roughness={HULL_ROUGHNESS}
                    metalness={HULL_METALNESS}
                    emissive={ship.color}
                    emissiveIntensity={0.08}
                  />
                </mesh>

                {/* Wing strakes (left) */}
                <mesh position={[-2.8, -0.2, -1]} rotation={[0, 0.15, -0.1]}>
                  <boxGeometry args={[3, 0.2, 4]} />
                  <meshStandardMaterial
                    color="#0c0c14"
                    roughness={0.4}
                    metalness={0.9}
                    emissive={ship.color}
                    emissiveIntensity={0.05}
                  />
                </mesh>

                {/* Wing strakes (right) */}
                <mesh position={[2.8, -0.2, -1]} rotation={[0, -0.15, 0.1]}>
                  <boxGeometry args={[3, 0.2, 4]} />
                  <meshStandardMaterial
                    color="#0c0c14"
                    roughness={0.4}
                    metalness={0.9}
                    emissive={ship.color}
                    emissiveIntensity={0.05}
                  />
                </mesh>

                {/* Engine nacelle - left */}
                <mesh position={[-2.5, -0.3, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.6, 0.9, 3, 8]} />
                  <meshStandardMaterial
                    color="#060608"
                    roughness={0.3}
                    metalness={0.95}
                  />
                </mesh>

                {/* Engine nacelle - right */}
                <mesh position={[2.5, -0.3, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.6, 0.9, 3, 8]} />
                  <meshStandardMaterial
                    color="#060608"
                    roughness={0.3}
                    metalness={0.95}
                  />
                </mesh>

                {/* Engine exhaust glow - left */}
                <mesh position={[-2.5, -0.3, -5.2]}>
                  <sphereGeometry args={[0.7, 8, 8]} />
                  <meshStandardMaterial
                    color="#000000"
                    emissive={ship.color}
                    emissiveIntensity={ENGINE_GLOW_INTENSITY}
                    roughness={0.0}
                    metalness={0.0}
                  />
                </mesh>

                {/* Engine exhaust glow - right */}
                <mesh position={[2.5, -0.3, -5.2]}>
                  <sphereGeometry args={[0.7, 8, 8]} />
                  <meshStandardMaterial
                    color="#000000"
                    emissive={ship.color}
                    emissiveIntensity={ENGINE_GLOW_INTENSITY}
                    roughness={0.0}
                    metalness={0.0}
                  />
                </mesh>

                {/* Thruster trail (additive glow cone) */}
                <mesh position={[0, -0.3, -6]} rotation={[-Math.PI / 2, 0, 0]}>
                  <coneGeometry args={[1.5, 5, 8, 1, true]} />
                  <meshBasicMaterial
                    color={ship.color}
                    transparent
                    opacity={0.12}
                    blending={AdditiveBlending}
                    depthWrite={false}
                    side={DoubleSide}
                  />
                </mesh>
              </group>
            );
          })}

          {/* Photorealistic floating space asteroids with black-hole accretion disk lighting */}
          <group>
            <AmbientSynthesizer type="datacube" distanceFunc={getCubeDist} maxDistance={80} />
            <AsteroidField
              placements={cubeData}
              diskPosition={BLACK_HOLE_COORDINATES}
              isMobile={IS_MOBILE}
            />
          </group>

          {/* 360 Dark Clouds */}
          <Clouds material={MeshBasicMaterial} limit={100}>
            {cloudData.map((data, i) => (
              <Cloud key={i} position={data.pos} speed={0.1} opacity={0.05} bounds={[80, 30, 80]} color={data.color} seed={data.seed} />
            ))}
          </Clouds>
        </group>
      )}
    </>
  );
};
export default CyberEnvironment;

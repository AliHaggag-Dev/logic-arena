import React, { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles, Clouds, Cloud } from "@react-three/drei";
import {
  Group,
  Mesh,
  Vector3,
  MeshBasicMaterial,
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

interface CyberShipProps {
  startPos: [number, number, number];
  speed: number;
  color: string;
  axis?: 'x' | 'z';
}

const CyberShip = ({ startPos, speed, color, axis = 'x' }: CyberShipProps): React.JSX.Element => {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position[axis] += speed * delta;
      if (groupRef.current.position[axis] > 400) groupRef.current.position[axis] = -400;
      if (groupRef.current.position[axis] < -400) groupRef.current.position[axis] = 400;
    }
  });
  
  const rotY = axis === 'x' ? (speed > 0 ? -Math.PI / 2 : Math.PI / 2) : (speed > 0 ? 0 : Math.PI);

  return (
    <group ref={groupRef} position={startPos} rotation={[0, rotY, 0]}>
      <AmbientSynthesizer type="cybership" maxDistance={400} maxVol={0.4} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[2, 10, 4]} />
        <meshStandardMaterial color="#111" emissive={color} emissiveIntensity={0.8} wireframe />
      </mesh>
      <mesh position={[0, 0, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 2, 4, 8]} />
        <meshStandardMaterial color="#0a0a2a" emissive="#000" />
      </mesh>
    </group>
  );
};

interface CyberEnvironmentProps {
  isHighQuality: boolean;
}

export const CyberEnvironment = ({ isHighQuality }: CyberEnvironmentProps): React.JSX.Element => {
  const planet2Ref = useRef<Mesh>(null);
  const planet3Ref = useRef<Mesh>(null);
  const shipsRef = useRef<(Group | null)[]>([]);
  const tempPosRef = useRef(new Vector3());
  
  useFrame((_, delta) => {
    if (planet2Ref.current) planet2Ref.current.rotation.x += delta * 0.02;
    if (planet3Ref.current) planet3Ref.current.rotation.z -= delta * 0.03;
    
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

          {/* Planet 2: Small dense data-sphere on the opposite side */}
          <mesh ref={planet2Ref} position={[-150, 40, 180]}>
            <AmbientSynthesizer type="moon" position={[-150, 40, 180]} maxDistance={200} />
            <sphereGeometry args={[30, 16, 16]} />
            <meshBasicMaterial color="#ff00ff" wireframe transparent opacity={0.2} />
          </mesh>

          {/* Planet 3: High altitude geometric moon */}
          <mesh ref={planet3Ref} position={[-100, 180, -100]}>
            <AmbientSynthesizer type="moon" position={[-100, 180, -100]} maxDistance={200} />
            <octahedronGeometry args={[40, 1]} />
            <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.1} />
          </mesh>

          {/* Distant Cyber Ships */}
          {CYBER_SHIPS.map((ship, i) => {
            const rotY = ship.axis === 'z' ? (ship.speed > 0 ? 0 : Math.PI) : ship.axis === 'x' ? (ship.speed > 0 ? -Math.PI / 2 : Math.PI / 2) : (ship.speed > 0 ? 0 : Math.PI);
            return (
              <group key={`ship-${i}`} ref={(el) => { shipsRef.current[i] = el; }} position={ship.startPos} rotation={[0, rotY, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <coneGeometry args={[2, 10, 4]} />
                  <meshStandardMaterial color="#111" emissive={ship.color} emissiveIntensity={0.8} wireframe />
                </mesh>
                <mesh position={[0, 0, -4]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[1, 2, 4, 8]} />
                  <meshStandardMaterial color="#111" emissive={ship.color} emissiveIntensity={2} />
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

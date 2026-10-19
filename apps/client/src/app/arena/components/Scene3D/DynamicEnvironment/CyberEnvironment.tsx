import React, { useRef, useMemo, useCallback, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles, Clouds, Cloud } from "@react-three/drei";
import {
  Group,
  Mesh,
  InstancedMesh,
  Object3D,
  Vector3,
  Color,
  Euler,
  IcosahedronGeometry,
  Float32BufferAttribute,
  MeshBasicMaterial,
  Material
} from "three";
import { IS_MOBILE, CYBER_SHIPS, getRandomPos } from "./constants";
import { AmbientSynthesizer } from "./AmbientSynthesizer";
import { BlackHole } from "./BlackHole";

interface CyberShipProps {
  startPos: [number, number, number];
  speed: number;
  color: string;
  axis?: 'x' | 'z';
}

const CyberShip = ({ startPos, speed, color, axis = 'x' }: CyberShipProps) => {
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

export const CyberEnvironment = ({ isHighQuality }: CyberEnvironmentProps) => {
  const planet2Ref = useRef<Mesh>(null);
  const planet3Ref = useRef<Mesh>(null);
  const cubesRef = useRef<Group>(null);
  const shipsRef = useRef<(Group | null)[]>([]);
  const localCamRef = useRef(new Vector3());
  const tempPosRef = useRef(new Vector3());
  
  useFrame((_, delta) => {
    if (planet2Ref.current) planet2Ref.current.rotation.x += delta * 0.02;
    if (planet3Ref.current) planet3Ref.current.rotation.z -= delta * 0.03;
    if (cubesRef.current) {
      cubesRef.current.rotation.x += delta * 0.02;
      cubesRef.current.rotation.y += delta * 0.05;
    }
    
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

  const cubeCount = 25;
  const cubeMeshRef = useRef<InstancedMesh>(null);
  const _cubeDummy = useMemo(() => new Object3D(), []);

  // Programmatically generate a jagged, detailed space rock geometry with vertex colors
  const asteroidGeometry = useMemo(() => {
    const geom = new IcosahedronGeometry(1.2, 2); // 2 subdivisions for detail
    const posAttr = geom.getAttribute("position");
    const count = posAttr.count;
    const tempV = new Vector3();
    
    // Perturb vertices along their normal direction to create jagged rock facets
    for (let i = 0; i < count; i++) {
      tempV.fromBufferAttribute(posAttr, i);
      const dir = tempV.clone().normalize();
      
      const noiseVal = 
        Math.sin(tempV.x * 6.0) * Math.cos(tempV.y * 6.0) * 0.15 +
        Math.cos(tempV.z * 5.0) * Math.sin(tempV.x * 3.0) * 0.10;
        
      tempV.addScaledVector(dir, noiseVal);
      posAttr.setXYZ(i, tempV.x, tempV.y, tempV.z);
    }
    
    geom.computeVertexNormals();
    
    // Build mineral vein shading colors (vertex colors)
    const colors: number[] = [];
    for (let i = 0; i < count; i++) {
      tempV.fromBufferAttribute(posAttr, i);
      
      // Vein wave pattern
      const veinVal = Math.sin(tempV.x * 5.0) * Math.cos(tempV.y * 5.0) * Math.sin(tempV.z * 5.0);
      let r = 0.12, g = 0.14, b = 0.18; // dark slate gray rock base
      
      if (veinVal > 0.3) {
        // Glowing cyan veins
        r = 0.1; g = 0.9; b = 1.0;
      } else if (veinVal < -0.3) {
        // Glowing magenta veins
        r = 1.0; g = 0.1; b = 0.9;
      } else {
        // Height shading variation
        const height = (tempV.length() - 0.9) / 0.55;
        r += height * 0.08;
        g += height * 0.08;
        b += height * 0.12;
      }
      colors.push(r, g, b);
    }
    
    geom.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return geom;
  }, []);

  const BLACK_HOLE_POS = useMemo(() => new Vector3(200, 80, -250), []);
  const BLACK_HOLE_CLEARANCE_RADIUS = 180;

  const cubeData = useMemo(() => {
    const cubes = [];
    let attempts = 0;
    const maxAttempts = cubeCount * 10;
    while (cubes.length < cubeCount && attempts < maxAttempts) {
      attempts++;
      const pos = getRandomPos(100, 300, -20, 150);
      const distToHole = Math.hypot(pos[0] - BLACK_HOLE_POS.x, pos[1] - BLACK_HOLE_POS.y, pos[2] - BLACK_HOLE_POS.z);
      if (distToHole >= BLACK_HOLE_CLEARANCE_RADIUS) {
        cubes.push({
          size: Math.random() * 8 + 2,
          pos,
          color: Math.random() > 0.5 ? "#00ffff" : "#ff00ff",
          rot: new Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
        });
      }
    }
    return cubes;
  }, [cubeCount, BLACK_HOLE_POS]);

  useLayoutEffect(() => {
    if (!cubeMeshRef.current) return;
    const colorA = new Color("#00ffff");
    const colorB = new Color("#ff00ff");
    cubeData.forEach((d, i) => {
      _cubeDummy.position.set(d.pos[0], d.pos[1], d.pos[2]);
      _cubeDummy.rotation.copy(d.rot);
      _cubeDummy.scale.setScalar(d.size);
      _cubeDummy.updateMatrix();
      cubeMeshRef.current!.setMatrixAt(i, _cubeDummy.matrix);
      // The instance color multiplies the vertex colors to tint the veins/rock
      cubeMeshRef.current!.setColorAt(i, d.color === "#00ffff" ? colorA : colorB);
    });
    cubeMeshRef.current.instanceMatrix.needsUpdate = true;
    cubeMeshRef.current.instanceColor!.needsUpdate = true;
  }, [cubeData, _cubeDummy]);

  const getCubeDist = useCallback((camPos: Vector3) => {
    if (!cubesRef.current) return Infinity;
    const localCam = localCamRef.current.copy(camPos);
    cubesRef.current.worldToLocal(localCam);
    let minD = Infinity;
    for (let i = 0; i < cubeData.length; i++) {
      const p = cubeData[i].pos;
      const target = tempPosRef.current.set(p[0], p[1], p[2]);
      const d = localCam.distanceTo(target);
      if (d < minD) minD = d;
    }
    return minD;
  }, [cubeData]);

  const cloudData = useMemo(() => {
    const clouds = [];
    let attempts = 0;
    while (clouds.length < 12 && attempts < 120) {
      attempts++;
      const pos = getRandomPos(120, 250, 20, 80);
      const distToHole = Math.hypot(pos[0] - BLACK_HOLE_POS.x, pos[1] - BLACK_HOLE_POS.y, pos[2] - BLACK_HOLE_POS.z);
      if (distToHole >= BLACK_HOLE_CLEARANCE_RADIUS) {
        clouds.push({
          pos,
          color: clouds.length % 2 === 0 ? "#05051a" : "#00ffff",
          seed: clouds.length
        });
      }
    }
    return clouds;
  }, [BLACK_HOLE_POS]);

  return (
    <>
      <Sparkles count={IS_MOBILE ? 80 : (isHighQuality ? 600 : 150)} scale={[150, 50, 150]} position={[0, 20, 0]} size={2} speed={0.4} opacity={0.5} color="#00ffff" />

      {isHighQuality && (
        <group>
          <AmbientSynthesizer type="blackhole" position={[200, 80, -250]} maxDistance={480} maxVol={1.2} />
          {/* Massive Interstellar Black Hole */}
          <BlackHole position={[200, 80, -250]} scale={2.5} />

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

          {/* Random floating space asteroids around the entire map */}
          <group ref={cubesRef}>
            <AmbientSynthesizer type="datacube" distanceFunc={getCubeDist} maxDistance={80} />
            <instancedMesh ref={cubeMeshRef} args={[asteroidGeometry, undefined as unknown as Material, cubeCount]}>
              <meshStandardMaterial
                vertexColors={true}
                roughness={0.85}
                metalness={0.3}
                flatShading={true}
                emissive="#060612"
              />
            </instancedMesh>
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

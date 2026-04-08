"use client";
import { Component, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera, Html } from "@react-three/drei";
import * as THREE from "three";
import { useGameSounds } from "./hooks/useGameSounds";

type RobotModelProps = {
  position: [number, number, number];
  color: string;
  health: number;
  velocity: { x: number; y: number };
  rotation?: number;
  hitTimestamp?: number | null;
  spotted?: boolean;
};

type HitBurst = {
  id: string;
  position: [number, number, number];
  color: string;
  createdAt: number;
};

type RobotErrorBoundaryProps = {
  fallback: ReactNode;
  children: ReactNode;
};

type RobotErrorBoundaryState = {
  hasError: boolean;
};

const HIT_FLASH_DURATION = 0.22;
const HIT_BURST_LIFETIME = 0.35;
const HIT_BURST_PARTICLES = 12;
const COLLISION_RADIUS = 30;
const COLLISION_COOLDOWN = 0.35;
const FOV_DISTANCE = 1000;
const FOV_DOT_THRESHOLD = Math.cos(Math.PI / 6);

class RobotErrorBoundary extends Component<RobotErrorBoundaryProps, RobotErrorBoundaryState> {
  state: RobotErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RobotErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Intentionally empty to avoid crashing render tree
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const FallbackRobot = ({ position, color }: { position: [number, number, number]; color: string }) => (
  <mesh position={position}>
    <sphereGeometry args={[0.35, 24, 24]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
  </mesh>
);

const HitBurstEffect = ({
  burst,
  now
}: {
  burst: HitBurst;
  now: number;
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const { positions, velocities } = useMemo(() => {
    const positionsArray = new Float32Array(HIT_BURST_PARTICLES * 3);
    const velocitiesArray = new Float32Array(HIT_BURST_PARTICLES * 3);

    for (let i = 0; i < HIT_BURST_PARTICLES; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.8 + Math.random() * 1.2;

      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.cos(phi) * speed;
      const vz = Math.sin(phi) * Math.sin(theta) * speed;

      const index = i * 3;
      velocitiesArray[index] = vx;
      velocitiesArray[index + 1] = vy;
      velocitiesArray[index + 2] = vz;

      positionsArray[index] = burst.position[0];
      positionsArray[index + 1] = burst.position[1];
      positionsArray[index + 2] = burst.position[2];
    }

    return { positions: positionsArray, velocities: velocitiesArray };
  }, [burst.position]);

  useFrame(() => {
    const timeAlive = Math.max(0, now - burst.createdAt);
    const progress = Math.min(1, timeAlive / HIT_BURST_LIFETIME);

    const positionAttr = pointsRef.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!positionAttr) return;

    for (let i = 0; i < HIT_BURST_PARTICLES; i += 1) {
      const index = i * 3;
      positionAttr.array[index] = burst.position[0] + velocities[index] * timeAlive;
      positionAttr.array[index + 1] = burst.position[1] + velocities[index + 1] * timeAlive;
      positionAttr.array[index + 2] = burst.position[2] + velocities[index + 2] * timeAlive;
    }
    positionAttr.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.opacity = 1 - progress;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color={burst.color}
        size={0.06}
        transparent
        opacity={1}
        depthWrite={false}
      />
    </points>
  );
};

const HitParticles = ({
  bursts,
  setBursts
}: {
  bursts: HitBurst[];
  setBursts: React.Dispatch<React.SetStateAction<HitBurst[]>>;
}) => {
  useFrame(() => {
    const now = performance.now() / 1000;
    setBursts(current => current.filter(burst => now - burst.createdAt < HIT_BURST_LIFETIME));
  });

  const now = performance.now() / 1000;

  return (
    <>
      {bursts.map(burst => (
        <HitBurstEffect key={burst.id} burst={burst} now={now} />
      ))}
    </>
  );
};

const RobotModel = ({ position, color, health, velocity, rotation, hitTimestamp, spotted }: RobotModelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const basePosition = useRef(new THREE.Vector3(...position));
  const hoverOffset = useRef(Math.random() * Math.PI * 2);
  const thrusterMaterials = useRef<THREE.MeshStandardMaterial[]>([]);
  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const headMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const baseColorRef = useRef(new THREE.Color(color));
  const tempColorRef = useRef(new THREE.Color());
  const flashWhite = useRef(new THREE.Color("#ffffff"));

  useEffect(() => {
    basePosition.current.set(position[0], position[1], position[2]);
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
    }
  }, [position]);

  useEffect(() => {
    baseColorRef.current.set(color);
  }, [color]);

  const resolveRotation = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return null;
    }
    return Math.abs(value) > Math.PI * 2 ? THREE.MathUtils.degToRad(value) : value;
  };

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const targetRotation = resolveRotation(rotation);
    if (targetRotation !== null) {
      const lerpFactor = 1 - Math.pow(0.001, delta);
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotation, lerpFactor);
    } else {
      const speed = Math.hypot(velocity.x, velocity.y);
      if (speed > 0.001) {
        const fallbackRotation = -Math.atan2(velocity.y, velocity.x);
        const lerpFactor = 1 - Math.pow(0.001, delta);
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, fallbackRotation, lerpFactor);
      }
    }

    const hover = Math.sin(state.clock.elapsedTime * 2 + hoverOffset.current) * 0.05;
    group.position.y = basePosition.current.y + hover;
    group.position.x = basePosition.current.x;
    group.position.z = basePosition.current.z;

    const flicker = 1.2 + Math.sin(state.clock.elapsedTime * 12 + hoverOffset.current) * 0.5;
    thrusterMaterials.current.forEach(material => {
      if (material) {
        material.emissiveIntensity = flicker;
      }
    });

    const now = performance.now() / 1000;
    const timeSinceHit = hitTimestamp ? now - hitTimestamp : Infinity;
    const flash = timeSinceHit < HIT_FLASH_DURATION
      ? 1 - timeSinceHit / HIT_FLASH_DURATION
      : 0;

    if (bodyMaterialRef.current) {
      tempColorRef.current.copy(baseColorRef.current).lerp(flashWhite.current, flash);
      bodyMaterialRef.current.color.copy(tempColorRef.current);
    }
    if (headMaterialRef.current) {
      tempColorRef.current.copy(baseColorRef.current).lerp(flashWhite.current, flash);
      headMaterialRef.current.color.copy(tempColorRef.current);
    }
  });

  const thrusterMaterialRef = (index: number) => (material: THREE.MeshStandardMaterial | null) => {
    if (material) {
      thrusterMaterials.current[index] = material;
    }
  };

  const bodyColor = new THREE.Color(color);
  const emissiveColor = new THREE.Color("#000000");

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.7, 0.4, 0.9]} />
      <meshStandardMaterial
        ref={bodyMaterialRef}
        color={bodyColor}
        emissive={emissiveColor}
        emissiveIntensity={0}
        roughness={0.85}
        metalness={0.05}
      />
      </mesh>

      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
      <meshStandardMaterial
        ref={headMaterialRef}
        color={bodyColor}
        emissive={emissiveColor}
        emissiveIntensity={0}
        roughness={0.85}
        metalness={0.05}
      />
      </mesh>

      <mesh position={[-0.08, 0.72, 0.2]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[0.08, 0.72, 0.2]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={2.5} />
      </mesh>

      <mesh position={[0.4, 0.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.6, 1.2, 16, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>

      <mesh position={[-0.25, 0.05, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
        <meshStandardMaterial ref={thrusterMaterialRef(0)} color="#1a1a1a" emissive="#00FFFF" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.25, 0.05, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
        <meshStandardMaterial ref={thrusterMaterialRef(1)} color="#1a1a1a" emissive="#00FFFF" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.25, 0.05, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
        <meshStandardMaterial ref={thrusterMaterialRef(2)} color="#1a1a1a" emissive="#00FFFF" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.25, 0.05, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
        <meshStandardMaterial ref={thrusterMaterialRef(3)} color="#1a1a1a" emissive="#00FFFF" emissiveIntensity={0.3} />
      </mesh>

      <pointLight position={[0, 0.4, 0]} intensity={1.8} distance={3} color={color} />

      {spotted && (
        <Html distanceFactor={10} position={[0, 1.25, 0]} center>
          <div style={{
            fontSize: "14px",
            color: "#FF3B3B",
            fontWeight: 700,
            textShadow: "0 0 6px rgba(255, 59, 59, 0.8)"
          }}>
            !
          </div>
        </Html>
      )}

      <Html distanceFactor={10} position={[0, 1.0, 0]} center>
        <div style={{
          width: "40px",
          height: "5px",
          background: "rgba(0, 0, 0, 0.7)",
          border: "1px solid #444",
          borderRadius: "2px",
          overflow: "hidden"
        }}>
          <div style={{
            width: `${health}%`,
            height: "100%",
            background: health > 30 ? "#00FF00" : "#FF0000",
            transition: "width 0.2s ease-out"
          }} />
        </div>
      </Html>
    </group>
  );
};

const LaserModel = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position}>
    <sphereGeometry args={[0.1, 16, 16]} />
    <meshStandardMaterial color="#FFFFFF" emissive="#00FFFF" emissiveIntensity={10} toneMapped={false} />
  </mesh>
);

const LaserBeam = ({ start, end }: { start: [number, number, number]; end: [number, number, number] }) => {
  const midpoint = useMemo(() => {
    return new THREE.Vector3(
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2
    );
  }, [start, end]);

  const direction = useMemo(() => {
    return new THREE.Vector3(
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2]
    );
  }, [start, end]);

  const length = direction.length();
  const quaternion = useMemo(() => {
    const axis = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(axis, direction.clone().normalize());
  }, [direction]);

  return (
    <mesh position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.03, 0.05, length, 12]} />
      <meshStandardMaterial color="#FF00FF" emissive="#FF00FF" emissiveIntensity={6} toneMapped={false} />
    </mesh>
  );
};

const SpeechBubble = ({ position, message }: { position: [number, number, number], message: string }) => {
  return (
    <Html position={[position[0], position[1] + 1, position[2]]} center>
      <div style={{
        background: "rgba(0, 0, 0, 0.7)",
        padding: "5px 10px",
        borderRadius: "5px",
        color: "#00FF00",
        fontSize: "12px",
        whiteSpace: "nowrap",
        border: "1px solid #00FF00",
        pointerEvents: "none",
        transform: "translateY(-100%)",
      }}>
        {message}
      </div>
    </Html>
  );
};

export const Scene3D = ({
  robots,
  projectiles = [],
  firedTracer = null,
  speechBubble = null
}: {
  robots: any[],
  projectiles?: any[],
  firedTracer?: { robotId: string; targetPosition: { x: number; y: number; }; } | null,
  speechBubble?: { robotId: string; message: string; } | null
}) => {
  // Arena units based on 800x600 engine (Scale 1 unit = 40px)
  const arenaWidth = 20; // 800 / 40
  const arenaHeight = 15; // 600 / 40

  const { playHit, playClang, playLaser } = useGameSounds({ volume: 0.5 });
  const collisionCooldownRef = useRef<Map<string, number>>(new Map());
  const lastLaserRef = useRef<string | null>(null);

  const [hitBursts, setHitBursts] = useState<HitBurst[]>([]);
  const hitFlashRef = useRef<Map<string, number>>(new Map());
  const prevHealthRef = useRef<Map<string, number>>(new Map());
  const [, setHitTick] = useState(0);

  useEffect(() => {
    const now = performance.now() / 1000;

    robots.forEach(robot => {
      const prevHealth = prevHealthRef.current.get(robot.id);
      if (prevHealth !== undefined && robot.health < prevHealth) {
        const burst: HitBurst = {
          id: `${robot.id}-${now}`,
          position: [
            (robot.position.x / 40) - 10,
            0.45,
            (robot.position.y / 40) - 7.5
          ],
          color: robot.color,
          createdAt: now
        };
        setHitBursts(current => [...current, burst]);
        hitFlashRef.current.set(robot.id, now);
        setHitTick(tick => tick + 1);
        playHit();
      }
      prevHealthRef.current.set(robot.id, robot.health);
    });
  }, [robots, playHit]);

  useEffect(() => {
    const now = performance.now() / 1000;
    const robotCount = robots.length;

    for (let i = 0; i < robotCount; i += 1) {
      for (let j = i + 1; j < robotCount; j += 1) {
        const robotA = robots[i];
        const robotB = robots[j];

        const dx = robotA.position.x - robotB.position.x;
        const dy = robotA.position.y - robotB.position.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= COLLISION_RADIUS) {
          const pairKey = [robotA.id, robotB.id].sort().join("|");
          const lastPlayed = collisionCooldownRef.current.get(pairKey) || 0;
          if (now - lastPlayed > COLLISION_COOLDOWN) {
            playClang();
            collisionCooldownRef.current.set(pairKey, now);
          }
        }
      }
    }
  }, [robots, playClang]);

  useEffect(() => {
    if (!firedTracer) return;
    const key = `${firedTracer.robotId}-${firedTracer.targetPosition.x}-${firedTracer.targetPosition.y}`;
    if (lastLaserRef.current !== key) {
      playLaser();
      lastLaserRef.current = key;
    }
  }, [firedTracer, playLaser]);

  const getClosestTarget = (robot: any) => {
    const targets = robots.filter((other: any) => other.id !== robot.id && other.health > 0);
    if (targets.length === 0) return null;

    return targets.reduce((closest: any, current: any) => {
      const closestDx = robot.position.x - closest.position.x;
      const closestDy = robot.position.y - closest.position.y;
      const currentDx = robot.position.x - current.position.x;
      const currentDy = robot.position.y - current.position.y;

      const closestDistance = closestDx * closestDx + closestDy * closestDy;
      const currentDistance = currentDx * currentDx + currentDy * currentDy;

      return currentDistance < closestDistance ? current : closest;
    });
  };

  const isSpotted = (robot: any) => {
    const target = getClosestTarget(robot);
    if (!target) return false;

    const dx = target.position.x - robot.position.x;
    const dy = target.position.y - robot.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return true;
    if (distance > FOV_DISTANCE) return false;

    const vx = robot.velocity?.x ?? 0;
    const vy = robot.velocity?.y ?? 0;
    const speed = Math.hypot(vx, vy);
    if (speed < 0.001) return false;

    const dot = (vx * dx + vy * dy) / (speed * distance);
    return dot >= FOV_DOT_THRESHOLD;
  };

  return (
    <div className="w-full h-screen bg-black">
      <Canvas dpr={[1, 1.5]} gl={{ powerPreference: "high-performance" }}>
        <PerspectiveCamera makeDefault position={[0, 18, 18]} />
        <OrbitControls target={[0, 0, 0]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.85} />
        <pointLight position={[10, 10, 10]} intensity={1.6} />

        {/* Custom Grid: Scaled to match the 20x15 (800x600) Arena */}
        <gridHelper
          args={[20, 20, "#333", "#111"]}
          scale={[1, 1, 0.75]}
          position={[0, 0, 0]}
        />

        {/* Arena Floor - Matches Engine Bounds */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[arenaWidth, arenaHeight]} />
          <meshBasicMaterial color="#0a0a0a" />
        </mesh>

        {/* Boundary Line (Neon Cyan Rectangle) */}
        <lineLoop>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              count={4}
              itemSize={3}
              args={[
                new Float32Array([
                  -10, 0, -7.5,
                  10, 0, -7.5,
                  10, 0, 7.5,
                  -10, 0, 7.5
                ]),
                3
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial attach="material" color="#00FFFF" linewidth={2} />
        </lineLoop>

        <HitParticles bursts={hitBursts} setBursts={setHitBursts} />

        {/* Draw Robots */}
        {robots.map((robot: any) => {
          const robotPosition: [number, number, number] = [
            (robot.position.x / 40) - 10,
            0.15,
            (robot.position.y / 40) - 7.5
          ];

          return (
            <RobotErrorBoundary
              key={robot.id}
              fallback={<FallbackRobot position={robotPosition} color={robot.color} />}
            >
              <RobotModel
                position={robotPosition}
                color={robot.color}
                health={robot.health}
                velocity={robot.velocity ?? { x: 0, y: 0 }}
                rotation={typeof robot.rotation === "number" ? robot.rotation : undefined}
                hitTimestamp={hitFlashRef.current.get(robot.id)}
                spotted={isSpotted(robot)}
              />
            </RobotErrorBoundary>
          );
        })}

        {/* Draw Tracer Line for Fired Projectiles */}
        {firedTracer && robots.map(robot => {
          if (robot.id === firedTracer.robotId) {
            const startPos: [number, number, number] = [
              (robot.position.x / 40) - 10,
              0.375,
              (robot.position.y / 40) - 7.5
            ];
            const endPos: [number, number, number] = [
              (firedTracer.targetPosition.x / 40) - 10,
              0.375,
              (firedTracer.targetPosition.y / 40) - 7.5
            ];
            return <LaserBeam key={`tracer-${robot.id}`} start={startPos} end={endPos} />;
          }
          return null;
        })}

        {/* Display Speech Bubble */}
        {speechBubble && robots.map(robot => {
          if (robot.id === speechBubble.robotId) {
            const pos = [
              (robot.position.x / 40) - 10,
              0.375,
              (robot.position.y / 40) - 7.5
            ] as [number, number, number];
            return <SpeechBubble key={`bubble-${robot.id}`} position={pos} message={speechBubble.message} />;
          }
          return null;
        })}

        {/* Draw Projectiles */}
        {projectiles.map((p: any) => (
          <LaserModel
            key={p.id}
            position={[
              (p.position.x / 40) - 10,
              0.375,
              (p.position.y / 40) - 7.5
            ]}
          />
        ))}
      </Canvas>
    </div>
  );
};
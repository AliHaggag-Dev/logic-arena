'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color, Vector3, BufferGeometry, Material } from 'three';

interface RobotShatterEffectProps {
  color: string;
}

interface ParticleState {
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3;
  rotationSpeed: Vector3;
  scale: Vector3;
  bounceCount: number;
  color: Color;
}

const DEBRIS_COUNT = 48;
const SPARK_COUNT = 16;
const LIFETIME_SECONDS = 2.0;
const GRAVITY = 8.5;
const FLOOR_Y = -0.15; // Local floor height relative to robot position

export const RobotShatterEffect = ({ color }: RobotShatterEffectProps) => {
  const debrisMeshRef = useRef<InstancedMesh>(null);
  const sparkMeshRef = useRef<InstancedMesh>(null);

  const creationTimeRef = useRef<number | null>(null);
  const colorAppliedRef = useRef(false);

  // Initialize debris particles
  const debrisParticles = useMemo<ParticleState[]>(() => {
    const arr: ParticleState[] = [];
    const baseColor = new Color(color);
    const darkGray = new Color('#333333');
    const midGray = new Color('#555555');

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 2.2;
      
      const vx = Math.cos(angle) * speed;
      const vy = 1.0 + Math.random() * 3.5; // Blast upwards
      const vz = Math.sin(angle) * speed;

      const size = 0.04 + Math.random() * 0.08;
      const scale = new Vector3(
        size * (0.8 + Math.random() * 0.4),
        size * (0.8 + Math.random() * 0.4),
        size * (0.8 + Math.random() * 0.4)
      );

      // 70% primary robot color, 30% gray machinery color
      const pColor = Math.random() > 0.3 ? baseColor.clone() : (Math.random() > 0.5 ? darkGray.clone() : midGray.clone());

      arr.push({
        position: new Vector3(
          (Math.random() - 0.5) * 0.25,
          0.1 + Math.random() * 0.35,
          (Math.random() - 0.5) * 0.25
        ),
        velocity: new Vector3(vx, vy, vz),
        rotation: new Vector3(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        rotationSpeed: new Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8
        ),
        scale,
        bounceCount: 0,
        color: pColor,
      });
    }
    return arr;
  }, [color]);

  // Initialize spark particles (glowing)
  const sparkParticles = useMemo<ParticleState[]>(() => {
    const arr: ParticleState[] = [];
    const sparkColor = new Color(color).clone().multiplyScalar(1.5); // Boost color brightness
    const energyYellow = new Color('#ffe066');

    for (let i = 0; i < SPARK_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5; // Sparks fly faster
      
      const vx = Math.cos(angle) * speed;
      const vy = 2.0 + Math.random() * 4.5; // High upward blast
      const vz = Math.sin(angle) * speed;

      const size = 0.02 + Math.random() * 0.04; // Sparks are smaller
      const scale = new Vector3(size, size, size);

      // Spark color (either robot glow accent or yellow electric spark)
      const pColor = Math.random() > 0.5 ? sparkColor.clone() : energyYellow.clone();

      arr.push({
        position: new Vector3(
          (Math.random() - 0.5) * 0.15,
          0.2 + Math.random() * 0.3,
          (Math.random() - 0.5) * 0.15
        ),
        velocity: new Vector3(vx, vy, vz),
        rotation: new Vector3(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        rotationSpeed: new Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        ),
        scale,
        bounceCount: 0,
        color: pColor,
      });
    }
    return arr;
  }, [color]);

  const dummy = useMemo(() => new Object3D(), []);

  useFrame((state, delta) => {
    if (creationTimeRef.current === null) {
      creationTimeRef.current = state.clock.elapsedTime;
    }

    const age = state.clock.elapsedTime - creationTimeRef.current;
    if (age > LIFETIME_SECONDS) return;

    const progress = age / LIFETIME_SECONDS;
    // Shrink factor for fading out near the end
    const shrinkFactor = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;

    const debrisMesh = debrisMeshRef.current;
    const sparkMesh = sparkMeshRef.current;

    // Apply colors once meshes are bound and ready
    if (!colorAppliedRef.current) {
      if (debrisMesh) {
        debrisParticles.forEach((p, idx) => {
          debrisMesh.setColorAt(idx, p.color);
        });
        if (debrisMesh.instanceColor) {
          debrisMesh.instanceColor.needsUpdate = true;
        }
      }
      if (sparkMesh) {
        sparkParticles.forEach((p, idx) => {
          sparkMesh.setColorAt(idx, p.color);
        });
        if (sparkMesh.instanceColor) {
          sparkMesh.instanceColor.needsUpdate = true;
        }
      }
      colorAppliedRef.current = true;
    }

    // Update debris physics
    if (debrisMesh) {
      debrisParticles.forEach((p, idx) => {
        const isOnFloor = p.position.y <= FLOOR_Y && p.velocity.y === 0;

        if (!isOnFloor) {
          p.velocity.y -= GRAVITY * delta;
          p.position.x += p.velocity.x * delta;
          p.position.y += p.velocity.y * delta;
          p.position.z += p.velocity.z * delta;

          if (p.position.y <= FLOOR_Y) {
            p.position.y = FLOOR_Y;
            if (p.bounceCount < 2) {
              p.velocity.y = -p.velocity.y * 0.35; // Bounce
              p.velocity.x *= 0.55; // Friction
              p.velocity.z *= 0.55;
              p.bounceCount++;
            } else {
              p.velocity.set(0, 0, 0); // Rest on floor
            }
          }

          p.rotation.x += p.rotationSpeed.x * delta;
          p.rotation.y += p.rotationSpeed.y * delta;
          p.rotation.z += p.rotationSpeed.z * delta;
        }

        dummy.position.copy(p.position);
        dummy.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
        dummy.scale.copy(p.scale).multiplyScalar(shrinkFactor);
        dummy.updateMatrix();
        debrisMesh.setMatrixAt(idx, dummy.matrix);
      });
      debrisMesh.instanceMatrix.needsUpdate = true;
    }

    // Update sparks physics
    if (sparkMesh) {
      sparkParticles.forEach((p, idx) => {
        // Sparks fade out faster, let's shrink them faster
        const sparkShrink = progress > 0.4 ? 1 - (progress - 0.4) / 0.6 : 1;

        p.velocity.y -= GRAVITY * 0.7 * delta; // Less gravity on light sparks
        p.position.x += p.velocity.x * delta;
        p.position.y += p.velocity.y * delta;
        p.position.z += p.velocity.z * delta;

        // Sparks bounce higher, don't rest easily
        if (p.position.y <= FLOOR_Y) {
          p.position.y = FLOOR_Y;
          p.velocity.y = -p.velocity.y * 0.5; // High bounce
          p.velocity.x *= 0.7;
          p.velocity.z *= 0.7;
        }

        p.rotation.x += p.rotationSpeed.x * delta;
        p.rotation.y += p.rotationSpeed.y * delta;
        p.rotation.z += p.rotationSpeed.z * delta;

        dummy.position.copy(p.position);
        dummy.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
        dummy.scale.copy(p.scale).multiplyScalar(sparkShrink);
        dummy.updateMatrix();
        sparkMesh.setMatrixAt(idx, dummy.matrix);
      });
      sparkMesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Debris Mesh (standard pieces) */}
      <instancedMesh
        ref={debrisMeshRef}
        args={[null as unknown as BufferGeometry, null as unknown as Material, DEBRIS_COUNT]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          roughness={0.4}
          metalness={0.8}
        />
      </instancedMesh>

      {/* Sparks Mesh (glowing pieces) */}
      <instancedMesh
        ref={sparkMeshRef}
        args={[null as unknown as BufferGeometry, null as unknown as Material, SPARK_COUNT]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          emissive={new Color(color)}
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.1}
        />
      </instancedMesh>
    </group>
  );
};

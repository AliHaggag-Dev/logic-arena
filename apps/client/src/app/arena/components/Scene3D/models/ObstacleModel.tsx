"use client";
import React, { memo, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ObstacleModelProps } from "../../../types";

/**
 * ObstacleModel — 3D visual for each obstacle pillar.
 *
 * SOLID  : Tall blue box — impassable wall.
 *          Dark blue body + strong #4444FF emissive. Static (no animation).
 *
 * TRAP   : Flat pulsing disc — slowdown zone (Pulse Blue).
 *          Deep purple + #6600FF emissive, slow counter-clockwise rotation
 *          and sinusoidal pulse to signal "danger but passable".
 *
 * LAVA   : Low pulsing hexagonal platform — damage zone (Neon Red).
 *          Dark red + #FF2200 emissive. Fast aggressive pulse (0.4→1.5)
 *          signals active burning damage.
 */
export const ObstacleModel = memo(function ObstacleModel({ obstacle }: ObstacleModelProps) {
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

    const { x, z, w, h, rotationY } = useMemo(() => {
        const x = obstacle.position.x / 40 - 10;
        const z = obstacle.position.y / 40 - 7.5;
        const w = obstacle.width / 40;
        const h = obstacle.height / 40;
        const rotationY = typeof obstacle.rotation === "number" ? obstacle.rotation : 0;
        return { x, z, w, h, rotationY };
    }, [obstacle.height, obstacle.position.x, obstacle.position.y, obstacle.rotation, obstacle.width]);

    const geometry = useMemo(() => {
        switch (obstacle.type) {
            case "SOLID":
                // Tall imposing box — clearly impassable
                return new THREE.BoxGeometry(w, 0.7, h);

            case "TRAP": {
                // Flat spinning disc — slowdown zone
                const radius = Math.max(0.15, w / 2);
                return new THREE.CircleGeometry(radius, 32);
            }

            case "LAVA": {
                // Low hexagonal platform — damage zone
                const radius = Math.max(0.15, w / 2);
                return new THREE.CylinderGeometry(radius, radius * 1.15, 0.18, 6);
            }

            default:
                return new THREE.BoxGeometry(0.1, 0.1, 0.1);
        }
    }, [h, obstacle.type, w]);

    const material = useMemo(() => {
        switch (obstacle.type) {
            case "SOLID":
                return new THREE.MeshStandardMaterial({
                    color: "#0d0d2e",
                    emissive: "#4444FF",
                    emissiveIntensity: 0.55,
                    metalness: 0.95,
                    roughness: 0.08,
                });

            case "TRAP":
                // Pulse Blue — deep purple base, electric blue-violet emissive
                return new THREE.MeshStandardMaterial({
                    color: "#12003e",
                    emissive: "#6600FF",
                    emissiveIntensity: 0.8,
                    metalness: 0.6,
                    roughness: 0.3,
                    transparent: true,
                    opacity: 0.88,
                    side: THREE.DoubleSide,
                });

            case "LAVA":
                // Neon Red — aggressive damage signal
                return new THREE.MeshStandardMaterial({
                    color: "#3e0500",
                    emissive: "#FF2200",
                    emissiveIntensity: 0.9,
                    metalness: 0.85,
                    roughness: 0.2,
                });

            default:
                return new THREE.MeshStandardMaterial({ color: "#333333" });
        }
    }, [obstacle.type]);

    useEffect(() => {
        materialRef.current = material;
        return () => {
            geometry.dispose();
            material.dispose();
            materialRef.current = null;
        };
    }, [geometry, material]);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        const mat = materialRef.current;
        const group = groupRef.current;
        if (!mat) return;

        switch (obstacle.type) {
            case "SOLID":
                // Static — no animation. Walls don't pulse.
                break;

            case "TRAP":
                // Pulse Blue: slow sinusoidal intensity pulse (0.4 → 1.2)
                mat.emissiveIntensity = 0.8 + 0.4 * Math.sin(t * 1.8);
                // Slow counter-clockwise rotation — visually distinct from LAVA
                if (group) group.rotation.y -= 0.35 * delta;
                break;

            case "LAVA":
                // Neon Red: fast aggressive pulse (0.4 → 1.5)
                mat.emissiveIntensity = 0.95 + 0.55 * Math.sin(t * 4.5);
                break;
        }
    });

    // --- Render per obstacle type ---

    if (obstacle.type === "SOLID") {
        return (
            <group ref={groupRef} position={[x, 0.35, z]} rotation={[0, rotationY, 0]}>
                <mesh geometry={geometry} material={material} castShadow receiveShadow />
                <pointLight position={[0, 0.9, 0]} color="#4444FF" intensity={1.8} distance={3.5} />
            </group>
        );
    }

    if (obstacle.type === "TRAP") {
        return (
            // Flat disc lies on the floor — robot walks over it
            <group ref={groupRef} position={[x, 0.02, z]} rotation={[0, rotationY, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry} material={material} />
                <pointLight position={[0, 0.5, 0]} color="#6600FF" intensity={2.2} distance={4.5} />
            </group>
        );
    }

    if (obstacle.type === "LAVA") {
        return (
            <group ref={groupRef} position={[x, 0, z]} rotation={[0, rotationY, 0]}>
                <mesh position={[0, 0.09, 0]} geometry={geometry} material={material} />
                <pointLight position={[0, 0.6, 0]} color="#FF2200" intensity={2.8} distance={5} />
            </group>
        );
    }

    return null;
});
ObstacleModel.displayName = "ObstacleModel";
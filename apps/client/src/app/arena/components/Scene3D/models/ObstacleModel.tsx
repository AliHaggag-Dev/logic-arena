"use client";
import React, { memo, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ObstacleModelProps } from "../../../types";

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
            case "WALL":
                return new THREE.BoxGeometry(w, 0.6, h);
            case "TRAP": {
                const radius = Math.max(0.15, w / 2);
                return new THREE.CylinderGeometry(radius, radius * 1.2, 0.2, 6);
            }
            case "SLOW": {
                const radius = Math.max(0.15, w / 2);
                return new THREE.CircleGeometry(radius, 32);
            }
            case "BOUNCER": {
                const size = Math.max(0.12, w / 2);
                return new THREE.OctahedronGeometry(size);
            }
            default:
                return new THREE.BoxGeometry(0.1, 0.1, 0.1);
        }
    }, [h, obstacle.type, w]);

    const material = useMemo(() => {
        switch (obstacle.type) {
            case "WALL":
                return new THREE.MeshStandardMaterial({
                    color: "#1a1a3e",
                    emissive: "#4444FF",
                    emissiveIntensity: 0.5,
                    metalness: 0.9,
                    roughness: 0.1
                });
            case "TRAP":
                return new THREE.MeshStandardMaterial({
                    color: "#3e0000",
                    emissive: "#FF2200",
                    emissiveIntensity: 0.8,
                    metalness: 0.9,
                    roughness: 0.25
                });
            case "SLOW":
                return new THREE.MeshStandardMaterial({
                    color: "#1a003e",
                    emissive: "#AA00FF",
                    emissiveIntensity: 0.7,
                    metalness: 0.6,
                    roughness: 0.35,
                    transparent: true,
                    opacity: 0.85,
                    side: THREE.DoubleSide
                });
            case "BOUNCER":
                return new THREE.MeshStandardMaterial({
                    color: "#003e3e",
                    emissive: "#00FFFF",
                    emissiveIntensity: 1.2,
                    metalness: 0.7,
                    roughness: 0.2
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
        if (!mat) return;

        if (obstacle.type === "TRAP") {
            // 0.5 -> 1.2
            mat.emissiveIntensity = 0.85 + 0.35 * Math.sin(t * 3);
        }

        if (obstacle.type === "BOUNCER") {
            // 0.6 -> 2.0
            mat.emissiveIntensity = 1.3 + 0.7 * Math.sin(t * 5);
        }

        if (obstacle.type === "SLOW") {
            const group = groupRef.current;
            if (group) {
                group.rotation.y += 0.5 * delta;
            }
        }
    });

    if (obstacle.type === "WALL") {
        return (
            <group ref={groupRef} position={[x, 0.3, z]} rotation={[0, rotationY, 0]}>
                <mesh geometry={geometry} material={material} />
                <pointLight position={[0, 0.8, 0]} color="#4444FF" intensity={1.5} distance={3} />
            </group>
        );
    }

    if (obstacle.type === "TRAP") {
        return (
            <group ref={groupRef} position={[x, 0, z]} rotation={[0, rotationY, 0]}>
                <mesh position={[0, 0.1, 0]} geometry={geometry} material={material} />
                <pointLight position={[0, 0.55, 0]} color="#FF0000" intensity={2.0} distance={4} />
            </group>
        );
    }

    if (obstacle.type === "SLOW") {
        return (
            <group ref={groupRef} position={[x, 0.05, z]} rotation={[0, rotationY, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry} material={material} />
                <pointLight position={[0, 0.6, 0]} color="#AA00FF" intensity={1.8} distance={4} />
            </group>
        );
    }

    if (obstacle.type === "BOUNCER") {
        return (
            <group ref={groupRef} position={[x, 0, z]} rotation={[0, rotationY, 0]}>
                <mesh position={[0, 0.25, 0]} geometry={geometry} material={material} />
                <pointLight position={[0, 0.65, 0]} color="#00FFFF" intensity={2.5} distance={5} />
            </group>
        );
    }

    return null;
});
ObstacleModel.displayName = "ObstacleModel";

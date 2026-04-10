"use client";
import React, { memo, useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RobotState, RobotModelProps, HealthBarSpriteProps, FallbackRobotProps, RobotErrorBoundaryProps, RobotErrorBoundaryState } from "../../../types";
import { HIT_FLASH_DURATION } from "../sceneConstants";

export class RobotErrorBoundary extends React.Component<RobotErrorBoundaryProps, RobotErrorBoundaryState> {
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

export const FallbackRobot = ({ position, color }: FallbackRobotProps) => (
    <mesh position={position}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
);

export const HealthBarSprite = ({ health }: HealthBarSpriteProps) => {
    const canvas = useMemo(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 12;
        return canvas;
    }, []);

    const [texture] = useState(() => {
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        return tex;
    });
    const textureRef = useRef(texture);

    useEffect(() => {
        return () => {
            texture.dispose();
        };
    }, [texture]);

    useEffect(() => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#444";
        ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

        const ratio = Math.max(0, Math.min(1, health / 100));
        ctx.fillStyle = health > 30 ? "#00FF00" : "#FF0000";
        ctx.fillRect(1, 1, (canvas.width - 2) * ratio, canvas.height - 2);

        textureRef.current.needsUpdate = true;
    }, [canvas, health]);

    return (
        <sprite scale={[0.8, 0.12, 1]}>
            <spriteMaterial map={texture} transparent depthWrite={false} />
        </sprite>
    );
};

export const RobotModel = memo(({ position, color, health, velocity, rotation, hitTimestamp, spotted }: RobotModelProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const basePosition = useRef(new THREE.Vector3(...position));
    const hoverOffset = useRef(0);
    const thrusterMaterials = useRef<THREE.MeshStandardMaterial[]>([]);
    const bodyMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
    const headMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
    const baseColorRef = useRef(new THREE.Color(color));
    const tempColorRef = useRef(new THREE.Color());
    const flashWhite = useRef(new THREE.Color("#ffffff"));

    useEffect(() => {
        hoverOffset.current = Math.random() * Math.PI * 2;
    }, []);

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
        const flash = timeSinceHit < HIT_FLASH_DURATION ? 1 - timeSinceHit / HIT_FLASH_DURATION : 0;

        if (bodyMaterialRef.current) {
            tempColorRef.current.copy(baseColorRef.current).lerp(flashWhite.current, flash);
            bodyMaterialRef.current.color.copy(tempColorRef.current);
            bodyMaterialRef.current.emissive.copy(baseColorRef.current);
        }
        if (headMaterialRef.current) {
            tempColorRef.current.copy(baseColorRef.current).lerp(flashWhite.current, flash);
            headMaterialRef.current.color.copy(tempColorRef.current);
            headMaterialRef.current.emissive.copy(baseColorRef.current);
        }
    });

    const thrusterMaterialRef = (index: number) => (material: THREE.MeshStandardMaterial | null) => {
        if (material) {
            thrusterMaterials.current[index] = material;
        }
    };

    return (
        <group ref={groupRef}>
            <mesh position={[0, 0.35, 0]}>
                <boxGeometry args={[0.7, 0.4, 0.9]} />
                <meshStandardMaterial
                    ref={bodyMaterialRef}
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.4}
                    roughness={0.85}
                    metalness={0.05}
                />
            </mesh>

            <mesh position={[0, 0.7, 0]}>
                <sphereGeometry args={[0.22, 24, 24]} />
                <meshStandardMaterial
                    ref={headMaterialRef}
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.4}
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
                <meshStandardMaterial
                    ref={thrusterMaterialRef(0)}
                    color="#1a1a1a"
                    emissive="#00FFFF"
                    emissiveIntensity={0.3}
                />
            </mesh>
            <mesh position={[0.25, 0.05, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
                <meshStandardMaterial
                    ref={thrusterMaterialRef(1)}
                    color="#1a1a1a"
                    emissive="#00FFFF"
                    emissiveIntensity={0.3}
                />
            </mesh>
            <mesh position={[-0.25, 0.05, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
                <meshStandardMaterial
                    ref={thrusterMaterialRef(2)}
                    color="#1a1a1a"
                    emissive="#00FFFF"
                    emissiveIntensity={0.3}
                />
            </mesh>
            <mesh position={[0.25, 0.05, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
                <meshStandardMaterial
                    ref={thrusterMaterialRef(3)}
                    color="#1a1a1a"
                    emissive="#00FFFF"
                    emissiveIntensity={0.3}
                />
            </mesh>

            <pointLight position={[0, 0.4, 0]} intensity={3.0} distance={5} color={color} />
            <pointLight position={[0, -0.2, 0]} intensity={1.0} distance={4} color={color} />

            {spotted && (
                <Html distanceFactor={10} position={[0, 1.25, 0]} center>
                    <div
                        style={{
                            fontSize: "14px",
                            color: "#FF3B3B",
                            fontWeight: 700,
                            textShadow: "0 0 6px rgba(255, 59, 59, 0.8)"
                        }}
                    >
                        !
                    </div>
                </Html>
            )}

            <group position={[0, 1.0, 0]}>
                <HealthBarSprite health={health} />
            </group>
        </group>
    );
});
RobotModel.displayName = "RobotModel";
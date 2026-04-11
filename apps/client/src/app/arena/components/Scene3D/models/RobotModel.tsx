"use client";
import React, { memo, useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RobotModelProps, HealthBarSpriteProps, FallbackRobotProps, RobotErrorBoundaryProps, RobotErrorBoundaryState } from "../../../types";
import { HIT_FLASH_DURATION } from "../sceneConstants";

export class RobotErrorBoundary extends React.Component<RobotErrorBoundaryProps, RobotErrorBoundaryState> {
    state: RobotErrorBoundaryState = { hasError: false };
    static getDerivedStateFromError(): RobotErrorBoundaryState { return { hasError: true }; }
    componentDidCatch(): void { }
    render() {
        if (this.state.hasError) return this.props.fallback;
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
        const c = document.createElement("canvas");
        c.width = 64; c.height = 12;
        return c;
    }, []);

    const [texture] = useState(() => {
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        return tex;
    });
    const textureRef = useRef(texture);

    useEffect(() => () => { texture.dispose(); }, [texture]);

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

// Shared hook logic extracted into a render component
const RobotModelInner = memo(({ scene, position, color, health, velocity, rotation, hitTimestamp, spotted, scale }: RobotModelProps & { scene: THREE.Group; scale: number }) => {
    const groupRef = useRef<THREE.Group>(null);
    const targetPosition = useRef(new THREE.Vector3(...position));
    const basePosition = useRef(new THREE.Vector3(...position));
    const hoverOffset = useRef(0);
    const baseColorRef = useRef(new THREE.Color(color));
    const tempColorRef = useRef(new THREE.Color());
    const flashWhite = useRef(new THREE.Color("#ffffff"));

    const clonedScene = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                    mesh.material = mesh.material.map(m => {
                        const mat = (m as THREE.MeshStandardMaterial).clone();
                        mat.emissive.set(color);
                        mat.emissiveIntensity = 0.3;
                        return mat;
                    });
                } else {
                    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
                    mat.emissive.set(color);
                    mat.emissiveIntensity = 0.3;
                    mesh.material = mat;
                }
            }
        });
        return clone;
    }, [scene, color]);

    useEffect(() => { hoverOffset.current = Math.random() * Math.PI * 2; }, []);
    useEffect(() => { targetPosition.current.set(position[0], position[1], position[2]); }, [position]);
    useEffect(() => { baseColorRef.current.set(color); }, [color]);

    const resolveRotation = (value?: number) => {
        if (typeof value !== "number" || Number.isNaN(value)) return null;
        return Math.abs(value) > Math.PI * 2 ? THREE.MathUtils.degToRad(value) : value;
    };

    useFrame((state, delta) => {
        const group = groupRef.current;
        if (!group) return;

        const lerpFactor = 1 - Math.pow(0.01, delta * 10);
        basePosition.current.lerp(targetPosition.current, lerpFactor);

        const targetRotation = resolveRotation(rotation);
        if (targetRotation !== null) {
            const rotLerp = 1 - Math.pow(0.001, delta);
            group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotation, rotLerp);
        } else {
            const speed = Math.hypot(velocity.x, velocity.y);
            if (speed > 0.001) {
                const fallbackRotation = -Math.atan2(velocity.y, velocity.x);
                const rotLerp = 1 - Math.pow(0.001, delta);
                group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, fallbackRotation, rotLerp);
            }
        }

        const hover = Math.sin(state.clock.elapsedTime * 2 + hoverOffset.current) * 0.05;
        group.position.x = basePosition.current.x;
        group.position.y = basePosition.current.y + hover;
        group.position.z = basePosition.current.z;

        const now = performance.now() / 1000;
        const timeSinceHit = hitTimestamp ? now - hitTimestamp : Infinity;
        const flash = timeSinceHit < HIT_FLASH_DURATION ? 1 - timeSinceHit / HIT_FLASH_DURATION : 0;

        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                if (mat?.emissive) {
                    tempColorRef.current.copy(baseColorRef.current).lerp(flashWhite.current, flash);
                    mat.color.copy(tempColorRef.current);
                }
            }
        });
    });

    return (
        <group ref={groupRef}>
            <primitive object={clonedScene} scale={scale} />
            <pointLight position={[0, 0.4, 0]} intensity={3.0} distance={5} color={color} />
            <pointLight position={[0, -0.2, 0]} intensity={1.0} distance={4} color={color} />
            {spotted && (
                <Html distanceFactor={10} position={[0, 1.25, 0]} center>
                    <div style={{ fontSize: "14px", color: "#FF3B3B", fontWeight: 700, textShadow: "0 0 6px rgba(255, 59, 59, 0.8)" }}>!</div>
                </Html>
            )}
            <group position={[0, 2.0, 0]}>
                <HealthBarSprite health={health} />
            </group>
        </group>
    );
});
RobotModelInner.displayName = "RobotModelInner";

// Bot-1: Futuristic flying robot (cyan)
const Bot1Model = memo((props: RobotModelProps) => {
    const { scene } = useGLTF('/robot.glb');
    return <RobotModelInner {...props} scene={scene as unknown as THREE.Group} scale={2} />;
});
Bot1Model.displayName = "Bot1Model";

// Bot-2: Mech warrior robot (magenta)
const Bot2Model = memo((props: RobotModelProps) => {
    const { scene } = useGLTF('/robot2.glb');
    return <RobotModelInner {...props} scene={scene as unknown as THREE.Group} scale={0.8} />;
});
Bot2Model.displayName = "Bot2Model";

// Main export — picks correct model based on color
export const RobotModel = memo((props: RobotModelProps) => {
    const isCyan = props.color === '#e5e4e0' || props.color === '#00FFFF' || props.color === 'cyan';
    return isCyan ? <Bot1Model {...props} /> : <Bot2Model {...props} />;
});
RobotModel.displayName = "RobotModel";

useGLTF.preload('/robot.glb');
useGLTF.preload('/robot2.glb');
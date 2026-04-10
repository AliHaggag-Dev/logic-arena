"use client";
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BoundaryLineProps } from "../../../types";

export const BoundaryLine = ({ points }: BoundaryLineProps) => {
    const materialRef = useRef<THREE.LineBasicMaterial>(null);

    useFrame(state => {
        const pulse = 0.75 + 0.25 * Math.sin(state.clock.elapsedTime * 2);
        if (materialRef.current) {
            materialRef.current.opacity = pulse;
        }
    });

    return (
        <lineLoop>
            <bufferGeometry attach="geometry">
                <bufferAttribute
                    attach="attributes-position"
                    count={4}
                    itemSize={3}
                    args={[points, 3]}
                />
            </bufferGeometry>
            <lineBasicMaterial
                ref={materialRef}
                attach="material"
                color="#00FFFF"
                linewidth={2}
                transparent
                opacity={0.9}
            />
        </lineLoop>
    );
};

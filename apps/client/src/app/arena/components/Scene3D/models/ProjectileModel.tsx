"use client";
import React from "react";
import * as THREE from "three";
import { LaserModelProps } from "../../../types";

export const LaserModel = ({ position }: LaserModelProps) => (
    <mesh position={position}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#00FFFF" emissiveIntensity={10} toneMapped={false} />
    </mesh>
);

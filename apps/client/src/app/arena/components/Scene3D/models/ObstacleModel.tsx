"use client";
import React, { memo, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ObstacleState } from "../../../types";

const toSceneX = (x: number) => (x / 40) - 10;
const toSceneZ = (y: number) => (y / 40) - 7.5;

export const ObstaclesInstanced = memo(function ObstaclesInstanced({ obstacles }: { obstacles: ObstacleState[] }) {
    const solidMeshRef = useRef<THREE.InstancedMesh>(null);
    const trapMeshRef = useRef<THREE.InstancedMesh>(null);
    const lavaMeshRef = useRef<THREE.InstancedMesh>(null);
    const finishMeshRef = useRef<THREE.InstancedMesh>(null);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 }
    }), []);

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime;
    });

    const groups = useMemo(() => {
        const solid = obstacles.filter(o => o.type === "SOLID");
        const trap = obstacles.filter(o => o.type === "TRAP");
        const lava = obstacles.filter(o => o.type === "LAVA");
        const finish = obstacles.filter(o => o.type === "FINISH_LINE");
        return { solid, trap, lava, finish };
    }, [obstacles]);

    const solidGeo = useMemo(() => new THREE.BoxGeometry(1, 0.7, 1), []);
    const trapGeo = useMemo(() => new THREE.CircleGeometry(1, 32), []);
    const lavaGeo = useMemo(() => new THREE.CylinderGeometry(1, 1.15, 0.18, 6), []);
    const finishGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

    const solidMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: "#0d0d2e",
        emissive: "#4444FF",
        emissiveIntensity: 0.55,
        metalness: 0.95,
        roughness: 0.08,
    }), []);

    const trapMat = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({
            color: "#12003e",
            emissive: "#6600FF",
            metalness: 0.6,
            roughness: 0.3,
            transparent: true,
            opacity: 0.88,
            side: THREE.DoubleSide,
        });
        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = uniforms.uTime;
            shader.fragmentShader = shader.fragmentShader.replace(
                'void main() {',
                'uniform float uTime;\nvoid main() {'
            ).replace(
                '#include <emissivemap_fragment>',
                `
                #include <emissivemap_fragment>
                float pulse = 0.8 + 0.4 * sin(uTime * 1.8);
                totalEmissiveRadiance *= pulse;
                `
            );
        };
        return mat;
    }, [uniforms]);

    const lavaMat = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({
            color: "#3e0500",
            emissive: "#FF2200",
            metalness: 0.85,
            roughness: 0.2,
        });
        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = uniforms.uTime;
            shader.fragmentShader = shader.fragmentShader.replace(
                'void main() {',
                'uniform float uTime;\nvoid main() {'
            ).replace(
                '#include <emissivemap_fragment>',
                `
                #include <emissivemap_fragment>
                float pulse = 0.95 + 0.55 * sin(uTime * 4.5);
                totalEmissiveRadiance *= pulse;
                `
            );
        };
        return mat;
    }, [uniforms]);

    const finishMat = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({
            color: "#00ff00",
            emissive: "#00ff00",
            metalness: 0.2,
            roughness: 0.8,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
        });
        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = uniforms.uTime;
            shader.fragmentShader = shader.fragmentShader.replace(
                'void main() {',
                'uniform float uTime;\nvoid main() {'
            ).replace(
                '#include <emissivemap_fragment>',
                `
                #include <emissivemap_fragment>
                float pulse = 0.6 + 0.3 * sin(uTime * 3.0);
                totalEmissiveRadiance *= pulse;
                `
            );
        };
        return mat;
    }, [uniforms]);

    useEffect(() => {
        return () => {
            solidGeo.dispose(); trapGeo.dispose(); lavaGeo.dispose(); finishGeo.dispose();
            solidMat.dispose(); trapMat.dispose(); lavaMat.dispose(); finishMat.dispose();
        };
    }, [solidGeo, trapGeo, lavaGeo, finishGeo, solidMat, trapMat, lavaMat, finishMat]);

    useEffect(() => {
        const dummy = new THREE.Object3D();

        const updateInstances = (mesh: THREE.InstancedMesh | null, arr: ObstacleState[], yOffset: number, rotX: number) => {
            if (!mesh) return;
            arr.forEach((obs, i) => {
                const w = obs.width / 40;
                const h = obs.height / 40;
                const x = toSceneX(obs.position.x);
                const z = toSceneZ(obs.position.y);
                const rotationY = typeof obs.rotation === "number" ? obs.rotation : 0;
                
                dummy.position.set(x, yOffset, z);
                
                // First apply heading (Y), then tilt flat (X)
                dummy.rotation.set(0, rotationY, 0);
                if (rotX !== 0) {
                    dummy.rotateX(rotX);
                }
                
                if (obs.type === "SOLID" || obs.type === "FINISH_LINE") {
                    dummy.scale.set(w, 1, h);
                } else if (obs.type === "TRAP" || obs.type === "LAVA") {
                    const radius = Math.max(0.15, w / 2);
                    dummy.scale.set(radius, 1, radius);
                }
                
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            });
            mesh.instanceMatrix.needsUpdate = true;
        };

        updateInstances(solidMeshRef.current, groups.solid, 0.35, 0);
        updateInstances(trapMeshRef.current, groups.trap, 0.02, -Math.PI / 2);
        updateInstances(lavaMeshRef.current, groups.lava, 0.09, 0);
        updateInstances(finishMeshRef.current, groups.finish, 0.03, -Math.PI / 2);
    }, [groups]);

    return (
        <group>
            {groups.solid.length > 0 && <instancedMesh ref={solidMeshRef} args={[solidGeo, solidMat, groups.solid.length]} castShadow receiveShadow />}
            {groups.trap.length > 0 && <instancedMesh ref={trapMeshRef} args={[trapGeo, trapMat, groups.trap.length]} />}
            {groups.lava.length > 0 && <instancedMesh ref={lavaMeshRef} args={[lavaGeo, lavaMat, groups.lava.length]} />}
            {groups.finish.length > 0 && <instancedMesh ref={finishMeshRef} args={[finishGeo, finishMat, groups.finish.length]} receiveShadow />}
        </group>
    );
});
ObstaclesInstanced.displayName = "ObstaclesInstanced";
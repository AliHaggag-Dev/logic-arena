"use client";
import React, { memo, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ObstacleState, MapTheme } from "../../../types";

const toSceneX = (x: number) => (x / 40) - 10;
const toSceneZ = (y: number) => (y / 40) - 7.5;

const EmpStrikeModel = ({ obstacle }: { obstacle: ObstacleState }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
    const startTimeRef = useRef<number | null>(null);
    const radius = Math.max(0.15, obstacle.width / 80);

    useFrame((state) => {
        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
        }
        const elapsed = state.clock.elapsedTime - startTimeRef.current;
        const blink = Math.abs(Math.sin(state.clock.elapsedTime * 16));
        const scale = radius * (1 + elapsed * 0.35 + blink * 0.25);

        if (meshRef.current) {
            meshRef.current.scale.setScalar(scale);
        }
        if (materialRef.current) {
            materialRef.current.emissiveIntensity = 1.2 + blink * 3.5;
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={[toSceneX(obstacle.position.x), 0.45, toSceneZ(obstacle.position.y)]}
            castShadow
        >
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
                ref={materialRef}
                color="#f8f7ff"
                emissive="#a855f7"
                emissiveIntensity={2}
                roughness={0.12}
                metalness={0.2}
                transparent
                opacity={0.82}
            />
        </mesh>
    );
};

export const ObstaclesInstanced = memo(function ObstaclesInstanced({ obstacles, mapTheme = 'CYBER' }: { obstacles: ObstacleState[], mapTheme?: MapTheme }) {
    const solidMeshRef = useRef<THREE.InstancedMesh>(null);
    const trapMeshRef = useRef<THREE.InstancedMesh>(null);
    const lavaMeshRef = useRef<THREE.InstancedMesh>(null);
    const finishMeshRef = useRef<THREE.InstancedMesh>(null);
    const mineMeshRef = useRef<THREE.InstancedMesh>(null);
    const lavaPoolMeshRef = useRef<THREE.InstancedMesh>(null);
    const icePatchMeshRef = useRef<THREE.InstancedMesh>(null);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 }
    }), []);

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime;
    });

    const groups = useMemo(() => {
        const solid = obstacles.filter(o => o.type === "SOLID");
        const trap = mapTheme === 'CYBER' ? obstacles.filter(o => o.type === "TRAP") : [];
        const lava = mapTheme === 'CYBER' ? obstacles.filter(o => o.type === "LAVA") : [];
        const finish = obstacles.filter(o => o.type === "FINISH_LINE");
        const mine = obstacles.filter(o => o.type === "MINE");
        const lavaPool = obstacles.filter(o => o.type === "LAVA_POOL");
        const icePatch = obstacles.filter(o => o.type === "ICE_PATCH");
        const empStrike = obstacles.filter(o => o.type === "EMP_STRIKE");
        return { solid, trap, lava, finish, mine, lavaPool, icePatch, empStrike };
    }, [obstacles, mapTheme]);

    const solidGeo = useMemo(() => new THREE.BoxGeometry(1, 0.7, 1), []);
    const trapGeo = useMemo(() => new THREE.CircleGeometry(1, 32), []);
    const lavaGeo = useMemo(() => new THREE.CylinderGeometry(1, 1.15, 0.18, 6), []);
    const finishGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
    const mineGeo = useMemo(() => new THREE.CylinderGeometry(1, 0.75, 0.16, 12), []);
    const lavaPoolGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 0.1, 32), []);
    const icePatchGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 0.08, 32), []);

    const solidMat = useMemo(() => {
        if (mapTheme === 'LAVA') {
            return new THREE.MeshStandardMaterial({
                color: "#050505",
                emissive: "#2a0500",
                emissiveIntensity: 0.8,
                metalness: 0.8,
                roughness: 0.4,
            });
        }
        if (mapTheme === 'ICE') {
            return new THREE.MeshPhysicalMaterial({
                color: "#e0f7fa",
                emissive: "#0088ff",
                emissiveIntensity: 0.2,
                metalness: 0.1,
                roughness: 0.1,
                transmission: 0.8,
                transparent: true,
                opacity: 0.8,
            });
        }
        return new THREE.MeshStandardMaterial({
            color: "#0d0d2e",
            emissive: "#4444FF",
            emissiveIntensity: 0.55,
            metalness: 0.95,
            roughness: 0.08,
        });
    }, [mapTheme]);

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

    const mineMat = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({
            color: "#2a0000",
            emissive: "#ff0000",
            metalness: 0.75,
            roughness: 0.18,
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
                float blink = step(0.35, abs(sin(uTime * 7.0)));
                totalEmissiveRadiance *= 0.35 + blink * 1.4;
                `
            );
        };
        return mat;
    }, [uniforms]);

    const lavaPoolMat = useMemo(() => {
        const mat = new THREE.MeshPhysicalMaterial({
            color: "#ff6a00",
            emissive: "#ff5500",
            emissiveIntensity: 1.7,
            roughness: 0.18,
            metalness: 0.1,
            transmission: 0.5,
            transparent: true,
            opacity: 0.92,
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
                float pulse = 1.0 + 0.55 * sin(uTime * 5.0);
                totalEmissiveRadiance *= pulse;
                `
            );
        };
        return mat;
    }, [uniforms]);

    const icePatchMat = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: "#bfefff",
        emissive: "#38bdf8",
        emissiveIntensity: 0.35,
        metalness: 0.05,
        roughness: 0.03,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        transmission: 0.35,
        transparent: true,
        opacity: 0.62,
    }), []);

    useEffect(() => {
        return () => {
            solidGeo.dispose(); trapGeo.dispose(); lavaGeo.dispose(); finishGeo.dispose(); mineGeo.dispose(); lavaPoolGeo.dispose(); icePatchGeo.dispose();
            solidMat.dispose(); trapMat.dispose(); lavaMat.dispose(); finishMat.dispose(); mineMat.dispose(); lavaPoolMat.dispose(); icePatchMat.dispose();
        };
    }, [solidGeo, trapGeo, lavaGeo, finishGeo, mineGeo, lavaPoolGeo, icePatchGeo, solidMat, trapMat, lavaMat, finishMat, mineMat, lavaPoolMat, icePatchMat]);

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
                } else if (
                    obs.type === "TRAP" ||
                    obs.type === "LAVA" ||
                    obs.type === "MINE" ||
                    obs.type === "LAVA_POOL" ||
                    obs.type === "ICE_PATCH"
                ) {
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
        updateInstances(mineMeshRef.current, groups.mine, 0.08, 0);
        updateInstances(lavaPoolMeshRef.current, groups.lavaPool, 0.05, 0);
        updateInstances(icePatchMeshRef.current, groups.icePatch, 0.04, 0);
    }, [groups]);

    return (
        <group>
            {groups.solid.length > 0 && <instancedMesh ref={solidMeshRef} args={[solidGeo, solidMat, groups.solid.length]} castShadow receiveShadow />}
            {groups.trap.length > 0 && <instancedMesh ref={trapMeshRef} args={[trapGeo, trapMat, groups.trap.length]} />}
            {groups.lava.length > 0 && <instancedMesh ref={lavaMeshRef} args={[lavaGeo, lavaMat, groups.lava.length]} />}
            {groups.finish.length > 0 && <instancedMesh ref={finishMeshRef} args={[finishGeo, finishMat, groups.finish.length]} receiveShadow />}
            {groups.mine.length > 0 && <instancedMesh ref={mineMeshRef} args={[mineGeo, mineMat, groups.mine.length]} castShadow />}
            {groups.lavaPool.length > 0 && <instancedMesh ref={lavaPoolMeshRef} args={[lavaPoolGeo, lavaPoolMat, groups.lavaPool.length]} receiveShadow />}
            {groups.icePatch.length > 0 && <instancedMesh ref={icePatchMeshRef} args={[icePatchGeo, icePatchMat, groups.icePatch.length]} receiveShadow />}
            {groups.empStrike.map((obstacle) => (
                <EmpStrikeModel key={obstacle.id} obstacle={obstacle} />
            ))}
        </group>
    );
});
ObstaclesInstanced.displayName = "ObstaclesInstanced";

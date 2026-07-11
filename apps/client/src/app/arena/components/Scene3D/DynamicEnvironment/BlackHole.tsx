import React, { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import {
  Group,
  InstancedMesh,
  Object3D,
  Vector3,
  Color,
  AdditiveBlending,
  DoubleSide,
  BufferGeometry,
  Material
} from "three";
import { AmbientSynthesizer } from "./AmbientSynthesizer";

const DISK_VERT = `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISK_FRAG = `
  uniform vec3 colorIn;
  uniform vec3 colorOut;
  uniform float minR;
  uniform float maxR;
  uniform float mult;
  uniform float uLensing;
  varying vec2 vPos;

  void main() {
    float dist = length(vPos);
    float theta = atan(vPos.y, vPos.x);

    if (dist < minR || dist > maxR) {
      discard;
    }
    
    float t = (dist - minR) / (maxR - minR);
    
    // Smooth exponential decay for a soft, smoky blending zone
    float alpha = pow(1.0 - t, 2.5) * mult;
    
    // Apply brightness distribution for the lensing halo
    if (uLensing > 0.5) {
      float verticalGlow = sin(theta);
      float brightness = 1.0;
      if (vPos.y > 0.0) {
        brightness = mix(0.7, 1.4, verticalGlow); // Luminous upper arc
      } else {
        brightness = mix(0.7, 0.35, -verticalGlow); // Dimmer mirrored lower arc
      }
      alpha *= brightness;
    }

    // Smooth blending from hot white-gold to soft cream-gold
    vec3 color = mix(colorIn, colorOut, t);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

interface GlowingDiskProps {
  minRadius: number;
  maxRadius: number;
  opacityMultiplier?: number;
  rot?: [number, number, number];
  colorIn?: Vector3;
  colorOut?: Vector3;
  isLensing?: boolean;
}

const GlowingDisk = ({
  minRadius,
  maxRadius,
  opacityMultiplier = 1,
  rot = [0, 0, 0],
  colorIn = new Vector3(1.0, 0.99, 0.94),
  colorOut = new Vector3(0.95, 0.70, 0.35),
  isLensing = false
}: GlowingDiskProps) => {
  const uniforms = useRef({
    colorIn: { value: colorIn },
    colorOut: { value: colorOut },
    minR: { value: minRadius },
    maxR: { value: maxRadius },
    mult: { value: opacityMultiplier },
    uLensing: { value: isLensing ? 1.0 : 0.0 }
  });

  useLayoutEffect(() => {
    uniforms.current.colorIn.value = colorIn;
    uniforms.current.colorOut.value = colorOut;
    uniforms.current.minR.value = minRadius;
    uniforms.current.maxR.value = maxRadius;
    uniforms.current.mult.value = opacityMultiplier;
    uniforms.current.uLensing.value = isLensing ? 1.0 : 0.0;
  }, [colorIn, colorOut, minRadius, maxRadius, opacityMultiplier, isLensing]);

  return (
    <mesh rotation={rot}>
      <ringGeometry args={[minRadius, maxRadius, 64]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        uniforms={uniforms.current}
        vertexShader={DISK_VERT}
        fragmentShader={DISK_FRAG}
      />
    </mesh>
  );
};

interface OrbitControlsLike {
  target: Vector3;
  update: () => void;
}

interface BlackHoleProps {
  position: [number, number, number];
  scale?: number;
}

export const BlackHole = ({ position, scale = 1 }: BlackHoleProps) => {
  const ringsRef = useRef<Group>(null);
  const count = 60;
  const debrisMeshRef = useRef<InstancedMesh>(null);
  const _dummy = useMemo(() => new Object3D(), []);
  
  const bhPosition = useMemo(() => new Vector3(...position), [position]);

  const debrisData = useMemo(() => [...Array(count)].map(() => {
    const rand = Math.random();
    const colorVal = rand > 0.6 
      ? "#ffffff" // white hot
      : rand > 0.3 
        ? "#ffd488" // soft cream-gold
        : "#442205"; // dark warm dust
    return {
      pos: new Vector3(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 150
      ),
      resetPos: new Vector3(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 150
      ),
      color: new Color(colorVal),
      scale: 0.25 + Math.random() * 0.8
    };
  }), []);

  useLayoutEffect(() => {
    if (!debrisMeshRef.current) return;
    debrisData.forEach((d, i) => debrisMeshRef.current!.setColorAt(i, d.color));
    debrisMeshRef.current.instanceColor!.needsUpdate = true;
  }, [debrisData]);

  useFrame((state, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z -= delta * 0.2;
    }

    // Camera gravitational pull — slow, majestic creep
    const cam = state.camera;
    const distToCam = cam.position.distanceTo(bhPosition);
    const INFLUENCE_RADIUS = 220;

    if (distToCam < INFLUENCE_RADIUS) {
      const forceFactor = Math.pow(1 - distToCam / INFLUENCE_RADIUS, 2.0);
      const pullSpeed = 3.5 * forceFactor * delta; // Slower, majestic pull speed

      // Lerp camera position closer to the singularity
      cam.position.lerp(bhPosition, pullSpeed * 0.45);

      // Traverses the scene graph to find and update OrbitControls target
      let foundControls: OrbitControlsLike | null = null;
      state.scene.traverse((child) => {
        const c = child as unknown as Record<string, unknown>;
        if (
          c.isOrbitControls === true ||
          (c.target instanceof Vector3 && typeof c.update === "function")
        ) {
          foundControls = child as unknown as OrbitControlsLike;
        }
      });

      if (foundControls) {
        const activeControls = foundControls as OrbitControlsLike;
        activeControls.target.lerp(bhPosition, pullSpeed);
        activeControls.update();
      }
    }
    
    if (debrisMeshRef.current) {
      debrisMeshRef.current.rotation.y -= delta * 0.2;
      
      debrisData.forEach((d, i) => {
        const distSq = d.pos.lengthSq();
        if (distSq < 225) {
          d.pos.copy(d.resetPos);
        } else {
          const dist = Math.sqrt(distSq);
          const speed = 250 / (dist + 1);
          d.pos.multiplyScalar(1 - delta * speed * 0.01);
          
          const s = Math.max(0.01, dist / 150) * d.scale;
          _dummy.position.copy(d.pos);
          _dummy.scale.setScalar(s);
          _dummy.updateMatrix();
          debrisMeshRef.current!.setMatrixAt(i, _dummy.matrix);
        }
      });
      debrisMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Event Horizon (Pure Black Sphere) */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[15, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Gravitational Lensing Halo (Billboarded to frame the black hole from any camera angle) */}
      <Billboard>
        {/* Inner Lensing Ring (Photon Ring with primary/secondary Gravitational Lensing warp) */}
        <GlowingDisk
          minRadius={15}
          maxRadius={32}
          opacityMultiplier={0.85}
          colorIn={new Vector3(1.0, 1.0, 0.98)}
          colorOut={new Vector3(0.85, 0.55, 0.18)}
          isLensing={true}
        />
      </Billboard>

      {/* Main Equatorial Accretion Disk (Slightly tilted) */}
      <group ref={ringsRef} rotation={[0.2, 0, -0.1]}>
        {/* Inner Bright White-Gold Ring (Photon Ring - thick & saturated across the center) */}
        <GlowingDisk
          minRadius={15.0}
          maxRadius={32.0}
          opacityMultiplier={0.95}
          rot={[-Math.PI / 2, 0, 0]}
          colorIn={new Vector3(1.0, 1.0, 1.0)}
          colorOut={new Vector3(1.0, 0.88, 0.55)}
        />
        {/* Wide Soft Accretion Disk */}
        <GlowingDisk
          minRadius={15.5}
          maxRadius={50.0}
          opacityMultiplier={0.8}
          rot={[-Math.PI / 2, 0, 0]}
          colorIn={new Vector3(1.0, 0.92, 0.70)}
          colorOut={new Vector3(0.40, 0.15, 0.01)}
        />
      </group>

      {/* Matter/Debris getting sucked in */}
      <instancedMesh ref={debrisMeshRef} args={[undefined as unknown as BufferGeometry, undefined as unknown as Material, count]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshBasicMaterial transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </group>
  );
};
export default BlackHole;

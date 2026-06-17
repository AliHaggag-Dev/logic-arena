'use client';
import React, { useMemo, useRef, useEffect } from 'react';
import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, ShaderMaterial, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { FovConeProps } from '../../../types';
import { interpolationBuffer } from '../../../core/interpolation-buffer';

const DEG_TO_RAD   = Math.PI / 180;
const ARENA_SCALE  = 40; // engine units → 3D units

/**
 * FovCone — fan-shaped semi-transparent mesh visualising a robot's Field of View.
 *
 * Geometry: custom BufferGeometry fan built from the FOV config.
 * Color: matches robot team color at ~15% opacity.
 * Rotates to track fovDirection each frame via ref mutation (zero re-renders).
 */
export const FovCone = ({ position, color, fov, fovDirection, robotId }: FovConeProps) => {
  const groupRef    = useRef<Group>(null);
  const dirRef      = useRef(fovDirection);
  const targetPosition = useRef(new Vector3(...position));
  const basePosition = useRef(new Vector3(...position));

  const SNAP_DISTANCE = 3;
  const POSITION_LERP_DECAY = 0.01;
  const POSITION_LERP_SPEED = 10;

  // Keep dirRef in sync when prop changes (R3F doesn't re-render every frame)
  dirRef.current = fovDirection;

  const geometry = useMemo(() => {
    const halfAngle  = (fov.angle / 2) * DEG_TO_RAD;
    const rangeUnits = fov.range / ARENA_SCALE;
    const segments   = Math.max(32, Math.round(fov.angle / 2)); // High-res curve

    const positions: number[] = [0, 0, 0]; // center vertex
    const uvs: number[] = [0.5, 0];

    for (let i = 0; i <= segments; i++) {
        const t     = i / segments;
        const angle = -halfAngle + t * fov.angle * DEG_TO_RAD;
        // Fan along +Z axis (GLTF robot "forward" direction) so the cone
        // aligns with the robot body when both use rotation.y = -fovDirection.
        positions.push(
          Math.sin(angle) * rangeUnits,  // X (side)
          0,
          Math.cos(angle) * rangeUnits,  // Z (forward)
        );
        uvs.push(t, 1);
    }

    const indices: number[] = [];
    for (let i = 1; i <= segments; i++) {
        indices.push(0, i, i + 1);
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [fov.angle, fov.range]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
        uniforms: {
          uColor: { value: new Color(color) },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uTime;
          varying vec2 vUv;

          void main() {
            // Edge soft boundary to prevent hard cutoff
            float edgeSoft = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x);
            
            // Intense side edges
            float sideEdges = (1.0 - smoothstep(0.0, 0.04, vUv.x)) + smoothstep(0.96, 1.0, vUv.x);
            sideEdges *= exp(-vUv.y * 2.0); // Fades out over distance
            
            // Core origin brightness
            float core = exp(-vUv.y * 8.0) * (0.7 + 0.3 * sin(uTime * 6.0));
            
            // Radar pulse waves
            float wave = fract(vUv.y * 6.0 - uTime * 1.5);
            wave = smoothstep(0.8, 1.0, wave) * exp(-vUv.y * 2.0);
            
            // Sharp outer rim arc
            float rim = smoothstep(0.95, 0.97, vUv.y) * smoothstep(1.0, 0.98, vUv.y);
            
            // Background fill gradient
            float fill = (1.0 - vUv.y) * 0.1;
            
            float intensity = (fill + wave * 0.4 + core + rim * 0.8 + sideEdges * 0.6) * edgeSoft * 0.8;
            
            vec3 glowColor = uColor + (rim * 0.5 + core * 0.5);

            gl_FragColor = vec4(glowColor, intensity);
          }
        `,
      }),
    [color]
  );

  // Dispose GPU resources when component unmounts to prevent memory leak
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Update rotation and inject time each frame via ref mutations
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    const interp = robotId ? interpolationBuffer.getInterpolatedRobot(robotId) : null;
    
    if (interp) {
      targetPosition.current.set(
        (interp.position.x / ARENA_SCALE) - 10,
        0.15,
        (interp.position.y / ARENA_SCALE) - 7.5,
      );
      dirRef.current = interp.fovDirection ?? interp.rotation ?? 0;
    } else {
      targetPosition.current.set(...position);
      dirRef.current = fovDirection;
    }

    // Smooth position lerping to sync with robot model
    const lerpFactor = 1 - Math.pow(POSITION_LERP_DECAY, delta * POSITION_LERP_SPEED);
    if (basePosition.current.distanceTo(targetPosition.current) > SNAP_DISTANCE) {
      basePosition.current.copy(targetPosition.current);
    } else {
      basePosition.current.lerp(targetPosition.current, lerpFactor);
    }
    
    groupRef.current.position.copy(basePosition.current);

    // fovDirection is in standard 2D radians (CCW from +X).
    // The robot body (GLTF) uses rotation.y = Math.PI/2 - fovDirection to map that to Three.js XZ plane,
    // so the cone must use the exact same formula to stay visually attached to the robot face.
    groupRef.current.rotation.y = Math.PI / 2 - dirRef.current;
    
    // Update shader time for animations
    if (material.uniforms) {
      material.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
};

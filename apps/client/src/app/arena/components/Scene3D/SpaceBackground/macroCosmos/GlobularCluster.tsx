import React, { useMemo, useEffect } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  ShaderMaterial,
  AdditiveBlending,
  DoubleSide,
  Color,
} from "three";
import { Billboard } from "@react-three/drei";
import {
  GLOBULAR_CLUSTER_POSITION,
  GLOBULAR_CLUSTER_RADIUS,
  GLOBULAR_STAR_COUNT,
} from "./constants";
import {
  GLOBULAR_POINTS_VERT,
  GLOBULAR_POINTS_FRAG,
  GLOBULAR_HAZE_VERT,
  GLOBULAR_HAZE_FRAG,
} from "./shaders";
import { MacroUniforms } from "./types";

interface GlobularClusterProps {
  uniforms: MacroUniforms;
}

export const GlobularCluster: React.FC<GlobularClusterProps> = ({ uniforms }) => {
  // Generate authentic Plummer Potential (M13 Hercules Cluster) distribution
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const count = GLOBULAR_STAR_COUNT;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const dists = new Float32Array(count);

    const scaleRadius = 95.0; // Plummer core scale length
    const maxRadius = GLOBULAR_CLUSTER_RADIUS;

    // Population II Spectral Types
    const colWarmWhite = new Color("#fff6e5");
    const colAmberGold = new Color("#ffb347");
    const colRedGiant = new Color("#ff6333");
    const colBlueStraggler = new Color("#6ec5ff");

    for (let i = 0; i < count; i++) {
      // 1. Plummer Potential radial sampling
      const u = Math.random() * 0.99 + 0.005;
      const r = scaleRadius / Math.sqrt(Math.pow(u, -2 / 3) - 1);

      // 12% - 15% of stars form an extended, diffuse irregular halo tail
      const isHaloTail = Math.random() < 0.14;
      let finalR: number;

      if (isHaloTail) {
        // Diffuse outward between 0.82 * maxRadius and 1.65 * maxRadius with power-law decay
        const t = Math.pow(Math.random(), 2.2);
        finalR = maxRadius * (0.82 + t * 0.83);
      } else {
        // Core & intermediate Plummer stars: soft mapping if r > maxRadius (NO hard clamping ring!)
        if (r > maxRadius) {
          finalR = maxRadius * (0.74 + Math.random() * 0.25);
        } else {
          finalR = r;
        }
      }

      // 2. Uniform spherical direction with subtle irregular dispersion for halo stars
      const cosTheta = Math.random() * 2 - 1;
      const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
      const phi = Math.random() * Math.PI * 2;

      let dirX = sinTheta * Math.cos(phi);
      let dirY = sinTheta * Math.sin(phi);
      let dirZ = cosTheta;

      if (isHaloTail) {
        // Natural irregular tidal elongation so cluster doesn't appear as a rigid cut circle
        dirX *= 1.0 + (Math.random() - 0.5) * 0.36;
        dirY *= 1.0 + (Math.random() - 0.5) * 0.36;
        dirZ *= 1.0 + (Math.random() - 0.5) * 0.36;
      }

      positions[i * 3] = finalR * dirX;
      positions[i * 3 + 1] = finalR * dirY;
      positions[i * 3 + 2] = finalR * dirZ;

      // Normalized distance for shader core attenuation
      dists[i] = Math.min(1.0, finalR / (maxRadius * 1.65));

      // 3. Astronomical Population II color distribution
      const pColor = Math.random();
      let starColor: Color;

      // ~5% Blue Stragglers preferentially in/near the dense core
      if (pColor < 0.055 && dists[i] < 0.45) {
        starColor = colBlueStraggler;
        sizes[i] = 16.0 + Math.random() * 12.0;
      } else if (pColor < 0.65) {
        // 60% ancient warm-white/cream solar-type stars
        starColor = colWarmWhite;
        sizes[i] = 14.0 + Math.random() * 10.0;
      } else if (pColor < 0.90) {
        // 25% amber/orange K-giants
        starColor = colAmberGold;
        sizes[i] = 18.0 + Math.random() * 12.0;
      } else {
        // 10% luminous red M-giants
        starColor = colRedGiant;
        sizes[i] = 22.0 + Math.random() * 14.0;
      }

      colors[i * 3] = starColor.r;
      colors[i * 3 + 1] = starColor.g;
      colors[i * 3 + 2] = starColor.b;
    }

    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new Float32BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new Float32BufferAttribute(sizes, 1));
    geo.setAttribute("aDist", new Float32BufferAttribute(dists, 1));

    return geo;
  }, []);

  // Material for Points with Gaussian Soft Point Sprite & Core Attenuation
  const pointsMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: GLOBULAR_POINTS_VERT,
      fragmentShader: GLOBULAR_POINTS_FRAG,
      uniforms: {
        uZoom: uniforms.uZoom,
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
  }, [uniforms]);

  // Unresolved Core Stellar Haze (reproducing millions of sub-resolution stars)
  const hazeMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: GLOBULAR_HAZE_VERT,
      fragmentShader: GLOBULAR_HAZE_FRAG,
      uniforms: {
        uZoom: uniforms.uZoom,
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
  }, [uniforms]);

  // Cleanup WebGL resources
  useEffect(() => {
    return () => {
      geometry.dispose();
      pointsMaterial.dispose();
      hazeMaterial.dispose();
    };
  }, [geometry, pointsMaterial, hazeMaterial]);

  return (
    <group position={GLOBULAR_CLUSTER_POSITION}>
      {/* 1. Unresolved Dense Core Haze */}
      <Billboard>
        <mesh material={hazeMaterial}>
          <planeGeometry args={[GLOBULAR_CLUSTER_RADIUS * 1.8, GLOBULAR_CLUSTER_RADIUS * 1.8, 1, 1]} />
        </mesh>
      </Billboard>

      {/* 2. 3,400 Discrete Plummer Stars (Single Draw Call Points) */}
      <points geometry={geometry} material={pointsMaterial} />
    </group>
  );
};

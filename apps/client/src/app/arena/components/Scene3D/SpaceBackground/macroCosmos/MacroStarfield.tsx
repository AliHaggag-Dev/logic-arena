import React, { useMemo, useEffect } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  ShaderMaterial,
  AdditiveBlending,
  Color,
} from "three";
import { MacroUniforms } from "./types";

interface MacroStarfieldProps {
  uniforms: MacroUniforms;
  graphicsQuality?: string;
}

const MACRO_STARFIELD_VERT = `
  attribute float aSize;
  attribute float aBrightness;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uZoom;

  varying vec3 vColor;
  varying float vBrightness;

  void main() {
    vColor = aColor;

    // Organic micro-twinkling on GPU
    float twinkle = 1.0 + sin(uTime * 2.2 + position.x * 0.08) * 0.18;
    vBrightness = aBrightness * twinkle * uZoom;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    gl_PointSize = aSize * (350.0 / -mvPosition.z);
  }
`;

const MACRO_STARFIELD_FRAG = `
  varying vec3 vColor;
  varying float vBrightness;

  void main() {
    if (vBrightness <= 0.005) discard;

    vec2 coord = gl_PointCoord - vec2(0.5);
    float r = length(coord);
    if (r > 0.5) discard;

    // Soft Gaussian Circular Point Sprite (anti-aliased circular bloom)
    float edge = smoothstep(0.5, 0.08, r);
    float core = exp(-r * r * 16.0);
    float intensity = (edge * 0.35 + core * 0.95) * vBrightness;

    float alpha = edge * min(1.0, vBrightness);
    if (alpha <= 0.002) discard;

    gl_FragColor = vec4(vColor * intensity, alpha);
  }
`;

export const MacroStarfield: React.FC<MacroStarfieldProps> = ({
  uniforms,
  graphicsQuality = "medium",
}) => {
  const count = graphicsQuality === "high" ? 800 : graphicsQuality === "low" ? 250 : 500;

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brightnesses = new Float32Array(count);

    const colWarmWhite = new Color("#fff4e3");
    const colCoolBlue = new Color("#cce6ff");
    const colGoldenAmber = new Color("#ffdfa8");
    const colDiamond = new Color("#f0f7ff");

    for (let i = 0; i < count; i++) {
      // Deep spherical shell (radius 350 to 440)
      const u = Math.random() * 2 - 1;
      const sinTheta = Math.sqrt(Math.max(0, 1 - u * u));
      const phi = Math.random() * Math.PI * 2;
      const r = 350.0 + Math.random() * 90.0;

      positions[i * 3] = r * sinTheta * Math.cos(phi);
      positions[i * 3 + 1] = r * sinTheta * Math.sin(phi);
      positions[i * 3 + 2] = r * u;

      // Apparent magnitude diversity:
      // ~75% medium prominent stars (14 - 18px), ~25% brilliant prominent stars (20 - 28px)
      const isBrilliant = Math.random() < 0.25;

      if (isBrilliant) {
        sizes[i] = 19.0 + Math.random() * 8.0;
        brightnesses[i] = 1.15 + Math.random() * 0.35;
        const c = Math.random() < 0.5 ? colGoldenAmber : colCoolBlue;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      } else {
        sizes[i] = 13.0 + Math.random() * 4.0;
        brightnesses[i] = 0.80 + Math.random() * 0.25;
        const c = Math.random() < 0.5 ? colWarmWhite : colDiamond;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
    }

    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new Float32BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new Float32BufferAttribute(sizes, 1));
    geo.setAttribute("aBrightness", new Float32BufferAttribute(brightnesses, 1));

    return geo;
  }, [count]);

  const material = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: MACRO_STARFIELD_VERT,
      fragmentShader: MACRO_STARFIELD_FRAG,
      uniforms: {
        uTime: uniforms.uTime,
        uZoom: uniforms.uZoom,
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
  }, [uniforms]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <points geometry={geometry} material={material} />;
};

export default MacroStarfield;

import React, { useMemo } from "react";
import { AdditiveBlending, DoubleSide, Color } from "three";

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
  varying vec2 vPos;
  void main() {
    float dist = length(vPos);
    float t = clamp((dist - minR) / (maxR - minR), 0.0, 1.0);
    float alpha = pow(1.0 - t, 2.0) * mult;
    vec3 color = mix(colorIn, colorOut, t);
    gl_FragColor = vec4(color, alpha);
  }
`;

interface GlowingDiskProps {
  minRadius: number;
  maxRadius: number;
  opacityMultiplier?: number;
  rot?: [number, number, number];
  colorIn: Color;
  colorOut: Color;
}

export const GlowingDisk = ({
  minRadius,
  maxRadius,
  opacityMultiplier = 1,
  rot = [0, 0, 0],
  colorIn,
  colorOut,
}: GlowingDiskProps) => {
  const uniforms = useMemo(
    () => ({
      colorIn: { value: colorIn },
      colorOut: { value: colorOut },
      minR: { value: minRadius },
      maxR: { value: maxRadius },
      mult: { value: opacityMultiplier },
    }),
    [minRadius, maxRadius, opacityMultiplier, colorIn, colorOut]
  );

  return (
    <mesh rotation={rot}>
      <ringGeometry args={[minRadius, maxRadius, 64]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        uniforms={uniforms}
        vertexShader={DISK_VERT}
        fragmentShader={DISK_FRAG}
      />
    </mesh>
  );
};
export default GlowingDisk;

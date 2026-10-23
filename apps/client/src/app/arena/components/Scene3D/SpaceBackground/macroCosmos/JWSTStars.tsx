import React, { useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  ShaderMaterial,
  AdditiveBlending,
  DoubleSide,
  IUniform,
  Vector3,
  Quaternion,
} from "three";
import { Billboard } from "@react-three/drei";
import { JWST_STAR_CONFIGS, JWSTStarConfig } from "./constants";
import { JWST_STAR_VERT, JWST_STAR_FRAG } from "./shaders";

interface SingleJWSTStarProps {
  config: JWSTStarConfig;
  timeUniform: IUniform<number>;
  bloomUniform: IUniform<number>;
  rotUniform: IUniform<number>;
}

const SingleJWSTStar: React.FC<SingleJWSTStarProps> = ({
  config,
  timeUniform,
  bloomUniform,
  rotUniform,
}) => {
  const starMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: JWST_STAR_VERT,
      fragmentShader: JWST_STAR_FRAG,
      uniforms: {
        uColor: { value: config.color },
        uTime: timeUniform,
        uBloom: bloomUniform,
        uAngleOffset: rotUniform,
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
  }, [config.color, timeUniform, bloomUniform, rotUniform]);

  // Clean WebGL resources on unmount
  useEffect(() => {
    return () => {
      starMaterial.dispose();
    };
  }, [starMaterial]);

  return (
    <group position={config.position}>
      <Billboard>
        {/* Authentic 8-Spike JWST Optical Signature Billboard (Permanent Skybox) */}
        <mesh material={starMaterial}>
          <planeGeometry args={[config.size, config.size, 1, 1]} />
        </mesh>
      </Billboard>
    </group>
  );
};

export interface JWSTStarsProps {
  graphicsQuality?: string;
}

export const JWSTStars: React.FC<JWSTStarsProps> = ({ graphicsQuality = "medium" }) => {
  const { camera } = useThree();

  // Shared GPU uniform for time
  const timeUniform = useMemo<IUniform<number>>(() => ({ value: 0.0 }), []);

  // Per-star GPU uniforms for view-angle bloom and optical rotation
  const starUniforms = useMemo(() => {
    return JWST_STAR_CONFIGS.map((cfg) => {
      const pos = new Vector3(...cfg.position);
      const dir = pos.clone().normalize();
      return {
        config: cfg,
        pos,
        dir,
        bloomUniform: { value: 0.8 } as IUniform<number>,
        rotUniform: { value: 0.0 } as IUniform<number>,
      };
    });
  }, []);

  // Reusable vector and quaternion instances for 60 FPS zero-garbage math
  const tempForward = useMemo(() => new Vector3(), []);
  const tempStarCam = useMemo(() => new Vector3(), []);
  const tempQuat = useMemo(() => new Quaternion(), []);

  useFrame((state) => {
    timeUniform.value = state.clock.getElapsedTime();

    // 1. Camera forward gaze vector
    camera.getWorldDirection(tempForward);

    // 2. Camera azimuth orientation angle
    const camAzimuth = Math.atan2(tempForward.x, tempForward.z);

    // 3. Inverse camera quaternion for screen-space coordinate projection
    tempQuat.copy(camera.quaternion).invert();

    const activeList = graphicsQuality === "low" ? starUniforms.slice(0, 3) : starUniforms;

    for (let i = 0; i < activeList.length; i++) {
      const s = activeList[i];

      // View-Angle Optical Bloom:
      // Alignment between camera forward direction and normalized star direction
      const dot = tempForward.dot(s.dir);

      // Map dot from periphery (~0.76) to dead-center gaze (~0.98)
      const rawT = Math.max(0.0, Math.min(1.0, (dot - 0.76) / 0.22));
      const smoothBloomT = rawT * rawT * (3.0 - 2.0 * rawT);

      // When near center (smoothBloomT = 1.0) -> bloom = 1.0 (full diffraction flare)
      // When at screen edge/periphery (smoothBloomT = 0.0) -> bloom = 0.38 (60% flare reduction)
      const targetBloom = 0.38 + 0.62 * smoothBloomT;

      // Smooth optical response filter (prevents abrupt jumping)
      s.bloomUniform.value += (targetBloom - s.bloomUniform.value) * 0.12;

      // Subtle Optical Rotation with Camera Movement:
      // Transform star position into camera-local coordinates (x = screen-horizontal, y = screen-vertical)
      tempStarCam.copy(s.pos).applyQuaternion(tempQuat);
      const screenPolarAngle = Math.atan2(tempStarCam.y, tempStarCam.x);

      // Combine screen-space position angle and camera azimuth
      const targetRotation = screenPolarAngle * 0.14 + camAzimuth * 0.12;
      s.rotUniform.value = targetRotation;
    }
  });

  const activeConfigs = graphicsQuality === "low" ? starUniforms.slice(0, 3) : starUniforms;

  return (
    <group>
      {activeConfigs.map((s) => (
        <SingleJWSTStar
          key={s.config.name}
          config={s.config}
          timeUniform={timeUniform}
          bloomUniform={s.bloomUniform}
          rotUniform={s.rotUniform}
        />
      ))}
    </group>
  );
};

export default JWSTStars;

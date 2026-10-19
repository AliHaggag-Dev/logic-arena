import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BackSide, Matrix3, Matrix4, NormalBlending, Vector3, type Group } from "three";
import { IS_MOBILE } from "./constants";
import {
  CAMERA_INFLUENCE_RADIUS,
  CAMERA_MIN_RADIUS,
  CAMERA_PULL_GAIN,
  CAMERA_TARGET_PULL_RATE,
  DISK_INNER_RADIUS,
  DISK_OUTER_RADIUS,
  DISK_VIEW_ANCHOR,
  DISK_VIEW_ELEVATION_RAD,
  HORIZON_EPSILON,
  LENSING_BOUND_RADIUS,
  LENSING_FADE_START,
  LOCAL_UNITS_PER_M,
  MAX_FRAME_DELTA,
  QUALITY_DESKTOP,
  QUALITY_MOBILE,
  RENDER_PROFILES,
  SCHWARZSCHILD_RADIUS,
  TIME_SCALE,
  computeDiskQuaternion,
  computeTemperatureNormalization,
} from "./blackhole/physics";
import { LENSING_FRAGMENT_SHADER, LENSING_VERTEX_SHADER } from "./blackhole/shaders";
import { TidalDebris } from "./blackhole/TidalDebris";
import { useLensingEnvironment } from "./blackhole/useLensingEnvironment";
import type { BlackHoleRenderMode, BlackHoleUniforms, OrbitControlsLike } from "./blackhole/types";

const SPHERE_WIDTH_SEGMENTS = 48;
const SPHERE_HEIGHT_SEGMENTS = 32;
const QUALITY = IS_MOBILE ? QUALITY_MOBILE : QUALITY_DESKTOP;
const SHADER_DEFINES = { MAX_STEPS: QUALITY.maxSteps, FBM_OCTAVES: QUALITY.fbmOctaves } as const;

const isOrbitControlsLike = (candidate: unknown): candidate is OrbitControlsLike => {
  if (typeof candidate !== "object" || candidate === null) return false;
  const record = candidate as { target?: unknown; update?: unknown };
  return record.target instanceof Vector3 && typeof record.update === "function";
};

const createUniforms = (): BlackHoleUniforms => ({
  uCamPos: { value: new Vector3(0, 0, LENSING_BOUND_RADIUS * 2) },
  uCamRedshift: { value: 1 },
  uObserverBoost: { value: 1 },
  uTime: { value: 0 },
  uEnvMap: { value: null },
  uEnvReady: { value: 0 },
  uEnvRotation: { value: new Matrix3() },
  uBeaming: { value: 0 },
  uZeroTorque: { value: 0 },
  uPeakTemperature: { value: 0 },
  uTempNorm: { value: 1 },
  uExposure: { value: 1 },
  uDiskInner: { value: DISK_INNER_RADIUS },
  uDiskOuter: { value: DISK_OUTER_RADIUS },
  uBoundRadius: { value: LENSING_BOUND_RADIUS },
  uFadeStart: { value: LENSING_FADE_START },
  uStepScale: { value: QUALITY.stepScale },
});

interface BlackHoleProps {
  position: [number, number, number];
  scale?: number;
  /** `interstellar` (film look, default) or `physical` (full Doppler + redshift). */
  renderMode?: BlackHoleRenderMode;
}

/**
 * Schwarzschild black hole: GPU null-geodesic ray tracing (shadow, photon
 * ring, lensed disk & sky), CPU timelike geodesics for infalling matter
 * (tidal spaghettification, horizon freeze) and a pseudo-Newtonian pull on
 * the camera. All per-frame state lives in refs/uniforms — zero re-renders.
 */
const BlackHoleComponent = ({ position, scale = 1, renderMode = "interstellar" }: BlackHoleProps): React.JSX.Element => {
  const [px, py, pz] = position;
  const groupRef = useRef<Group>(null);
  const cameraLocalRef = useRef<Vector3>(new Vector3());
  const cameraWorldRef = useRef<Vector3>(new Vector3());
  const controls = useThree((state) => state.controls);

  const worldPerM = scale * LOCAL_UNITS_PER_M;
  const blackHoleWorld = useMemo(() => new Vector3(px, py, pz), [px, py, pz]);
  const diskQuaternion = useMemo(
    () => computeDiskQuaternion(blackHoleWorld, DISK_VIEW_ANCHOR, DISK_VIEW_ELEVATION_RAD),
    [blackHoleWorld],
  );
  const uniforms = useMemo<BlackHoleUniforms>(createUniforms, []);

  useLayoutEffect(() => {
    uniforms.uEnvRotation.value.setFromMatrix4(new Matrix4().makeRotationFromQuaternion(diskQuaternion));
    groupRef.current?.updateMatrixWorld(true);
  }, [diskQuaternion, uniforms, worldPerM]);

  useEffect(() => {
    const profile = RENDER_PROFILES[renderMode];
    uniforms.uBeaming.value = profile.beaming;
    uniforms.uZeroTorque.value = profile.zeroTorque;
    uniforms.uPeakTemperature.value = profile.peakTemperatureK;
    uniforms.uExposure.value = profile.exposure;
    uniforms.uTempNorm.value = computeTemperatureNormalization(profile.zeroTorque);
  }, [renderMode, uniforms]);

  useLensingEnvironment(groupRef, uniforms, LENSING_BOUND_RADIUS * worldPerM, QUALITY.envResolution);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const dt = Math.min(delta, MAX_FRAME_DELTA);
    uniforms.uTime.value += dt * TIME_SCALE;

    const camera = state.camera;
    const local = group.worldToLocal(cameraLocalRef.current.copy(camera.position));
    let radius = local.length();

    if (radius < CAMERA_INFLUENCE_RADIUS) {
      // Paczyński–Wiita profile (r_s/(r − r_s))² diverges at the horizon like GR.
      const proximity = SCHWARZSCHILD_RADIUS / Math.max(radius - SCHWARZSCHILD_RADIUS, HORIZON_EPSILON);
      const strength = proximity * proximity;
      const travel = Math.min(CAMERA_PULL_GAIN * strength * dt, radius - CAMERA_MIN_RADIUS);

      if (travel !== 0) {
        local.multiplyScalar((radius - travel) / radius);
        radius -= travel;
        camera.position.copy(group.localToWorld(cameraWorldRef.current.copy(local)));
      }

      if (isOrbitControlsLike(controls)) {
        controls.target.lerp(blackHoleWorld, 1 - Math.exp(-CAMERA_TARGET_PULL_RATE * strength * dt));
        controls.update();
      }
    }

    const lapse = Math.max(1 - SCHWARZSCHILD_RADIUS / radius, HORIZON_EPSILON);
    uniforms.uCamPos.value.copy(local);
    uniforms.uCamRedshift.value = Math.sqrt(lapse);
    uniforms.uObserverBoost.value = Math.pow(lapse, -2 * uniforms.uBeaming.value);
  });

  return (
    <group ref={groupRef} position={blackHoleWorld} quaternion={diskQuaternion} scale={worldPerM}>
      <mesh renderOrder={0}>
        <sphereGeometry args={[LENSING_BOUND_RADIUS, SPHERE_WIDTH_SEGMENTS, SPHERE_HEIGHT_SEGMENTS]} />
        <shaderMaterial
          uniforms={uniforms}
          defines={SHADER_DEFINES}
          vertexShader={LENSING_VERTEX_SHADER}
          fragmentShader={LENSING_FRAGMENT_SHADER}
          side={BackSide}
          transparent
          premultipliedAlpha
          depthWrite={false}
          blending={NormalBlending}
        />
      </mesh>
      <TidalDebris count={QUALITY.debrisCount} />
    </group>
  );
};

const arePropsEqual = (prev: BlackHoleProps, next: BlackHoleProps): boolean =>
  prev.scale === next.scale &&
  prev.renderMode === next.renderMode &&
  prev.position[0] === next.position[0] &&
  prev.position[1] === next.position[1] &&
  prev.position[2] === next.position[2];

export const BlackHole = React.memo(BlackHoleComponent, arePropsEqual);
BlackHole.displayName = "BlackHole";
export default BlackHole;

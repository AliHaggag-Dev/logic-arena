import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  Matrix4,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
  type Material,
} from "three";
import {
  CRITICAL_IMPACT_PARAMETER,
  DEBRIS_BASE_SIZE,
  DEBRIS_EXPOSURE,
  DEBRIS_FADE_IN_SECONDS,
  DEBRIS_INITIAL_MIN_RADIUS,
  DEBRIS_MAX_ANGULAR_MOMENTUM,
  DEBRIS_MAX_BOOST,
  DEBRIS_MAX_INFALL_SPEED,
  DEBRIS_MAX_TILT_RAD,
  DEBRIS_MIN_ANGULAR_MOMENTUM,
  DEBRIS_RESPAWN_RADIUS,
  DEBRIS_SPAWN_MAX_RADIUS,
  DEBRIS_SPAWN_MIN_RADIUS,
  DEBRIS_SUBSTEPS,
  DEBRIS_TEMPERATURE_K,
  HORIZON_EPSILON,
  MAX_FRAME_DELTA,
  SCHWARZSCHILD_RADIUS,
  TIME_SCALE,
  blackbodyChromaticity,
  computeTidalStrain,
  geodesicEnergy,
  radialGeodesicAcceleration,
} from "./physics";
import type { DebrisState, TidalStrain } from "./types";

const CAPSULE_RADIUS = 0.35;
const CAPSULE_LENGTH = 1.3;
const CAPSULE_CAP_SEGMENTS = 2;
const CAPSULE_RADIAL_SEGMENTS = 6;
const VECTOR_STRIDE = 3;
const FULL_TURN = Math.PI * 2;

const scratchRadial = new Vector3();
const scratchAzimuthal = new Vector3();
const scratchNormal = new Vector3();
const scratchPosition = new Vector3();
const scratchToCamera = new Vector3();
const scratchCamera = new Vector3();
const scratchMatrix = new Matrix4();
const scratchColor = new Color();
const scratchRgb: [number, number, number] = [0, 0, 0];
const scratchStrain: TidalStrain = { radial: 0, azimuthal: 0, normal: 0 };

const randomRange = (min: number, max: number): number => min + Math.random() * (max - min);

const createDebrisState = (count: number): DebrisState => ({
  radius: new Float32Array(count),
  radialVelocity: new Float32Array(count),
  azimuth: new Float32Array(count),
  angularMomentum: new Float32Array(count),
  energy: new Float32Array(count),
  age: new Float32Array(count),
  basisU: new Float32Array(count * VECTOR_STRIDE),
  basisV: new Float32Array(count * VECTOR_STRIDE),
  basisN: new Float32Array(count * VECTOR_STRIDE),
});

/** Places a body on a plunging (L < 2√3 M) geodesic in a slightly tilted plane. */
const spawnDebris = (state: DebrisState, i: number, minRadius: number): void => {
  const r = randomRange(minRadius, DEBRIS_SPAWN_MAX_RADIUS);
  const vr = -Math.random() * DEBRIS_MAX_INFALL_SPEED;
  const l = randomRange(DEBRIS_MIN_ANGULAR_MOMENTUM, DEBRIS_MAX_ANGULAR_MOMENTUM);

  state.radius[i] = r;
  state.radialVelocity[i] = vr;
  state.azimuth[i] = Math.random() * FULL_TURN;
  state.angularMomentum[i] = l;
  state.energy[i] = geodesicEnergy(r, vr, l);
  state.age[i] = 0;

  const tilt = randomRange(-DEBRIS_MAX_TILT_RAD, DEBRIS_MAX_TILT_RAD);
  const node = Math.random() * FULL_TURN;
  const nx = Math.sin(tilt) * Math.cos(node);
  const ny = Math.cos(tilt);
  const nz = Math.sin(tilt) * Math.sin(node);
  const uLength = Math.hypot(ny, nx);
  const ux = ny / uLength;
  const uy = -nx / uLength;
  const o = i * VECTOR_STRIDE;

  state.basisN[o] = nx;
  state.basisN[o + 1] = ny;
  state.basisN[o + 2] = nz;
  state.basisU[o] = ux;
  state.basisU[o + 1] = uy;
  state.basisU[o + 2] = 0;
  state.basisV[o] = -nz * uy;
  state.basisV[o + 1] = nz * ux;
  state.basisV[o + 2] = nx * uy - ny * ux;
};

interface TidalDebrisProps {
  count: number;
}

/**
 * Bodies falling along exact Schwarzschild timelike geodesics, rendered as seen
 * by a distant observer: integrated in proper time τ but advanced in
 * coordinate time t via dt/dτ = E / (1 − r_s/r). They therefore asymptotically
 * freeze and redden at the horizon (never seen crossing it), while the
 * traceless Weyl tidal tensor stretches them into spaghetti.
 */
export const TidalDebris = React.memo(({ count }: TidalDebrisProps): React.JSX.Element => {
  const meshRef = useRef<InstancedMesh>(null);
  const state = useMemo<DebrisState>(() => {
    const debris = createDebrisState(count);
    for (let i = 0; i < count; i++) spawnDebris(debris, i, DEBRIS_INITIAL_MIN_RADIUS);
    return debris;
  }, [count]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    scratchColor.setRGB(0, 0, 0);
    for (let i = 0; i < count; i++) mesh.setColorAt(i, scratchColor);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count]);

  useFrame((frameState, delta) => {
    const mesh = meshRef.current;
    const parent = mesh?.parent;
    if (!mesh || !parent) return;

    const camera = parent.worldToLocal(scratchCamera.copy(frameState.camera.position));
    const camDistance = camera.length();
    const camRedshift = Math.sqrt(Math.max(1 - SCHWARZSCHILD_RADIUS / camDistance, HORIZON_EPSILON));
    const frameDelta = Math.min(delta, MAX_FRAME_DELTA);
    const subDt = (frameDelta * TIME_SCALE) / DEBRIS_SUBSTEPS;

    for (let i = 0; i < count; i++) {
      let r = state.radius[i];
      let vr = state.radialVelocity[i];
      let phi = state.azimuth[i];
      const l = state.angularMomentum[i];
      const e = state.energy[i];

      for (let s = 0; s < DEBRIS_SUBSTEPS; s++) {
        const dTau = (subDt * (1 - SCHWARZSCHILD_RADIUS / r)) / e;
        const a0 = radialGeodesicAcceleration(r, l);
        r += vr * dTau + 0.5 * a0 * dTau * dTau;
        if (r <= DEBRIS_RESPAWN_RADIUS) break;
        vr += 0.5 * (a0 + radialGeodesicAcceleration(r, l)) * dTau;
        phi += (l / (r * r)) * dTau;
      }

      if (r <= DEBRIS_RESPAWN_RADIUS) {
        spawnDebris(state, i, DEBRIS_SPAWN_MIN_RADIUS);
        r = state.radius[i];
        vr = state.radialVelocity[i];
        phi = state.azimuth[i];
      }

      state.radius[i] = r;
      state.radialVelocity[i] = vr;
      state.azimuth[i] = phi;
      state.age[i] += frameDelta;

      const o = i * VECTOR_STRIDE;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const bu = state.basisU;
      const bv = state.basisV;
      scratchRadial.set(
        cosPhi * bu[o] + sinPhi * bv[o],
        cosPhi * bu[o + 1] + sinPhi * bv[o + 1],
        cosPhi * bu[o + 2] + sinPhi * bv[o + 2],
      );
      scratchAzimuthal.set(
        -sinPhi * bu[o] + cosPhi * bv[o],
        -sinPhi * bu[o + 1] + cosPhi * bv[o + 1],
        -sinPhi * bu[o + 2] + cosPhi * bv[o + 2],
      );
      scratchNormal.fromArray(state.basisN, o);
      scratchPosition.copy(scratchRadial).multiplyScalar(r);

      // Relativistic redshift seen by the camera (static observer):
      // g = √(1−r_s/r)/√(1−r_s/r_cam) · 1/(γ(1 − β·n̂)), β in the emitter's static frame.
      scratchToCamera.copy(camera).sub(scratchPosition);
      const toCameraDistance = scratchToCamera.length();
      scratchToCamera.divideScalar(toCameraDistance);
      const sqrtLapse = Math.sqrt(Math.max(1 - SCHWARZSCHILD_RADIUS / r, HORIZON_EPSILON));
      const gamma = e / sqrtLapse;
      const betaDotN =
        ((vr / sqrtLapse) * scratchRadial.dot(scratchToCamera) + (l / r) * scratchAzimuthal.dot(scratchToCamera)) / gamma;
      const g = sqrtLapse / (camRedshift * gamma * Math.max(1 - betaDotN, HORIZON_EPSILON));

      // Hidden if it sits behind the shadow cone (b < 3√3 M) as seen from the camera.
      const along = -scratchPosition.dot(camera) / camDistance + camDistance;
      const perpendicular2 = toCameraDistance * toCameraDistance - along * along;
      const shadowRadius = (along * CRITICAL_IMPACT_PARAMETER) / camDistance;
      const occluded = along > camDistance && perpendicular2 < shadowRadius * shadowRadius;

      const g2 = g * g;
      const fadeIn = Math.min(state.age[i] / DEBRIS_FADE_IN_SECONDS, 1);
      const intensity = occluded ? 0 : DEBRIS_EXPOSURE * Math.min(g2 * g2, DEBRIS_MAX_BOOST) * fadeIn;
      blackbodyChromaticity(DEBRIS_TEMPERATURE_K * g, scratchRgb);
      scratchColor.setRGB(scratchRgb[0] * intensity, scratchRgb[1] * intensity, scratchRgb[2] * intensity);
      mesh.setColorAt(i, scratchColor);

      computeTidalStrain(r, l, scratchStrain);
      scratchRadial.multiplyScalar(DEBRIS_BASE_SIZE * Math.exp(scratchStrain.radial));
      scratchAzimuthal.multiplyScalar(DEBRIS_BASE_SIZE * Math.exp(scratchStrain.azimuthal));
      scratchNormal.multiplyScalar(DEBRIS_BASE_SIZE * Math.exp(scratchStrain.normal));
      scratchMatrix
        .makeBasis(scratchAzimuthal, scratchRadial, scratchNormal)
        .setPosition(scratchPosition);
      mesh.setMatrixAt(i, scratchMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined as unknown as BufferGeometry, undefined as unknown as Material, count]}
      frustumCulled={false}
      renderOrder={1}
    >
      <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_LENGTH, CAPSULE_CAP_SEGMENTS, CAPSULE_RADIAL_SEGMENTS]} />
      <meshBasicMaterial transparent depthWrite={false} blending={AdditiveBlending} />
    </instancedMesh>
  );
});

TidalDebris.displayName = "TidalDebris";
export default TidalDebris;

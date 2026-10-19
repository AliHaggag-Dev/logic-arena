import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
  type WebGLProgramParametersWithUniforms,
} from "three";
import { blackbodyChromaticity, RENDER_PROFILES } from "../blackhole/physics";
import { createAsteroidGeometry, createRng } from "./asteroidGeometry";
import type {
  AsteroidMaterialUniforms,
  AsteroidPlacement,
  AsteroidSpectralClass,
  SpectralClassProfile,
  Vec3Tuple,
} from "./types";

/* ------------------------------ Quality tiers ------------------------------ */
const DETAIL_DESKTOP = 18;
const DETAIL_MOBILE = 9;
const CRATERS_DESKTOP = 34;
const CRATERS_MOBILE = 18;
const VARIANT_SEEDS = [1337, 4242, 9001] as const;
const FIELD_SEED = 20261019;

/* --------------------------- Physical appearance -------------------------- */
const ROUGHNESS = 0.96;
const METALNESS = 0;
const ENV_MAP_INTENSITY = 0.25;
/** Tri-axial ellipsoid ratios (b/a, c/a) typical of small bodies ≈ 0.6–0.95. */
const AXIS_RATIO_MIN = 0.58;
const AXIS_RATIO_MAX = 0.95;
const SIZE_TO_RADIUS = 0.6;
/** Visual spin rates (rad/s); real rubble piles spin slower than ~2.2 h. */
const SPIN_RATE_MIN = 0.015;
const SPIN_RATE_MAX = 0.11;
const COLOR_JITTER = 0.04;

/* ------------------------------ Disk lighting ----------------------------- */
const DISK_LIGHT_INTENSITY = 2.2;
const DISK_LIGHT_REFERENCE_DISTANCE = 320;
const DISK_LIGHT_WRAP = 0.25;
const MAX_DISK_FALLOFF = 2;

/** Main-belt taxonomy abundances: C ≈ 75 %, S ≈ 17 %, M ≈ 8 %. */
const SPECTRAL_CLASSES: Record<AsteroidSpectralClass, SpectralClassProfile> = {
  C: { hue: 0.08, saturation: 0.06, lightness: 0.3, cumulativeWeight: 0.75 },
  S: { hue: 0.07, saturation: 0.2, lightness: 0.4, cumulativeWeight: 0.92 },
  M: { hue: 0.6, saturation: 0.04, lightness: 0.44, cumulativeWeight: 1 },
};
const SPECTRAL_ORDER: readonly AsteroidSpectralClass[] = ["C", "S", "M"];

interface AsteroidInstance {
  position: Vector3;
  scale: Vector3;
  baseRotation: Quaternion;
  spinAxis: Vector3;
  spinRate: number;
  color: Color;
}

const scratchSpin = new Quaternion();
const scratchQuaternion = new Quaternion();
const scratchMatrix = new Matrix4();
const scratchDiskView = new Vector3();
const scratchRgb: [number, number, number] = [0, 0, 0];

const pickSpectralClass = (roll: number): SpectralClassProfile => {
  for (const key of SPECTRAL_ORDER) {
    if (roll <= SPECTRAL_CLASSES[key].cumulativeWeight) return SPECTRAL_CLASSES[key];
  }
  return SPECTRAL_CLASSES.C;
};

const randomUnitVector = (rng: () => number, out: Vector3): Vector3 => {
  const z = rng() * 2 - 1;
  const theta = rng() * Math.PI * 2;
  const ring = Math.sqrt(1 - z * z);
  return out.set(ring * Math.cos(theta), ring * Math.sin(theta), z);
};

/**
 * Injects a second, physically-motivated light into MeshStandardMaterial:
 * the black hole's accretion disk as an extended (wrapped-Lambert) source
 * with inverse-square falloff, coloured by the disk's blackbody temperature.
 * Scoped to asteroids only so arena lighting is untouched.
 */
const createAsteroidMaterial = (uniforms: AsteroidMaterialUniforms): MeshStandardMaterial => {
  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: ROUGHNESS,
    metalness: METALNESS,
    envMapIntensity: ENV_MAP_INTENSITY,
  });

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms): void => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec3 uDiskPosView;
        uniform vec3 uDiskLightColor;
        uniform float uDiskIntensity;
        uniform float uDiskRefDistance;`,
      )
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
        {
          vec3 toDisk = uDiskPosView + vViewPosition;
          float diskDistance = length(toDisk);
          float wrapped = clamp((dot(normal, toDisk / diskDistance) + ${DISK_LIGHT_WRAP.toFixed(2)}) / ${(1 + DISK_LIGHT_WRAP).toFixed(2)}, 0.0, 1.0);
          float falloff = min(pow(uDiskRefDistance / diskDistance, 2.0), ${MAX_DISK_FALLOFF.toFixed(1)});
          reflectedLight.directDiffuse += material.diffuseColor * uDiskLightColor * (uDiskIntensity * wrapped * falloff);
        }`,
      );
  };
  material.customProgramCacheKey = (): string => "asteroid-disk-lit";
  return material;
};

interface AsteroidFieldProps {
  placements: readonly AsteroidPlacement[];
  diskPosition: Vec3Tuple;
  isMobile: boolean;
}

/**
 * Realistic asteroid field: 3 procedural shape variants × instancing (3 draw
 * calls total), tri-axial non-uniform scaling, spectral-class albedo, and
 * per-body tumbling about random spin axes. Fixed world positions so the
 * black-hole sightline clearance is guaranteed for the whole match.
 */
export const AsteroidField = React.memo(({ placements, diskPosition, isMobile }: AsteroidFieldProps): React.JSX.Element => {
  const meshRefs = useRef<(InstancedMesh | null)[]>([]);
  const diskWorld = useMemo(() => new Vector3(...diskPosition), [diskPosition]);

  const geometries = useMemo<BufferGeometry[]>(
    () =>
      VARIANT_SEEDS.map((seed) =>
        createAsteroidGeometry({
          seed,
          detail: isMobile ? DETAIL_MOBILE : DETAIL_DESKTOP,
          craterCount: isMobile ? CRATERS_MOBILE : CRATERS_DESKTOP,
        }),
      ),
    [isMobile],
  );

  const uniforms = useMemo<AsteroidMaterialUniforms>(() => {
    const rgb = blackbodyChromaticity(RENDER_PROFILES.interstellar.peakTemperatureK, scratchRgb);
    return {
      uDiskPosView: { value: new Vector3() },
      uDiskLightColor: { value: new Color().setRGB(rgb[0], rgb[1], rgb[2]) },
      uDiskIntensity: { value: DISK_LIGHT_INTENSITY },
      uDiskRefDistance: { value: DISK_LIGHT_REFERENCE_DISTANCE },
    };
  }, []);

  const material = useMemo(() => createAsteroidMaterial(uniforms), [uniforms]);

  const buckets = useMemo<AsteroidInstance[][]>(() => {
    const rng = createRng(FIELD_SEED);
    const groups: AsteroidInstance[][] = VARIANT_SEEDS.map(() => []);
    placements.forEach((placement, i) => {
      const radius = placement.size * SIZE_TO_RADIUS;
      const b = AXIS_RATIO_MIN + rng() * (AXIS_RATIO_MAX - AXIS_RATIO_MIN);
      const c = AXIS_RATIO_MIN + rng() * (b - AXIS_RATIO_MIN);
      const profile = pickSpectralClass(rng());
      const jitter = (): number => (rng() * 2 - 1) * COLOR_JITTER;
      groups[i % VARIANT_SEEDS.length].push({
        position: new Vector3(...placement.pos),
        scale: new Vector3(radius, radius * b, radius * c),
        baseRotation: new Quaternion().setFromAxisAngle(randomUnitVector(rng, new Vector3()), rng() * Math.PI * 2),
        spinAxis: randomUnitVector(rng, new Vector3()),
        spinRate: SPIN_RATE_MIN + rng() * (SPIN_RATE_MAX - SPIN_RATE_MIN),
        color: new Color().setHSL(
          profile.hue + jitter(),
          Math.max(profile.saturation + jitter(), 0),
          profile.lightness + jitter(),
        ),
      });
    });
    return groups;
  }, [placements]);

  useLayoutEffect(() => {
    buckets.forEach((bucket, v) => {
      const mesh = meshRefs.current[v];
      if (!mesh) return;
      bucket.forEach((asteroid, i) => mesh.setColorAt(i, asteroid.color));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [buckets]);

  useEffect(
    () => () => {
      geometries.forEach((geometry) => geometry.dispose());
    },
    [geometries],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    uniforms.uDiskPosView.value.copy(scratchDiskView.copy(diskWorld).applyMatrix4(state.camera.matrixWorldInverse));

    for (let v = 0; v < buckets.length; v++) {
      const mesh = meshRefs.current[v];
      if (!mesh) continue;
      const bucket = buckets[v];
      for (let i = 0; i < bucket.length; i++) {
        const asteroid = bucket[i];
        scratchSpin.setFromAxisAngle(asteroid.spinAxis, asteroid.spinRate * time);
        scratchQuaternion.multiplyQuaternions(scratchSpin, asteroid.baseRotation);
        scratchMatrix.compose(asteroid.position, scratchQuaternion, asteroid.scale);
        mesh.setMatrixAt(i, scratchMatrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {buckets.map((bucket, v) => (
        <instancedMesh
          key={VARIANT_SEEDS[v]}
          ref={(mesh: InstancedMesh | null) => {
            meshRefs.current[v] = mesh;
          }}
          args={[geometries[v], material, Math.max(bucket.length, 1)]}
          count={bucket.length}
          frustumCulled={false}
        />
      ))}
    </>
  );
});

AsteroidField.displayName = "AsteroidField";
export default AsteroidField;

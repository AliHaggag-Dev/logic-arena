import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CubeCamera,
  HalfFloatType,
  LinearFilter,
  WebGLCubeRenderTarget,
  type Group,
} from "three";
import type { BlackHoleUniforms } from "./types";

/** Frames to wait so the starfield / nebula / planets have mounted. */
const CAPTURE_DELAY_FRAMES = 45;
const CUBE_CAMERA_FAR = 10000;

interface LensingRig {
  camera: CubeCamera;
  target: WebGLCubeRenderTarget;
}

/**
 * Captures the surrounding scene ONCE into a half-float cubemap from the black
 * hole's centre (with the black hole hidden). The ray tracer then samples it
 * along each photon's bent escape direction, producing true Einstein-ring
 * lensing of the real stars, planets and nebulae behind the hole.
 *
 * The near plane equals the lensing-sphere radius so nothing inside the
 * relativistic region leaks into the "sky at infinity".
 */
export const useLensingEnvironment = (
  groupRef: RefObject<Group | null>,
  uniforms: BlackHoleUniforms,
  nearPlaneWorld: number,
  resolution: number,
): void => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const rigRef = useRef<LensingRig | null>(null);
  const framesRef = useRef<number>(0);

  useEffect(() => {
    const target = new WebGLCubeRenderTarget(resolution, {
      type: HalfFloatType,
      generateMipmaps: false,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    });
    rigRef.current = { camera: new CubeCamera(nearPlaneWorld, CUBE_CAMERA_FAR, target), target };
    framesRef.current = 0;

    return () => {
      uniforms.uEnvReady.value = 0;
      uniforms.uEnvMap.value = null;
      target.dispose();
      rigRef.current = null;
    };
  }, [nearPlaneWorld, resolution, uniforms]);

  useFrame(() => {
    const rig = rigRef.current;
    const group = groupRef.current;
    if (!rig || !group || uniforms.uEnvReady.value > 0) return;

    framesRef.current += 1;
    if (framesRef.current < CAPTURE_DELAY_FRAMES) return;

    group.getWorldPosition(rig.camera.position);
    rig.camera.updateMatrixWorld(true);
    group.visible = false;
    rig.camera.update(gl, scene);
    group.visible = true;

    uniforms.uEnvMap.value = rig.target.texture;
    uniforms.uEnvReady.value = 1;
  });
};

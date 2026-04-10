import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Manages the 3D scene setup, including camera, lighting, and arena dimensions.
 */
export const useSceneSetup = () => {
  const { camera, gl } = useThree();

  // Arena dimensions, scaled for the 3D scene
  const arena = useMemo(() => ({ width: 20, height: 15 }), []);

  // Set up initial camera position and target
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 18, 18);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      gl.setSize(window.innerWidth, window.innerHeight);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial size setup

    return () => window.removeEventListener("resize", handleResize);
  }, [camera, gl]);

  return { arena };
};

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FALLBACK_COLOR } from "../constants/robots.constants";

/**
 * Applies a hex color tint to all meshes in a GLTF scene.
 * - Stores original colors of the materials in a Ref Map.
 * - Modifies the .color property directly on existing materials instead of cloning them,
 *   which completely avoids expensive WebGL shader recompilations and prevents material leaks.
 * - Restores original colors when the color is set to DEFAULT or on unmount.
 */
export function useRobotColorTint(
  scene: THREE.Group | null | undefined,
  color: string
): void {
  // Map of material UUID -> original color
  const originalColors = useRef(new Map<string, THREE.Color>());

  // Reset original colors when the scene object itself changes
  useEffect(() => {
    originalColors.current.clear();
  }, [scene]);

  useEffect(() => {
    if (!scene) return;

    // Snapshot original colors if not already done for this scene
    if (originalColors.current.size === 0) {
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          
          materials.forEach((mat) => {
            if (mat && 'color' in mat && (mat as THREE.MeshStandardMaterial).color instanceof THREE.Color) {
              const standardMat = mat as THREE.MeshStandardMaterial;
              originalColors.current.set(standardMat.uuid, standardMat.color.clone());
            }
          });
        }
      });
    }

    const isDefault =
      !color ||
      color.trim().toUpperCase() === "DEFAULT" ||
      color.trim().toLowerCase() === "paint-default";

    if (isDefault) {
      // Restore original colors
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if (mat && 'color' in mat) {
              const standardMat = mat as THREE.MeshStandardMaterial;
              const origColor = originalColors.current.get(standardMat.uuid);
              if (origColor) {
                standardMat.color.copy(origColor);
              }
            }
          });
        }
      });
    } else {
      let col: THREE.Color;
      try {
        col = new THREE.Color(color.trim());
      } catch {
        col = new THREE.Color(FALLBACK_COLOR);
      }

      // Set colors directly without material cloning (WebGL shader re-use)
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if (mat && 'color' in mat) {
              const standardMat = mat as THREE.MeshStandardMaterial;
              standardMat.color.copy(col);
            }
          });
        }
      });
    }
  }, [scene, color]);

  // Clean up: restore original colors when component unmounts to keep cached GLTF clean
  useEffect(() => {
    return () => {
      if (scene && originalColors.current.size > 0) {
        scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat) => {
              if (mat && 'color' in mat) {
                const standardMat = mat as THREE.MeshStandardMaterial;
                const origColor = originalColors.current.get(standardMat.uuid);
                if (origColor) {
                  standardMat.color.copy(origColor);
                }
              }
            });
          }
        });
      }
    };
  }, [scene]);
}

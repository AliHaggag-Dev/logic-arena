import { useMemo } from "react";

/**
 * Returns arena dimensions scaled for the 3D scene.
 * Camera initialisation is owned by SceneCanvas (<PerspectiveCamera makeDefault>).
 * Resize handling is owned by R3F's Canvas — no manual gl.setSize needed.
 */
export const useSceneSetup = () => {
  const arena = useMemo(() => ({ width: 20, height: 15 }), []);
  return { arena };
};

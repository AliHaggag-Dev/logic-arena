'use client';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Box3, Group, Vector3 } from 'three';
import { useGLTF } from '@react-three/drei';
import { RobotModelProps } from '../../../types';
import { RobotModelInner } from './RobotModel';
import { createPrimitiveChassis } from './PrimitiveChassis';

/** Maps chassis IDs to their GLB file paths. */
export const CHASSIS_MODEL_PATHS: Record<string, string> = {
  'unit-01': '/robots/robot.glb',
  'unit-02': '/robots/robot2.glb',
  'chassis-unit-01': '/robots/robot.glb',
  'chassis-unit-02': '/robots/robot2.glb',
  'chassis-titan': '/robots/armored-robot.glb',
  'chassis-sandman': '/robots/sandman.glb',
  'chassis-iron-mecha': '/robots/mecha.glb',
  'chassis-sentinel': '/robots/npc-robot.glb',
  'chassis-crimson-titan': '/robots/red_mecha.glb',
};

const TARGET_ROBOT_SIZE = 1.6;

const BotModel = memo((props: RobotModelProps & { file: string }) => {
  const { scene, animations } = useGLTF(props.file);
  
  const scale = useMemo(() => {
    try {
      const box = new Box3().setFromObject(scene as unknown as Group);
      const size = new Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        return TARGET_ROBOT_SIZE / maxDim;
      }
    } catch (e) {
      console.error('[RobotModelLoaders] Error calculating scale:', e);
    }
    return 2; // fallback
  }, [scene]);
  
  return (
    <RobotModelInner
      {...props}
      scene={scene as unknown as Group}
      animations={animations}
      scale={scale}
    />
  );
});
BotModel.displayName = 'BotModel';

const PRIMITIVE_CHASSIS_IDS = new Set<string>([]);

const PrimitiveBotModel = memo((props: RobotModelProps & { chassisId: string }) => {
  const primitiveGroup = useMemo(
    () => createPrimitiveChassis(props.chassisId),
    [props.chassisId],
  );

  const scale = useMemo(() => {
    try {
      const box = new Box3().setFromObject(primitiveGroup);
      const size = new Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        return TARGET_ROBOT_SIZE / maxDim;
      }
    } catch (e) {
      console.error('[RobotModelLoaders] Error scaling primitive:', e);
    }
    return 2; // fallback
  }, [primitiveGroup]);

  return <RobotModelInner {...props} scene={primitiveGroup} scale={scale} />;
});
PrimitiveBotModel.displayName = 'PrimitiveBotModel';

export const RobotModel = memo((props: RobotModelProps) => {
  const file = props.modelFile ?? '/robots/robot.glb';

  if (PRIMITIVE_CHASSIS_IDS.has(file)) {
    return <PrimitiveBotModel {...props} chassisId={file} />;
  }

  return <BotModel {...props} file={file} />;
});
RobotModel.displayName = 'RobotModel';

// ---------------------------------------------------------------------------
// Targeted preloader — only downloads the GLBs actually needed for this match
// ---------------------------------------------------------------------------

interface PreloadArenaModelsProps {
  userChassisId?: string | null;
  opponentChassisId?: string | null;
}

/**
 * Preloads only the robot GLB models required for the current match.
 * Mount this component once chassis IDs are known — it renders nothing.
 */
export const PreloadArenaModels = memo(({ userChassisId, opponentChassisId }: PreloadArenaModelsProps) => {
  const preloadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ids = [userChassisId, opponentChassisId];
    for (const chassisId of ids) {
      if (!chassisId) continue;
      const path = CHASSIS_MODEL_PATHS[chassisId];
      if (!path || preloadedRef.current.has(path)) continue;
      preloadedRef.current.add(path);
      useGLTF.preload(path);
    }
  }, [userChassisId, opponentChassisId]);

  return null;
});
PreloadArenaModels.displayName = 'PreloadArenaModels';

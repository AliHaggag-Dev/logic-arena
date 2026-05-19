'use client';
import React, { memo, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { RobotModelProps } from '../../../types';
import { RobotModelInner } from './RobotModel';
import { createPrimitiveChassis } from './PrimitiveChassis';

const ROBOT_SCALES: Record<string, number> = {
  '/robots/robot.glb': 2,
  '/robots/robot2.glb': 0.8,
  '/robots/bunny.glb': 1.5,
  '/robots/armored-robot.glb': 1.7,
  '/robots/sandman.glb': 5,
};

const BotModel = memo((props: RobotModelProps & { file: string }) => {
  const { scene } = useGLTF(props.file);
  const scale = ROBOT_SCALES[props.file] ?? 2;
  return <RobotModelInner {...props} scene={scene as unknown as THREE.Group} scale={scale} />;
});
BotModel.displayName = 'BotModel';

const PRIMITIVE_CHASSIS_IDS = new Set([
  'chassis-phantom',
]);

const PrimitiveBotModel = memo((props: RobotModelProps & { chassisId: string }) => {
  const primitiveGroup = useMemo(
    () => createPrimitiveChassis(props.chassisId),
    [props.chassisId],
  );
  return <RobotModelInner {...props} scene={primitiveGroup} scale={2} />;
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

useGLTF.preload('/robots/robot.glb');
useGLTF.preload('/robots/robot2.glb');
useGLTF.preload('/robots/bunny.glb');
useGLTF.preload('/robots/armored-robot.glb');
useGLTF.preload('/robots/sandman.glb');

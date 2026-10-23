import React from "react";
import { MapTheme } from "../../../types";
import { LavaEnvironment } from "./LavaEnvironment";
import { IceEnvironment } from "./IceEnvironment";
import { CyberEnvironment } from "./CyberEnvironment";

interface DynamicEnvironmentProps {
  mapTheme: MapTheme;
  graphicsQuality?: string;
}

export const DynamicEnvironment = React.memo(({ mapTheme, graphicsQuality }: DynamicEnvironmentProps) => {
  const isHighQuality = graphicsQuality !== 'low';

  if (mapTheme === 'LAVA') return <LavaEnvironment isHighQuality={isHighQuality} />;
  if (mapTheme === 'ICE') return <IceEnvironment isHighQuality={isHighQuality} />;
  return <CyberEnvironment isHighQuality={isHighQuality} graphicsQuality={graphicsQuality} />;
});

DynamicEnvironment.displayName = 'DynamicEnvironment';
export default DynamicEnvironment;

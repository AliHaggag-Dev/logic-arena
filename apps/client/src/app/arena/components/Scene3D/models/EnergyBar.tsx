'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { EnergyBarSpriteProps } from '../../../types';

const LOW_ENERGY_THRESHOLD = 20; // % — below this, bar pulses amber

/**
 * EnergyBarSprite — canvas-texture sprite rendered below the health bar.
 * Mirrors the HealthBarSprite pattern for zero extra re-renders.
 */
export const EnergyBarSprite = ({ energy, maxEnergy, inStasis }: EnergyBarSpriteProps) => {
  const canvas = useMemo(() => {
    const c  = document.createElement('canvas');
    c.width  = 64;
    c.height = 8;
    return c;
  }, []);

  const [texture] = useState(() => {
    const tex        = new THREE.CanvasTexture(canvas);
    tex.minFilter    = THREE.LinearFilter;
    tex.magFilter    = THREE.LinearFilter;
    tex.needsUpdate  = true;
    return tex;
  });
  const textureRef  = useRef(texture);
  const pulseRef    = useRef(0);

  useEffect(() => () => { texture.dispose(); }, [texture]);

  // Redraw canvas whenever energy/stasis changes
  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#1a4a4a';
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

    const ratio = Math.max(0, Math.min(1, (energy ?? maxEnergy) / maxEnergy));
    const pct   = ratio * 100;

    if (inStasis) {
      // Stasis: deep blue fill
      ctx.fillStyle = '#1a55ff';
    } else if (pct <= LOW_ENERGY_THRESHOLD) {
      // Low energy: amber
      ctx.fillStyle = '#ff8c00';
    } else {
      // Normal: neon cyan
      ctx.fillStyle = '#00ffff';
    }

    ctx.fillRect(1, 1, (canvas.width - 2) * ratio, canvas.height - 2);
    textureRef.current.needsUpdate = true;
  }, [canvas, energy, maxEnergy, inStasis]);

  // Pulse animation for low-energy state
  useFrame((_, delta) => {
    if (!inStasis && (energy / maxEnergy) * 100 <= LOW_ENERGY_THRESHOLD) {
      pulseRef.current = (pulseRef.current + delta * 4) % (Math.PI * 2);
      const intensity = 0.5 + 0.5 * Math.sin(pulseRef.current);
      const mat = (textureRef.current as any);
      // Intensity is baked into canvas — re-trigger needsUpdate each frame for pulse
      textureRef.current.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Energy bar sprite — positioned just below health bar */}
      <sprite scale={[0.8, 0.09, 1]} position={[0, -0.14, 0]}>
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>

      {/* STASIS overlay text */}
      {inStasis && (
        <Html distanceFactor={10} position={[0, -0.4, 0]} center>
          <div
            style={{
              fontSize:    '9px',
              fontWeight:  900,
              color:       '#88ccff',
              textShadow:  '0 0 8px rgba(100,160,255,0.9), 0 0 16px rgba(100,160,255,0.5)',
              letterSpacing: '0.15em',
              fontFamily:  'monospace',
              animation:   'stasis-pulse 1s ease-in-out infinite',
            }}
          >
            [STASIS]
          </div>
          <style>{`
            @keyframes stasis-pulse {
              0%,100% { opacity:0.6; }
              50%      { opacity:1;   }
            }
          `}</style>
        </Html>
      )}
    </>
  );
};

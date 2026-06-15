import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Color,
  Group,
  Mesh,
  AdditiveBlending,
  DoubleSide,
  FrontSide,
  InstancedMesh,
  Object3D,
  Vector3,
  BufferGeometry,
  Material
} from "three";
import { Billboard } from "@react-three/drei";
import { getGlobalAudioContext } from "../../../../../context/SoundContext";
import { IS_MOBILE } from "./constants";
import {
  createProceduralPlanetTexture,
  createProceduralCloudTexture,
  createProceduralMoonTextureColored,
  createProceduralRingTexture
} from "./textures";
import { GlowingDisk } from "./GlowingDisk";

const activePlanetDistances: Record<string, number> = {};

interface MoonConfig {
  scale: number;
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
  ref: React.RefObject<Mesh | null>;
}

interface RockConfig {
  radius: number;
  speed: number;
  angle: number;
  yOffset: number;
  sizeScale: number;
  rotX: number;
  rotY: number;
}

export interface ProceduralPlanetItemProps {
  pos: [number, number, number];
  scale: number;
  type: "gas" | "lava" | "ice" | "terrestrial" | "desert" | "plasma";
  color1: Color;
  color2: Color;
  rotationSpeed?: number;
  hasRings?: boolean;
  hasRockRings?: boolean;
  hasClouds?: boolean;
  moonsCount?: number;
  audioName?: "lava" | "ice" | "gas" | "desert" | "plasma" | "ocean" | "terrestrial";
}

export const ProceduralPlanetItem = ({
  pos,
  scale,
  type,
  color1,
  color2,
  rotationSpeed = 0.02,
  hasRings = false,
  hasRockRings = false,
  hasClouds = false,
  moonsCount = 0,
  audioName,
}: ProceduralPlanetItemProps) => {
  const { camera } = useThree();
  const planetRef = useRef<Group>(null);
  const cloudRef = useRef<Mesh>(null);
  const innerStormRef1 = useRef<Mesh>(null);
  const innerStormRef2 = useRef<Mesh>(null);
  const instancedMeshRef = useRef<InstancedMesh>(null);
  const _dummy = useMemo(() => new Object3D(), []);
  const sphereSegs = IS_MOBILE ? 32 : 64;
  const planetWorldPosRef = useRef(new Vector3());
  const camDirRef = useRef(new Vector3());
  const toPlanetRef = useRef(new Vector3());
  const audioNodesRef = useRef<{
    gainNode: GainNode;
    nodes: AudioNode[];
  } | null>(null);

  // Orbiting moons config
  const moons = useMemo<MoonConfig[]>(() => {
    const arr: MoonConfig[] = [];
    // Custom moon color palettes: volcanic orange-peach and dusty grey for Lava planet; bright silver-grey for others
    const moonColors = type === "lava"
      ? ["#b0b0b0", "#e59866", "#9e7a7a", "#dfa842"]
      : ["#ffffff", "#e5e5e5", "#d4d4d4", "#cc5533"];
    for (let i = 0; i < moonsCount; i++) {
      arr.push({
        scale: 0.22 + Math.random() * 0.05,       // Larger moon size (realistic relative to planet)
        orbitRadius: 2.6 + i * 0.8,               // Pushed out to avoid clipping
        orbitSpeed: 0.06 + Math.random() * 0.06,  // Slower, majestic orbital speed
        color: moonColors[i % moonColors.length],
        ref: React.createRef<Mesh>(),
      });
    }
    return arr;
  }, [moonsCount, type]);

  // Generate unique canvas textures
  const textures = useMemo(() => createProceduralPlanetTexture(type, color1, color2), [type, color1, color2]);
  const cloudTexture = useMemo(() => (hasClouds ? createProceduralCloudTexture() : null), [hasClouds]);
  const moonTextures = useMemo(() => {
    if (moonsCount <= 0) return [];
    return moons.map((moon, index) => createProceduralMoonTextureColored(type, index, moon.color));
  }, [moons, type, moonsCount]);
  const ringTexture = useMemo(() => (hasRings ? createProceduralRingTexture(color1) : null), [hasRings, color1]);

  // Dispose of old textures to prevent GPU memory leaks and WebGL context loss
  useEffect(() => {
    return () => {
      textures.map.dispose();
      if (textures.bumpMap) textures.bumpMap.dispose();
    };
  }, [textures]);

  useEffect(() => {
    return () => {
      if (cloudTexture) cloudTexture.dispose();
    };
  }, [cloudTexture]);

  useEffect(() => {
    return () => {
      moonTextures.forEach((texs) => {
        texs.map.dispose();
        texs.bumpMap.dispose();
      });
    };
  }, [moonTextures]);

  useEffect(() => {
    return () => {
      if (ringTexture) ringTexture.dispose();
    };
  }, [ringTexture]);

  // Orbiting rock ring particles config
  const rockRing = useMemo<RockConfig[]>(() => {
    if (!hasRockRings) return [];
    const count = 48;
    const arr: RockConfig[] = [];
    for (let i = 0; i < count; i++) {
      const radius = 2.0 + Math.random() * 0.95;
      const speed = 0.03 + Math.random() * 0.04;
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.12;
      const yOffset = (Math.random() - 0.5) * 0.06;
      const sizeScale = 0.02 + Math.random() * 0.03;
      arr.push({
        radius,
        speed,
        angle,
        yOffset,
        sizeScale,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [hasRockRings]);

  const startAudio = () => {
    if (audioNodesRef.current || !audioName) return;

    const ctx = getGlobalAudioContext();
    if (!ctx) return;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0; // Start silent
    gainNode.connect(ctx.destination);

    const nodes: AudioNode[] = [];

    try {
      if (audioName === "lava") {
        // 1. Base tectonic/magma rumble
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(55, ctx.currentTime);
        
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(120, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(1.5, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 35;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        osc.connect(filter);
        filter.connect(gainNode);
        
        osc.start();
        lfo.start();
        nodes.push(osc, lfo, filter, lfoGain);

        // 2. Volcanic Moon (Io-like) electromagnetic sweeping hum
        const moonOsc = ctx.createOscillator();
        moonOsc.type = "sine";
        moonOsc.frequency.setValueAtTime(180, ctx.currentTime);

        const moonFilter = ctx.createBiquadFilter();
        moonFilter.type = "bandpass";
        moonFilter.frequency.setValueAtTime(450, ctx.currentTime);
        moonFilter.Q.setValueAtTime(4.0, ctx.currentTime);

        const moonSweepLfo = ctx.createOscillator();
        moonSweepLfo.frequency.setValueAtTime(0.08, ctx.currentTime); // slow orbital sweep (12s cycle)
        const moonSweepGain = ctx.createGain();
        moonSweepGain.gain.value = 150;

        const moonVolLfo = ctx.createOscillator();
        moonVolLfo.frequency.setValueAtTime(0.08, ctx.currentTime);
        const moonVolGain = ctx.createGain();
        moonVolGain.gain.value = 0.04; // quiet sweep overlay

        moonSweepLfo.connect(moonSweepGain);
        moonSweepGain.connect(moonOsc.frequency);
        moonVolLfo.connect(moonVolGain.gain);
        
        moonOsc.connect(moonFilter);
        moonFilter.connect(moonVolGain);
        moonVolGain.connect(gainNode);

        moonOsc.start();
        moonSweepLfo.start();
        moonVolLfo.start();
        nodes.push(moonOsc, moonFilter, moonSweepLfo, moonSweepGain, moonVolLfo, moonVolGain);
      }
      else if (audioName === "plasma") {
        // 1. Base solar hum
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.4, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 18;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        const humGain = ctx.createGain();
        humGain.gain.value = 0.05;

        osc.connect(humGain);
        humGain.connect(gainNode);
        osc.start();
        lfo.start();
        nodes.push(osc, lfo, lfoGain, humGain);

        // 2. Solar static discharge crackles (rapid pulses)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          channelData[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = "highpass";
        hpFilter.frequency.setValueAtTime(1800, ctx.currentTime);

        const crackleLfo = ctx.createOscillator();
        crackleLfo.frequency.setValueAtTime(6.5, ctx.currentTime); // 6.5Hz crackle pulse
        const crackleGain = ctx.createGain();
        crackleGain.gain.value = 0;

        const lfoDepth = ctx.createGain();
        lfoDepth.gain.value = 0.015;

        crackleLfo.connect(lfoDepth.gain);
        noise.connect(hpFilter);
        hpFilter.connect(crackleGain);
        crackleGain.connect(gainNode);

        // Slow solar flare swells
        const swellLfo = ctx.createOscillator();
        swellLfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        const swellGain = ctx.createGain();
        swellGain.gain.value = 0.012;

        swellLfo.connect(swellGain.gain);
        hpFilter.connect(swellGain);
        swellGain.connect(gainNode);

        noise.start();
        crackleLfo.start();
        swellLfo.start();
        nodes.push(noise, hpFilter, crackleLfo, crackleGain, lfoDepth, swellLfo, swellGain);
      }
      else if (audioName === "desert") {
        // 1. Dune rumble (low noise)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          channelData[i] = Math.random() * 2 - 1;
        }
        const noise1 = ctx.createBufferSource();
        noise1.buffer = buffer;
        noise1.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(100, ctx.currentTime);

        const lowGain = ctx.createGain();
        lowGain.gain.value = 0.06;

        noise1.connect(lowpass);
        lowpass.connect(lowGain);
        lowGain.connect(gainNode);
        noise1.start();
        nodes.push(noise1, lowpass, lowGain);

        // 2. Modulated wind gusts
        const noise2 = ctx.createBufferSource();
        noise2.buffer = buffer;
        noise2.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = "bandpass";
        windFilter.frequency.setValueAtTime(450, ctx.currentTime);
        windFilter.Q.setValueAtTime(9.0, ctx.currentTime); // sharp resonance for whistling

        const windLfo = ctx.createOscillator();
        windLfo.frequency.setValueAtTime(0.18, ctx.currentTime); // wind gust cycles
        const windLfoGain = ctx.createGain();
        windLfoGain.gain.value = 220; // sweep whistling between 230Hz and 670Hz

        const windGain = ctx.createGain();
        windGain.gain.value = 0.04;

        windLfo.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency);
        noise2.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(gainNode);

        noise2.start();
        windLfo.start();
        nodes.push(noise2, windFilter, windLfo, windLfoGain, windGain);
      }
      else if (audioName === "terrestrial") {
        // 1. Ocean wave wash (lowpass white noise modulated by slow LFO)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          channelData[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const waveFilter = ctx.createBiquadFilter();
        waveFilter.type = "lowpass";
        waveFilter.frequency.setValueAtTime(350, ctx.currentTime);

        const waveLfo = ctx.createOscillator();
        waveLfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8-second wave swell
        const waveLfoGain = ctx.createGain();
        waveLfoGain.gain.value = 180;

        const waveGain = ctx.createGain();
        waveGain.gain.value = 0.05;

        waveLfo.connect(waveLfoGain);
        waveLfoGain.connect(waveFilter.frequency);
        noise.connect(waveFilter);
        waveFilter.connect(waveGain);
        waveGain.connect(gainNode);

        noise.start();
        waveLfo.start();
        nodes.push(noise, waveFilter, waveLfo, waveLfoGain, waveGain);

        // 2. Schumann planet hum (low G/D notes)
        const hum1 = ctx.createOscillator();
        hum1.type = "sine";
        hum1.frequency.setValueAtTime(73.42, ctx.currentTime); // D2 note
        
        const hum2 = ctx.createOscillator();
        hum2.type = "sine";
        hum2.frequency.setValueAtTime(110.00, ctx.currentTime); // A2 note

        const humGain = ctx.createGain();
        humGain.gain.value = 0.025; // soft hum

        hum1.connect(humGain);
        hum2.connect(humGain);
        humGain.connect(gainNode);

        hum1.start();
        hum2.start();
        nodes.push(hum1, hum2, humGain);

        // 3. Moon aurora chime/sweep
        const moonChime = ctx.createOscillator();
        moonChime.type = "sine";
        moonChime.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 celestial note

        const chimeFilter = ctx.createBiquadFilter();
        chimeFilter.type = "bandpass";
        chimeFilter.frequency.setValueAtTime(1046.50, ctx.currentTime);
        chimeFilter.Q.setValueAtTime(6.0, ctx.currentTime);

        const chimeLfo = ctx.createOscillator();
        chimeLfo.frequency.setValueAtTime(0.07, ctx.currentTime); // 14s cycle
        const chimeLfoGain = ctx.createGain();
        chimeLfoGain.gain.value = 250;

        const chimeVolLfo = ctx.createOscillator();
        chimeVolLfo.frequency.setValueAtTime(0.07, ctx.currentTime);
        const chimeVolGain = ctx.createGain();
        chimeVolGain.gain.value = 0.025;

        chimeLfo.connect(chimeLfoGain);
        chimeLfoGain.connect(moonChime.frequency);
        chimeVolLfo.connect(chimeVolGain.gain);

        moonChime.connect(chimeFilter);
        chimeFilter.connect(chimeVolGain);
        chimeVolGain.connect(gainNode);

        moonChime.start();
        chimeLfo.start();
        chimeVolLfo.start();
        nodes.push(moonChime, chimeFilter, chimeLfo, chimeLfoGain, chimeVolLfo, chimeVolGain);
      }
      else if (audioName === "gas") {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          channelData[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(320, ctx.currentTime);
        filter.Q.setValueAtTime(1.8, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.25, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 100;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        noise.connect(filter);
        filter.connect(gainNode);
        noise.start();
        lfo.start();
        nodes.push(noise, filter, lfo, lfoGain);
      }
      else if (audioName === "ice") {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(640, ctx.currentTime);
        
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.35;
        
        const fb = ctx.createGain();
        fb.gain.value = 0.35;
        
        osc.connect(delay);
        delay.connect(fb);
        fb.connect(delay);
        
        delay.connect(gainNode);
        osc.start();
        nodes.push(osc, delay, fb);
      }
      else if (audioName === "ocean") {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.4;
        
        lfo.connect(lfoGain);
        const tideGain = ctx.createGain();
        tideGain.gain.value = 0.6;
        lfoGain.connect(tideGain.gain);
        
        osc.connect(tideGain);
        tideGain.connect(gainNode);
        osc.start();
        lfo.start();
        nodes.push(osc, lfo, lfoGain, tideGain);
      }
    } catch (e) {
      console.error("Error creating planet synthesizer:", e);
    }

    audioNodesRef.current = { gainNode, nodes };
  };

  const stopAudio = () => {
    if (!audioNodesRef.current) return;
    try {
      audioNodesRef.current.nodes.forEach((node) => {
        try {
          if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
            node.stop();
          }
        } catch (e) {}
        try {
          node.disconnect();
        } catch (e) {}
      });
      audioNodesRef.current.gainNode.disconnect();
    } catch (e) {
      console.error("Error cleaning up planet sound:", e);
    }
    audioNodesRef.current = null;
  };

  // Dynamic sound loops
  useEffect(() => {
    if (!IS_MOBILE && audioName) {
      startAudio();
    }
    return () => {
      stopAudio();
    };
  }, [audioName]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Rotate planet mesh
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed * delta;
    }
    // Rotate clouds at different speed
    if (cloudRef.current) {
      cloudRef.current.rotation.y += (rotationSpeed * 1.35) * delta;
    }
    // Rotate inner storm shells for desert planet
    if (innerStormRef1.current) {
      innerStormRef1.current.rotation.y -= (rotationSpeed * 3.5) * delta;
      innerStormRef1.current.rotation.x += (rotationSpeed * 1.2) * delta;
    }
    if (innerStormRef2.current) {
      innerStormRef2.current.rotation.y += (rotationSpeed * 5.0) * delta;
      innerStormRef2.current.rotation.z -= (rotationSpeed * 1.8) * delta;
    }

    // Orbit moons
    moons.forEach((moon, idx) => {
      if (moon.ref.current) {
        const angle = time * moon.orbitSpeed + idx * Math.PI;
        moon.ref.current.position.set(
          Math.cos(angle) * moon.orbitRadius,
          Math.sin(angle) * 0.18 * moon.orbitRadius,
          Math.sin(angle) * moon.orbitRadius
        );
        moon.ref.current.rotation.y += 0.15 * delta;
      }
    });

    // Orbit rock ring particles
    if (hasRockRings && instancedMeshRef.current) {
      rockRing.forEach((rock, index) => {
        const currentAngle = time * rock.speed + rock.angle;
        rock.rotY += 0.5 * delta;
        rock.rotX += 0.2 * delta;

        _dummy.position.set(
          Math.cos(currentAngle) * rock.radius,
          rock.yOffset,
          Math.sin(currentAngle) * rock.radius
        );
        _dummy.rotation.set(rock.rotX, rock.rotY, 0);
        _dummy.scale.setScalar(rock.sizeScale);
        _dummy.updateMatrix();

        instancedMeshRef.current!.setMatrixAt(index, _dummy.matrix);
      });
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Modulate spatial audio based on distance + direction
    if (audioName) {
      const planetWorldPos = planetWorldPosRef.current.set(...pos);
      const camPos = camera.position;
      const dist = camPos.distanceTo(planetWorldPos);

      let isAllowed = true;
      if (IS_MOBILE) {
        const key = `${pos[0]},${pos[1]},${pos[2]}`;
        activePlanetDistances[key] = dist;

        const sortedKeys = Object.keys(activePlanetDistances).sort((a, b) => activePlanetDistances[a] - activePlanetDistances[b]);
        isAllowed = sortedKeys.indexOf(key) < 2;
      }

      if (isAllowed) {
        startAudio();
      } else {
        stopAudio();
      }

      if (audioNodesRef.current) {
        const ctx = getGlobalAudioContext();
        if (ctx) {
          // Proximity check (audible range scales dynamically based on planet size)
          const maxAudibleDist = scale * 22.0;
          let distVol = 0;
          if (dist < maxAudibleDist) {
            distVol = 1.0 - dist / maxAudibleDist; // 1.0 at center, 0.0 at max distance
          }

          // Look-at direction check
          const camDir = camDirRef.current;
          camera.getWorldDirection(camDir);
          const toPlanet = toPlanetRef.current.copy(planetWorldPos).sub(camPos).normalize();
          const dot = camDir.dot(toPlanet);

          let targetVol = 0;
          if (dot > 0.82 && distVol > 0) {
            const facingFactor = (dot - 0.82) / 0.18;
            targetVol = Math.pow(facingFactor, 2.0) * distVol * 0.14; // max volume 0.14
          }

          audioNodesRef.current.gainNode.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.15);
        }
      }
    }
  });

  return (
    <group position={pos} scale={scale}>
      {/* Rotatable body */}
      <group ref={planetRef}>
        <mesh>
          <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
          <meshStandardMaterial
            map={textures.map}
            side={FrontSide}
            roughness={type === "ice" ? 0.3 : 0.8}
            metalness={type === "ice" ? 0.8 : 0.1}
            emissive={type === "plasma" ? color1 : type === "lava" ? new Color("#ff3300") : new Color("#000000")}
            emissiveMap={type === "lava" ? textures.map : undefined}
            emissiveIntensity={type === "plasma" ? 1.4 : type === "lava" ? 1.8 : 0.0}
            bumpMap={textures.bumpMap}
            bumpScale={type === "lava" ? 0.045 : type === "desert" ? 0.035 : type === "terrestrial" ? 0.03 : type === "ice" ? 0.025 : 0.0}
          />
        </mesh>

        {/* Volumetric stormy interior for desert planet */}
        {type === "desert" && (
          <>
            <mesh scale={0.97}>
              <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
              <meshBasicMaterial
                map={textures.map}
                transparent
                opacity={0.65}
                side={FrontSide}
                depthWrite={false}
                blending={AdditiveBlending}
              />
            </mesh>
            <mesh scale={0.93} ref={innerStormRef1}>
              <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
              <meshBasicMaterial
                map={textures.map}
                transparent
                opacity={0.8}
                side={FrontSide}
                depthWrite={false}
              />
            </mesh>
            <mesh scale={0.85} ref={innerStormRef2}>
              <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
              <meshBasicMaterial
                map={textures.map}
                transparent
                opacity={0.9}
                side={FrontSide}
                depthWrite={false}
              />
            </mesh>
          </>
        )}

        {/* Habitable/Gas Clouds */}
        {hasClouds && cloudTexture && (
          <mesh scale={1.02} ref={cloudRef}>
            <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
            <meshStandardMaterial
              map={cloudTexture}
              transparent
              opacity={0.65}
              depthWrite={false}
              side={FrontSide}
            />
          </mesh>
        )}

        {/* Orbiting moons meshes */}
        {moons.map((moon, index) => (
          <mesh key={index} ref={moon.ref} scale={moon.scale}>
            <sphereGeometry args={[1, sphereSegs, sphereSegs]} />
            <meshStandardMaterial
              map={moonTextures[index]?.map}
              bumpMap={moonTextures[index]?.bumpMap}
              bumpScale={0.06}
              roughness={0.9}
              metalness={0.1}
              side={FrontSide}
            />
          </mesh>
        ))}
      </group>

      {/* Tilted Ring System */}
      {hasRings && ringTexture && (
        <mesh rotation={[Math.PI / 2.5, Math.PI / 12, 0]}>
          <ringGeometry args={[1.4, 2.4, 128]} />
          <meshBasicMaterial
            map={ringTexture}
            side={DoubleSide}
            transparent
            opacity={1.0}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Tilted Asteroid Ring Belt */}
      {hasRockRings && (
        <group rotation={[0.15, 0, 0]}>
          <instancedMesh ref={instancedMeshRef} args={[null as unknown as BufferGeometry, null as unknown as Material, 48]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={color1.clone().lerp(new Color("#332b3d"), 0.55)}
              roughness={0.9}
              metalness={0.2}
              flatShading
            />
          </instancedMesh>
        </group>
      )}

      {/* Outer atmosphere halo (Concentric 2D Billboarded GlowingDisk, starting exactly at the planet's edge) */}
      <Billboard>
        <GlowingDisk
          minRadius={0.98}
          maxRadius={1.38}
          opacityMultiplier={type === "plasma" ? 1.3 : type === "terrestrial" ? 0.95 : 0.8}
          colorIn={type === "terrestrial" ? new Color("#38bdf8") : color1}
          colorOut={new Color("#000000")}
        />
      </Billboard>
    </group>
  );
};
export default ProceduralPlanetItem;

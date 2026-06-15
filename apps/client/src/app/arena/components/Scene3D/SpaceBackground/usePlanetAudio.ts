import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { getGlobalAudioContext } from "../../../../../context/SoundContext";
import { IS_MOBILE } from "./constants";

const activePlanetDistances: Record<string, number> = {};

export const usePlanetAudio = (
  pos: [number, number, number],
  scale: number,
  audioName?: "lava" | "ice" | "gas" | "desert" | "plasma" | "ocean" | "terrestrial"
) => {
  const { camera } = useThree();
  const planetWorldPosRef = useRef(new Vector3());
  const camDirRef = useRef(new Vector3());
  const toPlanetRef = useRef(new Vector3());
  const audioNodesRef = useRef<{
    gainNode: GainNode;
    nodes: AudioNode[];
  } | null>(null);

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
        // 1. Ocean wave wash (lowpass white noise modulated by LFO)
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

  useEffect(() => {
    if (!IS_MOBILE && audioName) {
      startAudio();
    }
    return () => {
      stopAudio();
    };
  }, [audioName]);

  useFrame((state) => {
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
};

import { getGlobalAudioContext } from "../../../../../context/SoundContext";

export const playExplosionSound = (distance: number) => {
  const ctx = getGlobalAudioContext();
  if (!ctx || ctx.state !== "running") return;

  // Simulate speed of sound delay (distance / speed)
  const speedOfSound = 220; // Units per second
  const delay = distance / speedOfSound;
  const playTime = ctx.currentTime + delay;

  // 1. Deep Sub-bass Impact Thump (low frequency sine sweep)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, playTime);
  osc.frequency.exponentialRampToValueAtTime(10, playTime + 0.8);

  // 2. Volumetric noise explosion rumble/crackle
  const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    channelData[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(250, playTime);
  filter.frequency.exponentialRampToValueAtTime(30, playTime + 1.2);
  filter.Q.setValueAtTime(2.0, playTime);

  // Gain Node with distance attenuation
  const gainNode = ctx.createGain();
  const maxAudibleDist = 950;
  let vol = 1.0 - Math.min(distance / maxAudibleDist, 1.0);
  vol = Math.pow(vol, 1.5) * 0.95; // realistic sound attenuation curve

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.setValueAtTime(vol, playTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + 1.4);

  // Connections
  osc.connect(gainNode);
  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(playTime);
  osc.stop(playTime + 1.5);
  noise.start(playTime);
  noise.stop(playTime + 1.5);
};

export const playSatellitePing = (distance: number) => {
  const ctx = getGlobalAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  
  // 1. Deep, warm frequency (instead of high-pitch meow)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(240, now); // Warm, deep sonar-like frequency (240Hz)

  // 2. Soft sub-harmonics for warmth
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(120, now); // Sub-bass octave (120Hz)

  // Biquad lowpass filter to muffle high-frequency transients and make it deep
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(350, now); // Cut off any buzz

  // Gain node with distance attenuation
  const gainNode = ctx.createGain();
  const maxAudibleDist = 380; // Highly localized (silent at the arena which is ~566 units away)
  
  let vol = 1.0 - Math.min(distance / maxAudibleDist, 1.0);
  vol = Math.pow(vol, 2.5) * 0.14; // Soft volume curve

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(vol, now + 0.05); // slightly slower attack (50ms) for soft hum
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8); // Fades over 0.8s (longer, smoother decay)

  // Soft echo loop to give space vacuum depth
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.22; // 220ms echo

  const feedback = ctx.createGain();
  feedback.gain.value = 0.25; // quieter echo feedback loop

  gainNode.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  
  gainNode.connect(ctx.destination);
  delay.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.9);
  osc2.start(now);
  osc2.stop(now + 0.9);

  setTimeout(() => {
    osc.disconnect();
    osc2.disconnect();
    filter.disconnect();
    gainNode.disconnect();
    delay.disconnect();
    feedback.disconnect();
  }, 2000);
};

// ---------------------------------------------------------------------------
// COSMIC MONOLITH: RESIDUAL QUANTUM GRAVITATIONAL DRONE
// ---------------------------------------------------------------------------
let monolithOsc1: OscillatorNode | null = null;
let monolithOsc2: OscillatorNode | null = null;
let monolithFilter: BiquadFilterNode | null = null;
let monolithGain: GainNode | null = null;
let isMonolithPlaying = false;

export const updateMonolithAudio = (distance: number, observerAlignment: number) => {
  const ctx = getGlobalAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const maxAudibleDist = 650;
  if (distance > maxAudibleDist) {
    if (isMonolithPlaying && monolithGain) {
      monolithGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
    }
    return;
  }

  // Calculate volume attenuation: inverse quadratic with observer alignment boost
  const normDist = 1.0 - Math.min(distance / maxAudibleDist, 1.0);
  const targetGain = Math.pow(normDist, 2.0) * (0.04 + observerAlignment * 0.05);

  if (!isMonolithPlaying || !monolithGain || !monolithOsc1) {
    try {
      const now = ctx.currentTime;
      monolithOsc1 = ctx.createOscillator();
      monolithOsc2 = ctx.createOscillator();
      monolithFilter = ctx.createBiquadFilter();
      monolithGain = ctx.createGain();

      // Deep 48Hz cosmic gravitational tone
      monolithOsc1.type = "sine";
      monolithOsc1.frequency.setValueAtTime(48, now);

      // Inharmonic alien tritone 72Hz
      monolithOsc2.type = "triangle";
      monolithOsc2.frequency.setValueAtTime(72, now);

      // Resonant bandpass filter mimicking spatial cavity resonance
      monolithFilter.type = "bandpass";
      monolithFilter.frequency.setValueAtTime(140, now);
      monolithFilter.Q.setValueAtTime(4.0, now);

      monolithGain.gain.setValueAtTime(0.0001, now);
      monolithGain.gain.setTargetAtTime(targetGain, now, 0.2);

      monolithOsc1.connect(monolithFilter);
      monolithOsc2.connect(monolithFilter);
      monolithFilter.connect(monolithGain);
      monolithGain.connect(ctx.destination);

      monolithOsc1.start(now);
      monolithOsc2.start(now);
      isMonolithPlaying = true;
    } catch {
      // AudioContext state or autoplay policy restriction
    }
  } else {
    // Continuously modulate frequency and gain smoothly
    const now = ctx.currentTime;
    monolithGain.gain.setTargetAtTime(targetGain, now, 0.05);
    if (monolithFilter) {
      // Modulate resonant frequency based on observer alignment (quantum excitation)
      const targetFreq = 140 + observerAlignment * 120;
      monolithFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);
    }
  }
};

export const stopMonolithAudio = () => {
  const ctx = getGlobalAudioContext();
  if (!ctx || !isMonolithPlaying) return;

  if (monolithGain) {
    monolithGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
  }

  setTimeout(() => {
    try {
      monolithOsc1?.stop();
      monolithOsc2?.stop();
      monolithOsc1?.disconnect();
      monolithOsc2?.disconnect();
      monolithFilter?.disconnect();
      monolithGain?.disconnect();
    } catch {
      // Already stopped
    } finally {
      monolithOsc1 = null;
      monolithOsc2 = null;
      monolithFilter = null;
      monolithGain = null;
      isMonolithPlaying = false;
    }
  }, 100);
};


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

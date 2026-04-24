import { performance } from 'node:perf_hooks';

export const requestAnimationFrame = (callback: FrameRequestCallback) =>
  (setTimeout(() => callback(performance.now()), 1000 / 60) as unknown) as number;

export const cancelAnimationFrame = (id: number) => clearTimeout(id);

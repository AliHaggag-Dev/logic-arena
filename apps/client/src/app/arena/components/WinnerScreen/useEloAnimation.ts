import { useEffect, useState } from 'react';

const ELO_ANIMATION_DURATION_MS = 1000;
const ELO_TICK_INTERVAL_MS = 16;

export function useEloAnimation(targetDelta: number): number {
  const [displayDelta, setDisplayDelta] = useState<number>(0);

  useEffect(() => {
    if (targetDelta === 0) {
      setDisplayDelta(0);
      return;
    }

    const totalTicks = Math.ceil(ELO_ANIMATION_DURATION_MS / ELO_TICK_INTERVAL_MS);
    const absTarget = Math.abs(targetDelta);
    const sign = targetDelta > 0 ? 1 : -1;
    let currentTick = 0;

    const interval = window.setInterval(() => {
      currentTick++;
      const progress = Math.min(currentTick / totalTicks, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayDelta(Math.round(eased * absTarget) * sign);

      if (currentTick >= totalTicks) {
        window.clearInterval(interval);
      }
    }, ELO_TICK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [targetDelta]);

  return displayDelta;
}

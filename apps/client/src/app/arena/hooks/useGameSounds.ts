import { useMemo } from "react";
import useSound from "use-sound";

const HIT_SOUND_URL   = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";
const CLANG_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2559/2559-preview.mp3";
const LASER_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2587/2587-preview.mp3";

const NOOP = () => { /* sound disabled */ };

type GameSoundOptions = {
  volume?:  number;
  enabled?: boolean;
};

export const useGameSounds = ({ volume = 0.5, enabled = true }: GameSoundOptions = {}) => {
  const common = useMemo(() => ({ volume: enabled ? volume : 0, preload: true }), [volume, enabled]);

  const [playHitRaw]   = useSound(HIT_SOUND_URL,   common);
  const [playClangRaw] = useSound(CLANG_SOUND_URL, common);
  const [playLaserRaw] = useSound(LASER_SOUND_URL, common);

  return {
    playHit:   enabled ? playHitRaw   : NOOP,
    playClang: enabled ? playClangRaw : NOOP,
    playLaser: enabled ? playLaserRaw : NOOP,
  };
};
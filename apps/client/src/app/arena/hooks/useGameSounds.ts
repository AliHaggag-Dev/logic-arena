import { useMemo } from "react";
import useSound from "use-sound";

const HIT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";
const CLANG_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2559/2559-preview.mp3";
const LASER_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2587/2587-preview.mp3";

type GameSoundOptions = {
  volume?: number;
};

export const useGameSounds = ({ volume = 0.5 }: GameSoundOptions = {}) => {
  const common = useMemo(() => ({ volume, preload: true }), [volume]);

  const [playHit] = useSound(HIT_SOUND_URL, common);
  const [playClang] = useSound(CLANG_SOUND_URL, common);
  const [playLaser] = useSound(LASER_SOUND_URL, common);

  return {
    playHit,
    playClang,
    playLaser
  };
};
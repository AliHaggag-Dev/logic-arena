import { Robot, KothModeData, CtfModeData, SurvivalModeData } from '@logic-arena/engine';

export const KOTH_ZONE_RADIUS = 80;
export const KOTH_ZONE_CENTER_X = 400;
export const KOTH_ZONE_CENTER_Y = 300;
export const KOTH_SCORE_TARGET = 300;
export const CTF_FLAG_PICKUP_RADIUS = 25;
export const CTF_FLAG_CAPTURE_RADIUS = 30;
export const CTF_SCORE_TARGET = 3;
export const SURVIVAL_BASE_ENEMIES = 3;
export const SURVIVAL_MAX_ENEMIES = 12;
export const SURVIVAL_HEALTH_BOOST_INTERVAL = 5;

function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function processKothTick(robots: Robot[], modeData: KothModeData): KothModeData {
  const teamsInZone = new Set<string>();
  
  for (const robot of robots) {
    if (!robot.isAlive) continue;
    const distance = getDistance(robot.position.x, robot.position.y, modeData.zone.x, modeData.zone.y);
    if (distance <= modeData.zone.radius) {
      teamsInZone.add(robot.team);
    }
  }

  if (teamsInZone.size === 1) {
    const capturingTeam = Array.from(teamsInZone)[0];
    if (!modeData.zoneScores[capturingTeam]) {
      modeData.zoneScores[capturingTeam] = 0;
    }
    modeData.zoneScores[capturingTeam]++;
  }

  return modeData;
}

export function processCtfTick(robots: Robot[], modeData: CtfModeData): CtfModeData {
  for (const flag of modeData.flags) {
    if (!flag.carrierId) {
      // Flag is dropped or at base. Check for pickup.
      for (const robot of robots) {
        if (!robot.isAlive || robot.team === flag.team) continue;
        const distance = getDistance(robot.position.x, robot.position.y, flag.position.x, flag.position.y);
        if (distance <= CTF_FLAG_PICKUP_RADIUS) {
          flag.carrierId = robot.id;
          flag.atBase = false;
          break;
        }
      }
    } else {
      // Flag is carried
      const carrier = robots.find(r => r.id === flag.carrierId);
      if (!carrier || !carrier.isAlive) {
        // Carrier died, drop flag
        flag.carrierId = undefined;
        flag.atBase = false;
      } else {
        // Update flag position to carrier
        flag.position.x = carrier.position.x;
        flag.position.y = carrier.position.y;

        // Check for capture (carrier reached their own base)
        const carrierBase = modeData.bases[carrier.team];
        if (carrierBase) {
          const distanceToBase = getDistance(carrier.position.x, carrier.position.y, carrierBase.x, carrierBase.y);
          if (distanceToBase <= CTF_FLAG_CAPTURE_RADIUS) {
            // Capture!
            if (!modeData.teamScores[carrier.team]) {
              modeData.teamScores[carrier.team] = 0;
            }
            modeData.teamScores[carrier.team]++;
            
            // Reset flag
            flag.carrierId = undefined;
            flag.atBase = true;
            const originalBase = modeData.bases[flag.team];
            if (originalBase) {
              flag.position = { ...originalBase };
            }
          }
        }
      }
    }
  }
  return modeData;
}

export function processSurvivalTick(robots: Robot[], modeData: SurvivalModeData): { modeData: SurvivalModeData; waveComplete: boolean } {
  const aliveEnemies = robots.filter(r => r.id.startsWith('dummy-') && r.isAlive && r.health > 0);
  modeData.enemiesRemaining = aliveEnemies.length;

  if (modeData.enemiesRemaining === 0) {
    modeData.wave++;
    return { modeData, waveComplete: true };
  }

  return { modeData, waveComplete: false };
}

export function processRacingTick(robots: Robot[], modeData: import('@logic-arena/engine').RacingModeData): import('@logic-arena/engine').RacingModeData {
  if (modeData.winnerId) return modeData;
  
  for (const robot of robots) {
    if (!robot.isAlive) continue;
    // Simple finish line collision check (x > finishLine.x)
    if (robot.position.x >= modeData.finishLine.x) {
      modeData.winnerId = robot.id;
      // In a real implementation we could handle laps, but for now reaching the line wins
      break;
    }
  }
  
  return modeData;
}

import { Robot, Vector2 } from '@logic-arena/engine';
import { Parser } from '../../../../../packages/logic-parser/src';
import { LogicEvaluator } from '../../game/core/evaluator/logic-facade';

const ROBOT_COLORS = ['#00ffff', '#ff00ff'];

/**
 * Default spawn positions for arena / lobby matches.
 * These corners are intentionally spread apart for strategic play.
 */
const SPAWN_POSITIONS = [
  { x: 150, y: 150 },
  { x: 650, y: 450 },
  { x: 650, y: 150 },
  { x: 150, y: 450 },
];

export function createRobot(
  id: string,
  script: string,
  index: number,
  colorOverride?: string,
  modelOverride?: string,
  tracerColorOverride?: string,
  spawnPositionOverride?: Vector2,
  initialFovDirection?: number,
): Robot {
  const spawn = spawnPositionOverride ?? SPAWN_POSITIONS[index % SPAWN_POSITIONS.length];
  const facing = initialFovDirection ?? 0;
  return {
    id,
    position: { ...spawn },
    health: 100,
    color: colorOverride || ROBOT_COLORS[index % ROBOT_COLORS.length],
    model: modelOverride || 'unit-01',
    tracerColor: tracerColorOverride || '#ff0000',
    velocity: { x: 0, y: 0 },
    rotation: facing,
    facingDirection: facing,
    isAlive: true,
    team: index % 2 === 0 ? 'A' : 'B',
    lastActionTime: 0,
    code: script,
    memory: {},
    // Energy fields — EnergyManager.initRobot() will also set these,
    // but we set them here for clarity and to avoid undefined on first tick.
    energy: 100,
    maxEnergy: 100,
    inStasis: false,
    totalEnergyConsumed: 0,
    totalDamageDealt: 0,
    // FOV fields
    fov: { angle: 120, range: 300 },
    fovDirection: facing,
    visibleEntities: { robots: [], projectiles: [], obstacles: [] },
  };
}

export function parseAndSetLogic(
  id: string,
  script: string,
  logicEvaluator: LogicEvaluator,
): void {
  try {
    const parser = new Parser(script);
    const ast = parser.parse();
    logicEvaluator.setLogic(id, ast);
  } catch (e) {
    console.error(`[RobotFactory] Error parsing script for robot ${id}:`, e);
  }
}

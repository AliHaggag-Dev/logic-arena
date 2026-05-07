import { Robot } from '@logic-arena/engine';
import { Parser } from '../../../../../packages/logic-parser/src';
import { LogicEvaluator } from '../../game/core/evaluator/logic-facade';

const ROBOT_COLORS = ['#00ffff', '#ff00ff'];

/**
 * Spawn positions spread apart so robots don't overlap at match start.
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
): Robot {
  const spawn = SPAWN_POSITIONS[index % SPAWN_POSITIONS.length];
  return {
    id,
    position: { ...spawn },
    health: 100,
    color: colorOverride || ROBOT_COLORS[index % ROBOT_COLORS.length],
    model: modelOverride || 'unit-01',
    tracerColor: tracerColorOverride || '#ff0000',
    velocity: { x: 0, y: 0 },
    rotation: 0,
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
    fovDirection: 0,
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
    console.log(
      `[RobotFactory] Parsed AST for ${id}:`,
      JSON.stringify(ast.body),
    );
    logicEvaluator.setLogic(id, ast);
  } catch (e) {
    console.error(`[RobotFactory] Error parsing script for robot ${id}:`, e);
  }
}

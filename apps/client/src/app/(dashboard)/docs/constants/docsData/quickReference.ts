import {
  BarChart3,
  Braces,
  Brackets,
  Brain,
  Calculator,
  Eye,
  Hexagon,
  Move,
  Radar,
  RadioReceiver,
  RotateCw,
  ServerCrash,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface QuickRefDoc {
  title: string;
  icon: LucideIcon;
  color: string;
  commands: string[];
}

export const QUICK_REF: QuickRefDoc[] = [
  { title: 'CONTROL FLOW', icon: Hexagon, color: 'var(--docs-orange)', commands: ['IF...ELSE', 'WHILE...DO', 'FOR...TO', 'FUNCTION', 'CALL', 'END'] },
  { title: 'SENSORS / FOV', icon: Eye, color: 'var(--docs-cyan-dark)', commands: ['SCAN (blocked in STASIS)', 'WAIT', 'CAN_SEE_ENEMY', 'NEAREST_VISIBLE_X/Y', 'CAN_SEE_OBSTACLE'] },
  { title: 'MOVEMENT & VISION', icon: Move, color: 'var(--docs-green)', commands: ['rotation / angle / rot', 'fovDirection (Eye)', 'lockVision (Link)', 'SET rotation = 1.57', 'PATHFIND'] },
  { title: 'ENERGY', icon: Zap, color: 'var(--docs-purple)', commands: ['MY_ENERGY (0–100)', 'ENERGY_PCT', 'IN_STASIS', 'Regen: +3/tick in STASIS only'] },
  { title: 'INTELLIGENCE', icon: Brain, color: 'var(--docs-indigo)', commands: ['SET var = val', 'Math (+,-,*,/,%)', 'NOT / AND / OR', 'TRUE / FALSE'] },
  { title: 'ROTATION SYSTEM', icon: RotateCw, color: 'var(--docs-orange)', commands: ['rotation = body', 'fovDirection = eyes', 'lockVision = link', 'SET lockVision = TRUE', 'Auto-disables on SET'] },
  { title: 'STATUS QUERIES', icon: BarChart3, color: 'var(--docs-cyan-dark)', commands: ['GET_HEALTH()', 'GET_ENERGY()', 'GET_POSITION()', 'GET_DISTANCE()'] },
  { title: 'MATH STDLIB', icon: Calculator, color: 'var(--docs-orange)', commands: ['ABS(x)', 'SQRT(x)', 'ATAN2(y, x)', 'SIN / COS', 'POW / MIN / MAX', 'FLOOR / CEIL / ROUND'] },
  { title: 'ARRAYS', icon: Brackets, color: 'var(--docs-indigo)', commands: ['SET arr = [1, 2, 3]', 'arr[index]', 'LENGTH(arr)', 'PUSH(arr, val)', 'POP(arr)'] },
  { title: 'DICTIONARIES / STATE', icon: Braces, color: 'var(--docs-rose)', commands: ['SET obj = { k: "v" }', 'obj.key', 'obj["key"]', 'SET obj.key = val'] },
  { title: 'ADVANCED SENSORS', icon: Radar, color: 'var(--docs-pink)', commands: ['GET_ALL_VISIBLE_ENEMIES()', 'Returns [dist, x, y, hp][]', 'RAYCAST(angle)', 'Returns dist to first hit'] },
  { title: 'SWARM INTELLIGENCE', icon: RadioReceiver, color: 'var(--docs-emerald)', commands: ['BROADCAST(data)', 'Returns recipient count', 'RECEIVE()', 'Returns Array of messages'] },
  { title: 'SYSTEM LIMITS', icon: ServerCrash, color: 'var(--docs-red)', commands: ['2000 Operations / Tick', 'Exceeding Quota = TLE Crash', 'WHILE loops cap at 10 iters'] },
];

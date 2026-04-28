import { Suggestion } from './types';

export const LINE_HEIGHT = 20;

export const AUTOCOMPLETE_SUGGESTIONS: Suggestion[] = [
    // Commands
    { label: 'MOVE', detail: 'command', hint: 'Move forward at standard speed' },
    { label: 'MOVE_FAST', detail: 'command', hint: 'Move forward at 2× speed' },
    { label: 'STOP', detail: 'command', hint: 'Halt all movement' },
    { label: 'BACKUP', detail: 'command', hint: 'Move in reverse' },
    { label: 'PATHFIND', detail: 'command', hint: 'A* pathfind toward target' },
    { label: 'FIRE', detail: 'command', hint: 'Single shot at nearest enemy' },
    { label: 'BURST_FIRE', detail: 'command', hint: 'Multi-shot burst at enemy' },
    { label: 'SCAN', detail: 'command', hint: 'Rotate FOV cone +15°' },
    { label: 'WAIT', detail: 'command', hint: 'Pause execution for N ticks' },
    // Control Flow
    { label: 'IF', detail: 'control', hint: 'Conditional branch' },
    { label: 'WHILE', detail: 'control', hint: 'Loop while condition is true' },
    { label: 'FUNCTION', detail: 'control', hint: 'Define a reusable function' },
    { label: 'CALL', detail: 'control', hint: 'Call a function by name' },
    { label: 'SET', detail: 'control', hint: 'Assign a variable' },
    // Queries
    { label: 'GET_HEALTH()', detail: 'query', hint: 'Print health to logs' },
    { label: 'GET_ENERGY()', detail: 'query', hint: 'Print energy to logs' },
    { label: 'GET_ENERGY_PCT()', detail: 'query', hint: 'Print energy % to logs' },
    { label: 'GET_DISTANCE()', detail: 'query', hint: 'Print nearest enemy distance' },
    { label: 'GET_POSITION()', detail: 'query', hint: 'Print current {x, y} position' },
    { label: 'GET_ROTATION()', detail: 'query', hint: 'Print body facing angle' },
    { label: 'GET_FOV_DIR()', detail: 'query', hint: 'Print scanner facing angle' },
    { label: 'GET_VISIBLE_COUNT()', detail: 'query', hint: 'Print # enemies in FOV' },
    // Identifiers (readable)
    { label: 'rotation', detail: 'identifier', hint: 'Body facing angle (radians). Writable.' },
    { label: 'angle', detail: 'identifier', hint: 'Alias for rotation' },
    { label: 'rot', detail: 'identifier', hint: 'Alias for rotation' },
    { label: 'fovDirection', detail: 'identifier', hint: 'Scanner facing angle (radians). Independent from body.' },
    { label: 'lockVision', detail: 'flag', hint: 'SET to TRUE to lock scanner to body rotation' },
    { label: 'energy', detail: 'identifier', hint: 'Alias – use MY_ENERGY' },
    { label: 'distance', detail: 'identifier', hint: 'Distance to nearest VISIBLE enemy' },
    { label: 'health', detail: 'identifier', hint: 'Current robot HP (0–100)' },
    { label: 'MY_ENERGY', detail: 'identifier', hint: 'Current energy (0–1000)' },
    { label: 'ENERGY_PCT', detail: 'identifier', hint: 'Energy as percentage (0–100)' },
    { label: 'IN_STASIS', detail: 'identifier', hint: 'True when energy ≤ 0' },
    { label: 'CAN_SEE_ENEMY', detail: 'identifier', hint: 'True if enemy is in FOV cone' },
    { label: 'spotted', detail: 'identifier', hint: 'Alias for CAN_SEE_ENEMY' },
    { label: 'NEAREST_VISIBLE_X', detail: 'identifier', hint: 'X of nearest visible enemy' },
    { label: 'NEAREST_VISIBLE_Y', detail: 'identifier', hint: 'Y of nearest visible enemy' },
];

export const DETAIL_COLORS: Record<string, string> = {
    command: '#22d3ee',
    control: '#f59e0b',
    identifier: '#a855f7',
    flag: '#4ade80',
    query: '#06b6d4',
};

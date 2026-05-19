export const SIM_TICK_MS = 120;

export const SIMULATE_CMDS: { label: string; cmds: string[] }[] = [
    { label: 'SCAN loop',       cmds: ['SCAN', 'MOVE'] },
    { label: 'PATHFIND + FIRE', cmds: ['PATHFIND', 'FIRE'] },
    { label: 'BURST sniper',    cmds: ['SCAN', 'PATHFIND', 'BURST_FIRE'] },
    { label: 'Pure movement',   cmds: ['MOVE_FAST'] },
];

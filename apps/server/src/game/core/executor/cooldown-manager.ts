export class CooldownManager {
    private lastFireTime: Map<string, number> = new Map();
    private lastExecutedAction: Map<string, string> = new Map();
    private lastLogicEmitTime: Map<string, number> = new Map();
    private actionCooldowns: Map<string, Map<string, number>> = new Map();
    private queryEmits: Set<string> = new Set();

    private readonly FIRE_COOLDOWN_MS = 500;
    private readonly ACTION_COOLDOWN_MS = 500;

    isOffCooldown(robotId: string, actionCommand: string): boolean {
        const now = Date.now();
        const robotCooldowns = this.actionCooldowns.get(robotId) ?? new Map();
        if (!this.actionCooldowns.has(robotId)) this.actionCooldowns.set(robotId, robotCooldowns);
        return now - (robotCooldowns.get(actionCommand) ?? 0) >= this.ACTION_COOLDOWN_MS;
    }

    markExecuted(robotId: string, actionCommand: string): void {
        const now = Date.now();
        const robotCooldowns = this.actionCooldowns.get(robotId) ?? new Map();
        if (!this.actionCooldowns.has(robotId)) this.actionCooldowns.set(robotId, robotCooldowns);
        robotCooldowns.set(actionCommand, now);
    }

    isFireOffCooldown(robotId: string): boolean {
        return Date.now() - (this.lastFireTime.get(robotId) ?? 0) >= this.FIRE_COOLDOWN_MS;
    }

    markFired(robotId: string): void {
        this.lastFireTime.set(robotId, Date.now());
    }

    shouldEmitAction(robotId: string, actionCommand: string): boolean {
        const now = Date.now();
        const actionChanged = actionCommand !== this.lastExecutedAction.get(robotId);
        const throttleOk = now - (this.lastLogicEmitTime.get(robotId) ?? 0) > 250;
        return actionChanged && throttleOk;
    }

    shouldEmitQuery(robotId: string, queryName: string): boolean {
        const key = `${robotId}-${queryName}`;
        if (this.queryEmits.has(key)) {
            return false; // Only emit once per script execution
        }
        return true;
    }

    markQueryEmitted(robotId: string, queryName: string): void {
        const key = `${robotId}-${queryName}`;
        this.queryEmits.add(key);
        const now = Date.now();
        const robotCooldowns = this.actionCooldowns.get(robotId) ?? new Map();
        if (!this.actionCooldowns.has(robotId)) this.actionCooldowns.set(robotId, robotCooldowns);
        robotCooldowns.set(`QUERY_${queryName}`, now);
    }

    markEmitted(robotId: string, actionCommand: string): void {
        this.lastLogicEmitTime.set(robotId, Date.now());
        this.lastExecutedAction.set(robotId, actionCommand);
    }

    clearState(robotId: string): void {
        this.lastExecutedAction.delete(robotId);
        this.lastLogicEmitTime.delete(robotId);
        this.actionCooldowns.set(robotId, new Map());
        for (const key of this.queryEmits) {
            if (key.startsWith(`${robotId}-`)) {
                this.queryEmits.delete(key);
            }
        }
    }
}
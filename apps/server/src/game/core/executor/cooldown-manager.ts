export class CooldownManager {
  private lastFireTime: Map<string, number> = new Map();
  private lastExecutedAction: Map<string, string> = new Map();
  private lastLogicEmitTime: Map<string, number> = new Map();
  private lastStasisEmitTime: Map<string, number> = new Map();
  private actionCooldowns: Map<string, Map<string, number>> = new Map();
  private queryEmits: Set<string> = new Set();

  /** Per-robot-command last-emit timestamps for non-continuous commands. */
  private lastNonContinuousEmit: Map<string, number> = new Map();

  static readonly CONTINUOUS_COMMANDS = new Set([
    'MOVE', 'MOVE_FAST', 'BACKUP', 'STOP',
  ]);

  private readonly FIRE_COOLDOWN_MS = 500;
  private readonly ACTION_COOLDOWN_MS = 500;

  isOffCooldown(robotId: string, actionCommand: string): boolean {
    const now = Date.now();
    const robotCooldowns = this.actionCooldowns.get(robotId) ?? new Map();
    if (!this.actionCooldowns.has(robotId))
      this.actionCooldowns.set(robotId, robotCooldowns);
    return (
      now - (robotCooldowns.get(actionCommand) ?? 0) >= this.ACTION_COOLDOWN_MS
    );
  }

  markExecuted(robotId: string, actionCommand: string): void {
    const now = Date.now();
    const robotCooldowns = this.actionCooldowns.get(robotId) ?? new Map();
    if (!this.actionCooldowns.has(robotId))
      this.actionCooldowns.set(robotId, robotCooldowns);
    robotCooldowns.set(actionCommand, now);
  }

  isFireOffCooldown(robotId: string): boolean {
    return (
      Date.now() - (this.lastFireTime.get(robotId) ?? 0) >=
      this.FIRE_COOLDOWN_MS
    );
  }

  markFired(robotId: string): void {
    this.lastFireTime.set(robotId, Date.now());
  }

  /**
   * Continuous commands → emit only when the tracked "active" continuous
   * command changes (tracked separately from non-continuous in markEmitted).
   *
   * Non-continuous commands → emit at most once per 1000ms per command.
   * This prevents alternating spam (e.g. PATHFIND / STOP flip-flopping
   * every 50 ms tick) while still showing each meaningful event.
   */
  shouldEmitAction(robotId: string, actionCommand: string): boolean {
    if (CooldownManager.CONTINUOUS_COMMANDS.has(actionCommand)) {
      const lastAction = this.lastExecutedAction.get(robotId);
      return actionCommand !== lastAction;
    }

    const key = `${robotId}\0${actionCommand}`;
    const lastEmit = this.lastNonContinuousEmit.get(key) ?? 0;
    return Date.now() - lastEmit >= 1000;
  }

  shouldEmitQuery(robotId: string, queryName: string): boolean {
    const key = `${robotId}-${queryName}`;
    if (this.queryEmits.has(key)) {
      return false;
    }
    return true;
  }

  markQueryEmitted(robotId: string, queryName: string): void {
    const key = `${robotId}-${queryName}`;
    this.queryEmits.add(key);
    const now = Date.now();
    const robotCooldowns = this.actionCooldowns.get(robotId) ?? new Map();
    if (!this.actionCooldowns.has(robotId))
      this.actionCooldowns.set(robotId, robotCooldowns);
    robotCooldowns.set(`QUERY_${queryName}`, now);
  }

  /**
   * Continuous commands → update lastExecutedAction (the "active state").
   * Non-continuous commands → only update their own per-command timestamp
   * without polluting the continuous tracking.
   */
  markEmitted(robotId: string, actionCommand: string): void {
    if (CooldownManager.CONTINUOUS_COMMANDS.has(actionCommand)) {
      this.lastExecutedAction.set(robotId, actionCommand);
    } else {
      const key = `${robotId}\0${actionCommand}`;
      this.lastNonContinuousEmit.set(key, Date.now());
    }
    this.lastLogicEmitTime.set(robotId, Date.now());
  }

  clearState(robotId: string, fullReset: boolean = true): void {
    if (fullReset) {
      this.lastExecutedAction.delete(robotId);
    }
    this.lastLogicEmitTime.delete(robotId);
    this.actionCooldowns.set(robotId, new Map());
    for (const key of this.lastNonContinuousEmit.keys()) {
      if (key.startsWith(`${robotId}\0`)) {
        this.lastNonContinuousEmit.delete(key);
      }
    }
    for (const key of this.queryEmits) {
      if (key.startsWith(`${robotId}-`)) {
        this.queryEmits.delete(key);
      }
    }
  }
}

import { GameLoop } from "@logic-arena/engine";
import { Socket } from "socket.io";
import { ActionExpression } from "../../../../../packages/logic-parser/src";
import { Pathfinder } from "./pathfinder";

export class ActionExecutor {
    private lastFireTime: Map<string, number> = new Map();
    private lastExecutedAction: Map<string, string> = new Map();
    private lastLogicEmitTime: Map<string, number> = new Map();
    private actionCooldowns: Map<string, Map<string, number>> = new Map();

    private readonly FIRE_COOLDOWN_MS = 500;
    private readonly ACTION_COOLDOWN_MS = 500;
    private readonly MOVE_SPEED = 150;
    private readonly MOVE_FAST_MULTIPLIER = 2;

    constructor(
        private gameLoop: GameLoop,
        private connectedClients: Map<string, Socket>,
        private pathfinder: Pathfinder
    ) { }

    isBareActionOffCooldown(robotId: string, actionCommand: string): boolean {
        const now = Date.now();
        const robotCooldowns = this.actionCooldowns.get(robotId) ?? new Map();

        if (!this.actionCooldowns.has(robotId)) {
            this.actionCooldowns.set(robotId, robotCooldowns);
        }

        const lastExecutionTime = robotCooldowns.get(actionCommand) ?? 0;
        return now - lastExecutionTime >= this.ACTION_COOLDOWN_MS;
    }

    markBareActionExecuted(robotId: string, actionCommand: string): void {
        const now = Date.now();
        const robotCooldowns = this.actionCooldowns.get(robotId) ?? new Map();

        if (!this.actionCooldowns.has(robotId)) {
            this.actionCooldowns.set(robotId, robotCooldowns);
        }

        robotCooldowns.set(actionCommand, now);
    }

    fire(robotId: string, targetX: number, targetY: number): void {
        const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
        if (robot && robot.health > 0) {
            this.gameLoop.spawnProjectile(
                robotId,
                { ...robot.position },
                { x: targetX, y: targetY }
            );
        }
    }

    fireProjectile(robotId: string): void {
        const now = Date.now();
        const lastFire = this.lastFireTime.get(robotId) || 0;

        if (now - lastFire < this.FIRE_COOLDOWN_MS) {
            return; // Cooldown active
        }

        const robots = this.gameLoop.getRobots();
        const robot = robots.find(r => r.id === robotId);
        const targetRobot = robots.find(r => r.id !== robotId && r.health > 0);

        if (robot && robot.health > 0 && targetRobot) {
            this.fire(robotId, targetRobot.position.x, targetRobot.position.y);
            this.lastFireTime.set(robotId, now);
        }
    }

    executeAction(robotId: string, action: ActionExpression, memory: Map<string, any>): void {
        const actionCommand = action.command.toUpperCase();
        const lastAction = this.lastExecutedAction.get(robotId);
        const lastEmitTime = this.lastLogicEmitTime.get(robotId) || 0;
        const now = Date.now();
        const actionChanged = actionCommand !== lastAction;

        // Spam throttle logic
        if (actionChanged && (now - lastEmitTime > 250)) {
            this.connectedClients.forEach(client => {
                client.emit("logicExecuted", {
                    robotId,
                    action: actionCommand,
                    message: `Logic Triggered: ${actionCommand}`
                });
            });
            this.lastLogicEmitTime.set(robotId, now);
            this.lastExecutedAction.set(robotId, actionCommand);
            console.log(`[Logic Execution] ${robotId} status changed to: ${actionCommand}`);
        }

        switch (actionCommand) {
            case "FIRE":
            case "BURST_FIRE":
                this.fireProjectile(robotId);
                break;
            case "PATHFIND": {
                const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
                if (robot) {
                    this.pathfinder.executePathfind(robot, memory);
                }
                break;
            }
            case "STOP": {
                const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
                if (robot) {
                    robot.velocity.x = 0;
                    robot.velocity.y = 0;
                }
                break;
            }
            case "MOVE":
            case "MOVE_FAST":
            case "BACKUP": {
                const robot = this.gameLoop.getRobots().find(r => r.id === robotId);

                if (robot) {
                    if (robot.trappedUntil && Date.now() < robot.trappedUntil) {
                        robot.velocity.x = 0;
                        robot.velocity.y = 0;
                        break;
                    }

                    const slowMult = (robot.slowedUntil && Date.now() < robot.slowedUntil)
                        ? (robot.speedMultiplier ?? 0.4) : 1;

                    const rotation = robot.rotation;
                    const speedMultiplier = actionCommand === "MOVE_FAST" ? this.MOVE_FAST_MULTIPLIER : 1;
                    const directionMultiplier = actionCommand === "BACKUP" ? -1 : 1;
                    const speed = this.MOVE_SPEED * speedMultiplier * directionMultiplier * slowMult;
                    const speedMagnitude = Math.hypot(robot.velocity.x, robot.velocity.y);

                    if (rotation === 0 && speedMagnitude < 0.001) {
                        robot.velocity.x = speed;
                        robot.velocity.y = 0;
                        break;
                    }

                    robot.velocity.x = Math.cos(rotation) * speed;
                    robot.velocity.y = Math.sin(rotation) * speed;
                }
                break;
            }
            default:
                console.warn(`[Logic Error] Unknown command: ${actionCommand}`);
        }
    }

    clearState(robotId: string) {
        this.lastExecutedAction.delete(robotId);
        this.lastLogicEmitTime.delete(robotId);
        this.actionCooldowns.set(robotId, new Map());
    }
}
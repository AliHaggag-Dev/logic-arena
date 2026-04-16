import { GameLoop, Robot } from "@logic-arena/engine";
import { ActionExpression } from "../../../../../../packages/logic-parser/src";
import { Pathfinder } from "../pathfinder";

export class MovementExecutor {
    private readonly MOVE_SPEED = 150;
    private readonly MOVE_FAST_MULTIPLIER = 2;

    constructor(private gameLoop: GameLoop, private pathfinder: Pathfinder) {}

    execute(robotId: string, actionCommand: string, memory: Record<string, any>): void {
        const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
        if (!robot) return;

        // --- Physics Priority ---
        // If the robot is currently bouncing off a wall (cooling down),
        // we strictly ignore all manual movement commands. This prevents scripts
        // from overpowering the physical collision geometry.
        if ((robot.collisionCooldown ?? 0) > 0) {
            return;
        }

        if (actionCommand === "PATHFIND") {
            this.pathfinder.executePathfind(robot, memory);
            return;
        }

        if (actionCommand === "STOP") {
            robot.velocity.x = 0;
            robot.velocity.y = 0;
            return;
        }

        // The engine sets speedMultiplier = 0.4 per-tick when the robot is inside a TRAP zone,
        // and resets it to 1.0 at the start of each tick when the robot is outside.
        // The executor simply reads it — no timestamp checks needed.
        const slowMult = robot.speedMultiplier ?? 1.0;
        const speedMultiplier = actionCommand === "MOVE_FAST" ? this.MOVE_FAST_MULTIPLIER : 1;
        const directionMultiplier = actionCommand === "BACKUP" ? -1 : 1;
        const speed = this.MOVE_SPEED * speedMultiplier * directionMultiplier * slowMult;
        const speedMagnitude = Math.hypot(robot.velocity.x, robot.velocity.y);

        if (robot.rotation === 0 && speedMagnitude < 0.001) {
            robot.velocity.x = speed;
            robot.velocity.y = 0;
            return;
        }

        robot.velocity.x = Math.cos(robot.rotation) * speed;
        robot.velocity.y = Math.sin(robot.rotation) * speed;
    }
}

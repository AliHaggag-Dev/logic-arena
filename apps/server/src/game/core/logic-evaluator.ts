import { GameLoop, Robot } from "@logic-arena/engine";
import {
    Program,
    NodeType,
    AssignmentStatement,
    ActionStatement,
    IfStatement,
    Expression,
    Identifier,
    NumberLiteral,
    StringLiteral,
    ActionExpression
} from "../../../../../packages/logic-parser/src";
import { CombatMath } from "./combat-math";
import { ActionExecutor } from "./action-executor";

export class LogicEvaluator {
    private robotLogic: Map<string, Program> = new Map();
    private logicStates: Map<string, Map<string, boolean>> = new Map();
    private robotMemory: Map<string, Map<string, any>> = new Map();

    constructor(
        private gameLoop: GameLoop,
        private actionExecutor: ActionExecutor
    ) { }

    setLogic(robotId: string, ast: Program) {
        this.robotLogic.set(robotId, ast);
        this.logicStates.delete(robotId);
        this.robotMemory.set(robotId, new Map());
        this.actionExecutor.clearState(robotId);
    }

    clearAllLogic() {
        this.robotLogic.clear();
        this.logicStates.clear();
        this.robotMemory.clear();
    }

    evaluate(robotId: string): void {
        const program = this.robotLogic.get(robotId);
        if (!program) return;

        const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
        if (!robot || robot.health <= 0) return;

        if (!this.logicStates.has(robotId)) {
            this.logicStates.set(robotId, new Map());
        }
        if (!this.robotMemory.has(robotId)) {
            this.robotMemory.set(robotId, new Map());
        }

        const robotStates = this.logicStates.get(robotId)!;
        const robotMemory = this.robotMemory.get(robotId)!;

        if (!robotMemory.has("rotation")) {
            robotMemory.set("rotation", robot.rotation);
        }
        if (!robotMemory.has("last_spotted_x")) {
            robotMemory.set("last_spotted_x", robot.position.x);
        }
        if (!robotMemory.has("last_spotted_y")) {
            robotMemory.set("last_spotted_y", robot.position.y);
        }

        const target = CombatMath.getClosestTarget(robot, this.gameLoop.getRobots());
        const isSpotted = CombatMath.isTargetSpotted(robot, target);

        if (isSpotted && target) {
            robotMemory.set("last_spotted_x", target.position.x);
            robotMemory.set("last_spotted_y", target.position.y);
        }

        const movementCommands = new Set(["MOVE", "MOVE_FAST", "BACKUP", "STOP"]);
        let pendingMovementAction: { action: ActionExpression; isBare: boolean; command: string } | null = null;

        program.body.forEach((statement, index) => {
            if (statement.type === NodeType.AssignmentStatement) {
                const assignment = statement as AssignmentStatement;
                const value = this.evaluateExpression(robotId, robot, assignment.value);
                robotMemory.set(assignment.name.value, value);

                if (assignment.name.value === "rotation" && typeof value === "number") {
                    robot.rotation = value;
                }
                return;
            }

            if (statement.type === NodeType.ActionStatement) {
                const actionStatement = statement as ActionStatement;
                const actionCommand = actionStatement.consequence.command.toUpperCase();

                if (!this.actionExecutor.isBareActionOffCooldown(robotId, actionCommand)) {
                    return;
                }

                if (movementCommands.has(actionCommand)) {
                    pendingMovementAction = { action: actionStatement.consequence, isBare: true, command: actionCommand };
                    return;
                }

                this.actionExecutor.executeAction(robotId, actionStatement.consequence, robotMemory);
                this.actionExecutor.markBareActionExecuted(robotId, actionCommand);
                return;
            }

            if (statement.type === NodeType.IfStatement) {
                const ifStatement = statement as IfStatement;
                const isConditionMet = this.evaluateCondition(robotId, robot, ifStatement.condition);
                const wasConditionMetBefore = robotStates.get(index.toString()) || false;

                if (isConditionMet && !wasConditionMetBefore) {
                    const actionCommand = ifStatement.consequence.command.toUpperCase();

                    if (movementCommands.has(actionCommand)) {
                        pendingMovementAction = { action: ifStatement.consequence, isBare: false, command: actionCommand };
                    } else {
                        this.actionExecutor.executeAction(robotId, ifStatement.consequence, robotMemory);
                    }
                }

                robotStates.set(index.toString(), isConditionMet);
            }
        });

        if (pendingMovementAction !== null) {
            const { action, isBare, command } = pendingMovementAction;
            this.actionExecutor.executeAction(robotId, action, robotMemory);
            if (isBare) {
                this.actionExecutor.markBareActionExecuted(robotId, command);
            }
        }
    }

    private evaluateCondition(robotId: string, robot: Robot, expression: Expression): boolean {
        const value = this.evaluateExpression(robotId, robot, expression);
        return typeof value === "boolean" ? value : Boolean(value);
    }

    private evaluateExpression(robotId: string, robot: Robot, expression: Expression): any {
        switch (expression.type) {
            case NodeType.NumberLiteral:
            case NodeType.StringLiteral:
            case NodeType.BooleanLiteral:
                return expression.value;
            case NodeType.Identifier:
                return this.resolveValue(robotId, robot, expression);
            case NodeType.BinaryExpression: {
                const left = this.evaluateExpression(robotId, robot, expression.left);
                const right = this.evaluateExpression(robotId, robot, expression.right);
                if (typeof left !== "number" || typeof right !== "number") return undefined;
                return expression.operator === "+" ? left + right : left - right;
            }
            case NodeType.UnaryExpression: {
                const argument = this.evaluateExpression(robotId, robot, expression.argument);
                return expression.operator === "NOT" ? !Boolean(argument) : undefined;
            }
            case NodeType.ComparisonExpression: {
                const leftValue = this.evaluateExpression(robotId, robot, expression.left);
                const rightValue = this.evaluateExpression(robotId, robot, expression.right);
                if (typeof leftValue !== typeof rightValue) return false;
                switch (expression.operator) {
                    case "<": return leftValue < rightValue;
                    case ">": return leftValue > rightValue;
                    case "==": return leftValue === rightValue;
                    default: return false;
                }
            }
            default:
                return undefined;
        }
    }

    private resolveValue(robotId: string, robot: Robot, node: Identifier | NumberLiteral | StringLiteral): any {
        if (node.type === NodeType.NumberLiteral || node.type === NodeType.StringLiteral) {
            return node.value;
        }
        if (node.type === NodeType.Identifier) {
            const memory = this.robotMemory.get(robotId);
            if (memory && memory.has(node.value)) {
                return memory.get(node.value);
            }
            const target = CombatMath.getClosestTarget(robot, this.gameLoop.getRobots());
            switch (node.value) {
                case "distance":
                    if (target) {
                        const dx = robot.position.x - target.position.x;
                        const dy = robot.position.y - target.position.y;
                        return Math.sqrt(dx * dx + dy * dy);
                    }
                    return Infinity;
                case "health": return robot.health;
                case "rotation": return robot.rotation;
                case "target_vx": return target ? target.velocity.x : 0;
                case "target_vy": return target ? target.velocity.y : 0;
                case "bullet_speed": return 400;
                case "spotted": return CombatMath.isTargetSpotted(robot, target);
                default: return undefined;
            }
        }
        return undefined;
    }
}
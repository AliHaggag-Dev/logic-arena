import { Robot } from "@logic-arena/engine";

export class CombatMath {
    static getClosestTarget(robot: Robot, allRobots: Robot[]): Robot | null {
        const targets = allRobots.filter(r => r.id !== robot.id && r.health > 0);
        if (targets.length === 0) return null;

        return targets.reduce((closest, current) => {
            const closestDx = robot.position.x - closest.position.x;
            const closestDy = robot.position.y - closest.position.y;
            const currentDx = robot.position.x - current.position.x;
            const currentDy = robot.position.y - current.position.y;

            const closestDistance = closestDx * closestDx + closestDy * closestDy;
            const currentDistance = currentDx * currentDx + currentDy * currentDy;

            return currentDistance < closestDistance ? current : closest;
        });
    }

    static isTargetSpotted(robot: Robot, target: Robot | null): boolean {
        if (!target) return false;

        const dx = target.position.x - robot.position.x;
        const dy = target.position.y - robot.position.y;
        const distance = Math.hypot(dx, dy);
        if (distance === 0) return true;
        if (distance > 1000) return false;

        const rotation = robot.rotation;
        let fx = 0;
        let fy = 0;

        if (rotation !== null) {
            fx = Math.cos(rotation);
            fy = Math.sin(rotation);
        } else {
            const vx = robot.velocity.x;
            const vy = robot.velocity.y;
            const speed = Math.hypot(vx, vy);
            if (speed < 0.001) return false;
            fx = vx / speed;
            fy = vy / speed;
        }

        const dot = (fx * dx + fy * dy) / distance;
        return dot >= 0.5;
    }
}
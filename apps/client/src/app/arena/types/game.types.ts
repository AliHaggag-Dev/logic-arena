import { RobotState, ProjectileState, ObstacleState } from "./scene.types";

export interface GameState {
  robots: RobotState[];
  projectiles: ProjectileState[];
  obstacles: ObstacleState[];
}

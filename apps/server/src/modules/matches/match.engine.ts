import { SandboxRunner } from "../../common/sandbox.runner";

const ROBOT_COLORS = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff6600", "#ff0066"];

interface PlayerState {
  id: string;
  script: string;
  position: { x: number; y: number };
  health: number;
  color: string;
  velocity: { x: number; y: number };
  rotation: number;
}

interface GameState {
  players: PlayerState[];
  projectiles: any[];
}

export class MatchEngine {
  private sandboxRunner: SandboxRunner;
  private state: GameState;
  private tickInterval: NodeJS.Timeout | null = null;
  private matchId: string;

  constructor(matchId: string, initialPlayers: { id: string; script: string }[]) {
    this.matchId = matchId;
    this.sandboxRunner = new SandboxRunner();
    this.state = {
      players: initialPlayers.map((p, index) => ({
        id: p.id,
        script: p.script,
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        health: 100,
        color: ROBOT_COLORS[index % ROBOT_COLORS.length],
        velocity: { x: 0, y: 0 },
        rotation: 0,
      })),
      projectiles: [],
    };
  }

  addPlayer(playerScript: { id: string; script: string }) {
    const playerExists = this.state.players.some(p => p.id === playerScript.id);
    if (!playerExists) {
      const index = this.state.players.length;
      this.state.players.push({
        id: playerScript.id,
        script: playerScript.script,
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        health: 100,
        color: ROBOT_COLORS[index % ROBOT_COLORS.length],
        velocity: { x: 0, y: 0 },
        rotation: 0,
      });
    }
  }

  removePlayer(userId: string) {
    this.state.players = this.state.players.filter(p => p.id !== userId);
  }

  start(tickRate: number = 100) {
    this.tickInterval = setInterval(() => this.tick(), tickRate);
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private tick() {
    this.state.players.forEach(player => {
      if (player.health <= 0) return;

      try {
        const context = {};
        const action = this.sandboxRunner.execute(player.script, context);

        if (action && typeof action === "object" && action.action) {
          this.applyAction(player.id, action);
        }
      } catch (error: any) {
        // silent
      }
    });
  }

  private applyAction(playerId: string, action: any) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !action || !action.action) return;

    switch (action.action) {
      case "move":
        break;
      case "fire":
        break;
      case "scan":
        break;
    }
  }

  getState(): GameState {
    return this.state;
  }
}
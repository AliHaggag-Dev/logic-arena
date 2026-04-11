import { SandboxRunner } from "../../common/sandbox.runner";

interface PlayerState {
  id: string;
  script: string;
  position: { x: number; y: number };
  health: number;
  // Add other player-specific state as needed
}

interface GameState {
  players: PlayerState[];
  projectiles: any[]; // Define a proper interface for projectiles
  // Add other global game state as needed
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
      players: initialPlayers.map(p => ({
        id: p.id,
        script: p.script,
        position: { x: Math.random() * 100, y: Math.random() * 100 }, // Random initial position
        health: 100,
      })),
      projectiles: [],
    };
  }

  addPlayer(playerScript: { id: string; script: string }) {
    const playerExists = this.state.players.some(p => p.id === playerScript.id);
    if (!playerExists) {
      this.state.players.push({
        id: playerScript.id,
        script: playerScript.script,
        position: { x: Math.random() * 100, y: Math.random() * 100 },
        health: 100,
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
    // 1. Get AliScript of each player and run through SandboxRunner
    this.state.players.forEach(player => {
      if (player.health <= 0) return; // Don"t run script if robot is dead

      try {
        const context = { /* provide game API context to script */ };
        const action = this.sandboxRunner.execute(player.script, context);
        this.applyAction(player.id, action);
      } catch (error: any) {
        console.error(`Error executing script for player ${player.id}:`, error.message);
        // Optionally, penalize player for script errors
      }
    });

    // This is where collision detection would happen using packages/engine
    // For now, let"s just simulate some basic movement
    this.state.players.forEach(player => {
      // Basic movement simulation (replace with actual game logic)
      // Example: move player forward if action was "move"
      // This will be replaced by actual engine logic.
    });

    // 3. Broadcast state (this will be done by MatchGateway)
    console.log(`Match ${this.matchId} State:`, this.state);
  }

  private applyAction(playerId: string, action: any) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;

    switch (action.action) {
      case "move":
        // Update player position based on action.payload (direction)
        // This is a placeholder; actual movement logic would be more complex
        console.log(`Player ${playerId} moves ${action.payload}`);
        break;
      case "fire":
        // Create a projectile
        console.log(`Player ${playerId} fires`);
        break;
      case "scan":
        // Implement scan logic, e.g., return information about nearby objects
        console.log(`Player ${playerId} scans`);
        break;
    }
  }

  getState(): GameState {
    return this.state;
  }
}
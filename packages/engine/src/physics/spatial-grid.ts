/**
 * SpatialGrid — Fixed-size grid partitioning for O(1) entity lookup.
 *
 * Design goals:
 *  - Scalable: CELL_SIZE and arena dimensions are constructor params.
 *    Works for 800×600 today and 2000×2000 in the future.
 *  - Simple: Entities are hashed into cells by their center position.
 *  - Safe: query() returns the 3×3 neighborhood (center + 8 adjacent)
 *    so entities near cell borders are never missed.
 *
 * Usage in the game loop:
 *   1. spatialGrid.clear()               — reset at the start of each tick
 *   2. spatialGrid.insert(robot)         — insert all alive robots
 *   3. spatialGrid.query(x, y, radius)   — get nearby robots for cheap checks
 */
export class SpatialGrid<T extends { id: string; position: { x: number; y: number } }> {
  private cells: Map<number, T[]> = new Map();
  private readonly cols: number;
  private readonly rows: number;

  /**
   * @param arenaWidth  Total arena width in world units (e.g. 800)
   * @param arenaHeight Total arena height in world units (e.g. 600)
   * @param cellSize    Side length of each grid cell in world units (e.g. 100)
   */
  constructor(
    private readonly arenaWidth: number,
    private readonly arenaHeight: number,
    private readonly cellSize: number = 100,
  ) {
    this.cols = Math.ceil(arenaWidth / cellSize);
    this.rows = Math.ceil(arenaHeight / cellSize);
  }

  /** Remove all entities from the grid. Call once per tick before inserting. */
  clear(): void {
    this.cells.clear();
  }

  /** Insert an entity into the cell that contains its center position. */
  insert(entity: T): void {
    const key = this.posToKey(entity.position.x, entity.position.y);
    if (key === -1) return;
    let bucket = this.cells.get(key);
    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }
    bucket.push(entity);
  }

  /**
   * Return all entities in the 3×3 neighborhood of the cell containing (x, y).
   * Duplicates are possible only if an entity's radius spans multiple cells,
   * but each entity is only inserted once so the result set is unique.
   */
  query(x: number, y: number): T[] {
    const col = this.toCol(x);
    const row = this.toRow(y);
    const results: T[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nc = col + dc;
        const nr = row + dr;
        if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue;
        const bucket = this.cells.get(this.colRowToKey(nc, nr));
        if (bucket) results.push(...bucket);
      }
    }

    return results;
  }

  // --- Private helpers ---

  private toCol(x: number): number {
    return Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cellSize)));
  }

  private toRow(y: number): number {
    return Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cellSize)));
  }

  private posToKey(x: number, y: number): number {
    const col = this.toCol(x);
    const row = this.toRow(y);
    // Validate the position is within arena bounds
    if (x < 0 || x > this.arenaWidth || y < 0 || y > this.arenaHeight) return -1;
    return this.colRowToKey(col, row);
  }

  private colRowToKey(col: number, row: number): number {
    return row * this.cols + col;
  }
}

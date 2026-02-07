import { getComponent } from '../ecs/Entity.js';

export class DensitySystem {
  constructor(entityManager, tileMap, gameState) {
    this.entityManager = entityManager;
    this.tileMap = tileMap;
    this.gameState = gameState;
  }

  update() {
    // Reset density each tick
    this.tileMap.resetDensity();

    // Count workers per tile region
    const workers = this.entityManager.query('worker', 'position');
    for (const entity of workers) {
      const pos = getComponent(entity, 'position');
      // Add density to this tile and neighbors
      this.tileMap.addDensity(pos.col, pos.row, 1);
      // Softer spread to adjacent tiles
      this.tileMap.addDensity(pos.col - 1, pos.row, 0.3);
      this.tileMap.addDensity(pos.col + 1, pos.row, 0.3);
      this.tileMap.addDensity(pos.col, pos.row - 1, 0.3);
      this.tileMap.addDensity(pos.col, pos.row + 1, 0.3);
    }

    // Update total population in game state
    this.gameState.population = workers.length;
  }
}

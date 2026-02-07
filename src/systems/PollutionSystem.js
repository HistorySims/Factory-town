import { getComponent } from '../ecs/Entity.js';
import { TERRAIN, POLLUTION_DECAY, MAP_COLS, MAP_ROWS } from '../core/Constants.js';

export class PollutionSystem {
  constructor(entityManager, tileMap, gameState, mapData) {
    this.entityManager = entityManager;
    this.tileMap = tileMap;
    this.gameState = gameState;
    this.mapData = mapData;
    this.tickCounter = 0;
  }

  update() {
    this.tickCounter++;

    // Only process every few ticks for performance
    if (this.tickCounter % 10 !== 0) return;

    const map = this.tileMap;

    // Pollution spreads downstream along river (left to right)
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = MAP_COLS - 2; c >= 0; c--) {
        if (map.get(c, r) === TERRAIN.WATER || map.get(c, r) === TERRAIN.CANAL) {
          const current = map.getPollution(c, r);

          // Spread downstream
          if (c + 1 < MAP_COLS && (map.get(c + 1, r) === TERRAIN.WATER || map.get(c + 1, r) === TERRAIN.CANAL)) {
            const downstream = map.getPollution(c + 1, r);
            if (current > downstream) {
              map.addPollution(c + 1, r, current * 0.01);
            }
          }

          // Natural decay
          if (current > 0) {
            map.setPollution(c, r, Math.max(0, current - POLLUTION_DECAY));
          }
        }
      }
    }

    // Density-based pollution on land (more people = more waste)
    const population = this.entityManager.count('worker');
    if (population > 20) {
      // General area pollution
      const factoryPos = this.mapData.factoryOrigin;
      for (let dc = -5; dc < 10; dc++) {
        const col = factoryPos.col + dc;
        for (let r = 0; r < MAP_ROWS; r++) {
          if (map.get(col, r) === TERRAIN.WATER) {
            map.addPollution(col, r, population * 0.00001);
          }
        }
      }
    }

    // If sewers policy is active, reduce pollution faster
    if (this.gameState.policies.sewers) {
      for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
          if (map.get(c, r) === TERRAIN.WATER) {
            const current = map.getPollution(c, r);
            if (current > 0) {
              map.setPollution(c, r, current * 0.998);
            }
          }
        }
      }
    }

    // Update game state
    this.gameState.riverHealth = this.tileMap.getRiverHealth();
  }
}

import { getComponent } from '../ecs/Entity.js';
import { WORKER_SPAWN_INTERVAL, MAX_WORKERS_PER_HOUSING, PHASE } from '../core/Constants.js';
import { createWorker } from '../entities/AgentFactory.js';

export class HousingSystem {
  constructor(entityManager, tileMap, gameState, eventBus) {
    this.entityManager = entityManager;
    this.tileMap = tileMap;
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.externalMigrationTimer = 0;
  }

  update() {
    const housings = this.entityManager.query('housing', 'position');

    for (const entity of housings) {
      const housing = getComponent(entity, 'housing');
      const pos = getComponent(entity, 'position');

      housing.spawnTimer++;

      // Spawn interval depends on game phase
      let interval = WORKER_SPAWN_INTERVAL;
      if (this.gameState.phase === PHASE.MID) interval = Math.floor(interval * 0.6);
      if (this.gameState.phase === PHASE.LATE) interval = Math.floor(interval * 0.3);

      if (housing.spawnTimer >= interval && housing.residents < housing.maxResidents) {
        housing.spawnTimer = 0;
        housing.residents++;

        // Spawn worker near housing
        const spawnCol = pos.col - 1;
        const spawnRow = pos.row;
        const walkable = this.tileMap.findNearestWalkable(spawnCol, spawnRow);

        createWorker(
          this.entityManager,
          walkable.col, walkable.row,
          pos.col, pos.row
        );
      }
    }

    // In late game: external migration (workers just appear)
    if (this.gameState.phase === PHASE.LATE || this.gameState.phase === PHASE.MID) {
      this.externalMigrationTimer++;
      const migrationInterval = this.gameState.phase === PHASE.LATE ? 200 : 500;

      if (this.externalMigrationTimer >= migrationInterval) {
        this.externalMigrationTimer = 0;
        // Workers appear from map edges
        const edge = Math.random() < 0.5 ? 2 : this.tileMap.cols - 3;
        const row = this.gameState.mapData ? this.gameState.mapData.roadRow : 15;
        const walkable = this.tileMap.findNearestWalkable(edge, row);

        createWorker(
          this.entityManager,
          walkable.col, walkable.row,
          walkable.col, walkable.row // homeless workers
        );
      }
    }
  }
}

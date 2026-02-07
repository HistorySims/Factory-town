import { getComponent } from '../ecs/Entity.js';
import { TERRAIN, MAP_COLS, PHASE } from '../core/Constants.js';
import { createTrain } from '../entities/AgentFactory.js';
import { createStation } from '../entities/BuildingFactory.js';

export class RailroadSystem {
  constructor(entityManager, tileMap, pathfinder, eventBus, gameState, mapData) {
    this.entityManager = entityManager;
    this.tileMap = tileMap;
    this.pathfinder = pathfinder;
    this.eventBus = eventBus;
    this.gameState = gameState;
    this.mapData = mapData;

    this.railBuilt = false;
    this.trainSpawnTimer = 0;
    this.stationEntity = null;
    this.railRow = 0;
  }

  update() {
    if (this.gameState.phase === PHASE.EARLY) return;

    if (!this.railBuilt && this.gameState.phase !== PHASE.EARLY) {
      this._buildRailroad();
      this.railBuilt = true;
      this.eventBus.emit('railroad:built', {});
    }

    if (!this.railBuilt) return;

    this.trainSpawnTimer++;

    // Spawn trains periodically
    const warehouseEntity = this.entityManager.queryOne('warehouse');
    if (!warehouseEntity) return;
    const warehouse = getComponent(warehouseEntity, 'warehouse');

    if (this.trainSpawnTimer >= 800 && warehouse.shirts >= 15) {
      this.trainSpawnTimer = 0;
      this._spawnTrain();
    }

    // Update existing trains
    const trains = this.entityManager.query('transport', 'cargo');
    for (const entity of trains) {
      const transport = getComponent(entity, 'transport');
      if (transport.type !== 'train') continue;

      const pos = getComponent(entity, 'position');
      const pf = getComponent(entity, 'pathfinding');
      const cargo = getComponent(entity, 'cargo');

      if (transport.state === 'traveling' && (!pf.path || pf.pathIndex >= pf.path.length)) {
        // Arrived at station - load
        const toLoad = Math.min(cargo.capacity - cargo.carried, warehouse.shirts);
        cargo.carried += toLoad;
        warehouse.shirts -= toLoad;
        this.gameState.money += cargo.carried * this.gameState.price * 0.15;
        this.gameState.totalSold += cargo.carried;

        transport.state = 'returning';
        // Path train back out
        this._pathTrainToExit(entity, pos, pf);
      } else if (transport.state === 'returning' && (!pf.path || pf.pathIndex >= pf.path.length)) {
        entity.alive = false;
        this.entityManager.remove(entity.id);
      }
    }
  }

  _buildRailroad() {
    const factoryPos = this.mapData.factoryOrigin;
    this.railRow = factoryPos.row - 4;

    // Lay rail from left edge to past factory
    for (let c = 0; c < MAP_COLS; c++) {
      if (this.tileMap.get(c, this.railRow) === TERRAIN.GRASS) {
        this.tileMap.set(c, this.railRow, TERRAIN.RAIL);
      }
    }

    // Build station near factory
    const stationCol = factoryPos.col + 1;
    this.stationEntity = createStation(this.entityManager, this.tileMap, stationCol, this.railRow - 1);
  }

  _spawnTrain() {
    const train = createTrain(this.entityManager, 0, this.railRow);
    const transport = getComponent(train, 'transport');
    transport.state = 'traveling';

    // Train moves along rail to station
    const pos = getComponent(train, 'position');
    const pf = getComponent(train, 'pathfinding');

    // Simple rail path: just go right along the rail row
    const stationCol = this.mapData.factoryOrigin.col + 2;
    const path = [];
    for (let c = 1; c <= stationCol; c++) {
      path.push({ col: c, row: this.railRow });
    }
    pf.path = path;
    pf.pathIndex = 0;
  }

  _pathTrainToExit(entity, pos, pf) {
    const path = [];
    for (let c = pos.col + 1; c < MAP_COLS; c++) {
      path.push({ col: c, row: this.railRow });
    }
    pf.path = path;
    pf.pathIndex = 0;
  }
}

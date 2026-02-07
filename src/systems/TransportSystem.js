import { getComponent, hasComponent } from '../ecs/Entity.js';
import { TRANSPORT_TYPE, MAP_COLS, CART_SPAWN_INTERVAL } from '../core/Constants.js';
import { createCart, createBarge } from '../entities/AgentFactory.js';

export class TransportSystem {
  constructor(entityManager, tileMap, pathfinder, eventBus, gameState, mapData) {
    this.entityManager = entityManager;
    this.tileMap = tileMap;
    this.pathfinder = pathfinder;
    this.eventBus = eventBus;
    this.gameState = gameState;
    this.mapData = mapData;
    this.cartSpawnTimer = 0;
    this.bargeSpawnTimer = 0;
  }

  update() {
    this.cartSpawnTimer++;
    this.bargeSpawnTimer++;

    const warehouseEntity = this.entityManager.queryOne('warehouse');
    if (!warehouseEntity) return;
    const warehouse = getComponent(warehouseEntity, 'warehouse');
    const warehousePos = getComponent(warehouseEntity, 'position');

    // Spawn carts based on price/demand
    const demandFactor = Math.max(0.2, 1 - (this.gameState.price - 10) * 0.05);
    const spawnInterval = Math.floor(CART_SPAWN_INTERVAL / demandFactor);

    if (this.cartSpawnTimer >= spawnInterval && warehouse.shirts >= 3) {
      this.cartSpawnTimer = 0;
      this._spawnCart(warehousePos);
    }

    // Spawn barges in mid-game (if canal exists)
    if (this.gameState.hasCanal && this.bargeSpawnTimer >= 500 && warehouse.shirts >= 8) {
      this.bargeSpawnTimer = 0;
      this._spawnBarge(warehousePos);
    }

    // Update existing transports
    const transports = this.entityManager.query('transport', 'position', 'pathfinding', 'cargo');
    for (const entity of transports) {
      this._updateTransport(entity, warehouse, warehousePos);
    }
  }

  _spawnCart(warehousePos) {
    // Cart arrives from edge of map
    const startCol = MAP_COLS - 3;
    const startRow = this.mapData.roadRow;
    const walkable = this.tileMap.findNearestWalkable(startCol, startRow);

    const cart = createCart(this.entityManager, walkable.col, walkable.row);
    const transport = getComponent(cart, 'transport');
    transport.state = 'traveling';
    transport.destCol = warehousePos.col;
    transport.destRow = warehousePos.row;

    // Path to warehouse
    const targetWalkable = this.tileMap.findNearestWalkable(warehousePos.col - 1, warehousePos.row);
    const pf = getComponent(cart, 'pathfinding');
    const path = this.pathfinder.findPath(walkable.col, walkable.row, targetWalkable.col, targetWalkable.row);
    if (path) {
      pf.path = path;
      pf.pathIndex = 0;
    }
  }

  _spawnBarge(warehousePos) {
    // Barge comes from upstream (left edge of river)
    const startCol = 1;
    let startRow = this.mapData.riverCenterRows ? this.mapData.riverCenterRows[startCol] : 22;

    const barge = createBarge(this.entityManager, startCol, startRow);
    const transport = getComponent(barge, 'transport');
    transport.state = 'traveling';
    transport.destCol = warehousePos.col;
    transport.destRow = warehousePos.row;

    // Path along river to warehouse area
    const targetCol = warehousePos.col + 1;
    const targetRow = this.mapData.riverCenterRows ? this.mapData.riverCenterRows[targetCol] : 22;

    const pf = getComponent(barge, 'pathfinding');
    const path = this.pathfinder.findPath(startCol, startRow, targetCol, targetRow, true);
    if (path) {
      pf.path = path;
      pf.pathIndex = 0;
    }
  }

  _updateTransport(entity, warehouse, warehousePos) {
    const transport = getComponent(entity, 'transport');
    const pos = getComponent(entity, 'position');
    const pf = getComponent(entity, 'pathfinding');
    const cargo = getComponent(entity, 'cargo');

    switch (transport.state) {
      case 'traveling': {
        // Check if arrived at destination
        if (!pf.path || pf.pathIndex >= pf.path.length) {
          transport.state = 'loading';
        }
        break;
      }

      case 'loading': {
        // Load shirts from warehouse
        const toLoad = Math.min(cargo.capacity - cargo.carried, warehouse.shirts);
        if (toLoad > 0) {
          cargo.carried += toLoad;
          warehouse.shirts -= toLoad;
          transport.state = 'returning';

          // Revenue from selling
          this.gameState.money += cargo.carried * this.gameState.price * 0.1;
          this.gameState.totalSold += cargo.carried;

          // Path back to edge
          this._pathToExit(entity, transport, pos, pf);
        } else {
          // No goods - wait or leave empty
          transport.state = 'returning';
          this._pathToExit(entity, transport, pos, pf);
        }
        break;
      }

      case 'returning': {
        if (!pf.path || pf.pathIndex >= pf.path.length) {
          // Remove entity when it leaves the map
          entity.alive = false;
          this.entityManager.remove(entity.id);
        }
        break;
      }
    }
  }

  _pathToExit(entity, transport, pos, pf) {
    let exitCol, exitRow;

    if (transport.type === TRANSPORT_TYPE.BARGE) {
      exitCol = MAP_COLS - 2;
      exitRow = this.mapData.riverCenterRows ? this.mapData.riverCenterRows[exitCol] : 22;
      const path = this.pathfinder.findPath(pos.col, pos.row, exitCol, exitRow, true);
      if (path) {
        pf.path = path;
        pf.pathIndex = 0;
      }
    } else {
      exitCol = MAP_COLS - 3;
      exitRow = this.mapData.roadRow;
      const walkable = this.tileMap.findNearestWalkable(exitCol, exitRow);
      const path = this.pathfinder.findPath(pos.col, pos.row, walkable.col, walkable.row);
      if (path) {
        pf.path = path;
        pf.pathIndex = 0;
      }
    }
  }
}

import { getComponent } from '../ecs/Entity.js';
import { SHIRTS_PER_WORKER_TICK, POLLUTION_PER_PRODUCTION } from '../core/Constants.js';

export class ProductionSystem {
  constructor(entityManager, tileMap, eventBus, gameState) {
    this.entityManager = entityManager;
    this.tileMap = tileMap;
    this.eventBus = eventBus;
    this.gameState = gameState;
  }

  update() {
    const factoryEntity = this.entityManager.queryOne('factory');
    if (!factoryEntity) return;

    const factory = getComponent(factoryEntity, 'factory');
    const warehouseEntity = this.entityManager.queryOne('warehouse');
    if (!warehouseEntity) return;

    const warehouse = getComponent(warehouseEntity, 'warehouse');

    // Calculate power from water wheels
    let totalPower = 0;
    const wheels = this.entityManager.query('waterWheel');
    for (const w of wheels) {
      const ww = getComponent(w, 'waterWheel');
      const riverHealth = this.tileMap.getRiverHealth();
      ww.efficiency = Math.max(0.1, riverHealth);
      ww.angle += 0.02 * ww.efficiency;
      totalPower += ww.power * ww.efficiency;
    }
    factory.maxPower = totalPower;

    // Power limits how many seats can be active
    const poweredSeats = Math.min(factory.filledSeats, Math.floor(totalPower));
    factory.power = poweredSeats;

    // Production
    const shirtsProduced = poweredSeats * SHIRTS_PER_WORKER_TICK;
    factory.productionRate = shirtsProduced;

    if (shirtsProduced > 0 && warehouse.shirts < warehouse.capacity) {
      warehouse.shirts += shirtsProduced;
      factory.totalProduced += shirtsProduced;
      factory.wasteGenerated += shirtsProduced * 0.5;

      // Production cost (wages)
      const wageCost = factory.filledSeats * this.gameState.wage * 0.001;
      this.gameState.money -= wageCost;

      // Pollution from production
      if (factory.dumpingWaste) {
        // Dump waste into river
        const factoryPos = getComponent(factoryEntity, 'position');
        for (let dc = 0; dc < 6; dc++) {
          const col = factoryPos.col + dc;
          // Find river tiles nearby and pollute them
          for (let r = 0; r < this.tileMap.rows; r++) {
            if (this.tileMap.get(col, r) === 1) { // WATER
              this.tileMap.addPollution(col, r, POLLUTION_PER_PRODUCTION * 2);
              break;
            }
          }
        }
      }
    }

    // Cap warehouse
    warehouse.shirts = Math.min(warehouse.shirts, warehouse.capacity);

    // Update game state
    this.gameState.production = factory.productionRate;
    this.gameState.totalProduced = factory.totalProduced;
    this.gameState.warehouseShirts = warehouse.shirts;
  }
}

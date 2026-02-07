import { createEntity, addComponent } from '../ecs/Entity.js';
import * as C from '../ecs/Component.js';
import { COLORS, BUILDING_TYPE, TERRAIN } from '../core/Constants.js';

export function createFactoryBuilding(entityManager, tileMap, col, row) {
  const e = createEntity();
  addComponent(e, 'position', C.Position(col, row));
  addComponent(e, 'building', C.Building(BUILDING_TYPE.FACTORY, 6, 4));
  addComponent(e, 'factory', C.Factory());
  addComponent(e, 'sprite', C.Sprite(COLORS.FACTORY_WALL, 6, 4, 'rect'));

  // Mark tiles
  for (let dc = 0; dc < 6; dc++) {
    for (let dr = 0; dr < 4; dr++) {
      tileMap.set(col + dc, row + dr, TERRAIN.BUILDING);
      tileMap.setBuildingId(col + dc, row + dr, e.id);
    }
  }

  entityManager.add(e);
  return e;
}

export function createWarehouse(entityManager, tileMap, col, row) {
  const e = createEntity();
  addComponent(e, 'position', C.Position(col, row));
  addComponent(e, 'building', C.Building(BUILDING_TYPE.WAREHOUSE, 2, 2));
  addComponent(e, 'warehouse', C.Warehouse());
  addComponent(e, 'sprite', C.Sprite(COLORS.WAREHOUSE, 2, 2, 'rect'));

  for (let dc = 0; dc < 2; dc++) {
    for (let dr = 0; dr < 2; dr++) {
      tileMap.set(col + dc, row + dr, TERRAIN.BUILDING);
      tileMap.setBuildingId(col + dc, row + dr, e.id);
    }
  }

  entityManager.add(e);
  return e;
}

export function createWaterWheel(entityManager, col, row) {
  const e = createEntity();
  addComponent(e, 'position', C.Position(col, row));
  addComponent(e, 'building', C.Building(BUILDING_TYPE.WATER_WHEEL, 1, 1));
  addComponent(e, 'waterWheel', C.WaterWheel());
  addComponent(e, 'sprite', C.Sprite(COLORS.WATER_WHEEL, 1, 1, 'circle'));

  entityManager.add(e);
  return e;
}

export function createHousingBuilding(entityManager, tileMap, col, row) {
  const e = createEntity();
  addComponent(e, 'position', C.Position(col, row));
  addComponent(e, 'building', C.Building(BUILDING_TYPE.HOUSING, 2, 2));
  addComponent(e, 'housing', C.Housing());
  addComponent(e, 'sprite', C.Sprite(COLORS.HOUSING, 2, 2, 'rect'));

  for (let dc = 0; dc < 2; dc++) {
    for (let dr = 0; dr < 2; dr++) {
      tileMap.set(col + dc, row + dr, TERRAIN.BUILDING);
      tileMap.setBuildingId(col + dc, row + dr, e.id);
    }
  }

  entityManager.add(e);
  return e;
}

export function createStation(entityManager, tileMap, col, row) {
  const e = createEntity();
  addComponent(e, 'position', C.Position(col, row));
  addComponent(e, 'building', C.Building(BUILDING_TYPE.STATION, 3, 2));
  addComponent(e, 'sprite', C.Sprite(COLORS.STATION, 3, 2, 'rect'));

  for (let dc = 0; dc < 3; dc++) {
    for (let dr = 0; dr < 2; dr++) {
      tileMap.set(col + dc, row + dr, TERRAIN.BUILDING);
      tileMap.setBuildingId(col + dc, row + dr, e.id);
    }
  }

  entityManager.add(e);
  return e;
}

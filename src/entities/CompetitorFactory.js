import { createEntity, addComponent } from '../ecs/Entity.js';
import * as C from '../ecs/Component.js';
import { COLORS, BUILDING_TYPE, TERRAIN } from '../core/Constants.js';

export function createCompetitor(entityManager, tileMap, col, row, name) {
  const e = createEntity();
  addComponent(e, 'position', C.Position(col, row));
  addComponent(e, 'building', C.Building(BUILDING_TYPE.COMPETITOR, 3, 3));
  addComponent(e, 'competitor', C.Competitor(name));
  addComponent(e, 'sprite', C.Sprite(COLORS.COMPETITOR, 3, 3, 'rect'));

  // Mark tiles
  for (let dc = 0; dc < 3; dc++) {
    for (let dr = 0; dr < 3; dr++) {
      if (tileMap.inBounds(col + dc, row + dr)) {
        tileMap.set(col + dc, row + dr, TERRAIN.BUILDING);
        tileMap.setBuildingId(col + dc, row + dr, e.id);
      }
    }
  }

  entityManager.add(e);
  return e;
}

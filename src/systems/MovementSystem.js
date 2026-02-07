import { getComponent, hasComponent } from '../ecs/Entity.js';

export class MovementSystem {
  constructor(entityManager, tileMap) {
    this.entityManager = entityManager;
    this.tileMap = tileMap;
  }

  update() {
    const entities = this.entityManager.query('position', 'velocity', 'pathfinding');

    for (const entity of entities) {
      const pos = getComponent(entity, 'position');
      const vel = getComponent(entity, 'velocity');
      const pf = getComponent(entity, 'pathfinding');

      // Save previous position for interpolation
      pos.prevX = pos.x;
      pos.prevY = pos.y;

      if (!pf.path || pf.pathIndex >= pf.path.length) {
        vel.dx = 0;
        vel.dy = 0;
        continue;
      }

      const target = pf.path[pf.pathIndex];
      const tx = target.col + 0.5;
      const ty = target.row + 0.5;

      const dx = tx - pos.x;
      const dy = ty - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.1) {
        // Reached waypoint
        pos.x = tx;
        pos.y = ty;
        pos.col = target.col;
        pos.row = target.row;
        pf.pathIndex++;
        vel.dx = 0;
        vel.dy = 0;
      } else {
        // Move toward target
        const speed = vel.speed;
        // Slow down in dense areas
        const density = this.tileMap.getDensity(pos.col, pos.row);
        const densityFactor = Math.max(0.3, 1 - density * 0.05);
        const effectiveSpeed = speed * densityFactor;

        vel.dx = (dx / dist) * effectiveSpeed;
        vel.dy = (dy / dist) * effectiveSpeed;
        pos.x += vel.dx;
        pos.y += vel.dy;
        pos.col = Math.floor(pos.x);
        pos.row = Math.floor(pos.y);
      }
    }
  }
}

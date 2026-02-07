import { getComponent, hasComponent } from '../ecs/Entity.js';
import { TILE_SIZE } from '../core/Constants.js';
import { smokeColor } from '../utils/ColorUtils.js';

export class EffectsRenderer {
  constructor(entityManager, tileMap, camera, gameState) {
    this.entityManager = entityManager;
    this.tileMap = tileMap;
    this.camera = camera;
    this.gameState = gameState;

    // Smoke particles
    this.smokeParticles = [];
    this.tickCounter = 0;
  }

  update() {
    this.tickCounter++;

    // Spawn smoke from factory chimney
    const factoryEntity = this.entityManager.queryOne('factory');
    if (factoryEntity) {
      const factory = getComponent(factoryEntity, 'factory');
      const pos = getComponent(factoryEntity, 'position');

      if (factory.filledSeats > 0 && this.tickCounter % 8 === 0) {
        const intensity = factory.filledSeats / Math.max(1, factory.seats);
        this.smokeParticles.push({
          x: (pos.col + 5.2) * TILE_SIZE,
          y: (pos.row - 0.8) * TILE_SIZE,
          vx: (Math.random() - 0.3) * 0.3,
          vy: -0.5 - Math.random() * 0.3,
          age: 0,
          maxAge: 60 + Math.random() * 40,
          size: 3 + Math.random() * 4 * intensity,
        });
      }
    }

    // Update particles
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.99;
      p.vx += (Math.random() - 0.5) * 0.05;
      p.size *= 1.005;
      p.age++;

      if (p.age >= p.maxAge) {
        this.smokeParticles.splice(i, 1);
      }
    }

    // Limit particles
    if (this.smokeParticles.length > 100) {
      this.smokeParticles.splice(0, this.smokeParticles.length - 100);
    }
  }

  render(ctx) {
    // Smoke particles
    for (const p of this.smokeParticles) {
      const ageRatio = p.age / p.maxAge;
      ctx.fillStyle = smokeColor(ageRatio);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Density heat shimmer
    this._renderDensityHeat(ctx);

    // Unrest sparks
    if (this.gameState.unrest > 0.5) {
      this._renderUnrestSparks(ctx);
    }
  }

  _renderDensityHeat(ctx) {
    const { minCol, maxCol, minRow, maxRow } = this.camera.getVisibleTiles();
    const ts = TILE_SIZE;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const density = this.tileMap.getDensity(c, r);
        if (density > 3) {
          const alpha = Math.min(0.2, (density - 3) * 0.03);
          ctx.fillStyle = `rgba(200, 100, 50, ${alpha})`;
          ctx.fillRect(c * ts, r * ts, ts, ts);
        }
      }
    }
  }

  _renderUnrestSparks(ctx) {
    if (this.tickCounter % 3 !== 0) return;

    const workers = this.entityManager.query('worker', 'position');
    for (const entity of workers) {
      const worker = getComponent(entity, 'worker');
      if (worker.state !== 'protesting') continue;

      const pos = getComponent(entity, 'position');
      if (Math.random() < 0.3) {
        const sx = pos.x * TILE_SIZE + (Math.random() - 0.5) * 10;
        const sy = pos.y * TILE_SIZE - 5 + (Math.random() - 0.5) * 5;
        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 50, ${0.3 + Math.random() * 0.4})`;
        ctx.fillRect(sx, sy, 2, 2);
      }
    }
  }
}

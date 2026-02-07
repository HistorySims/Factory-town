import { getComponent, hasComponent } from '../ecs/Entity.js';
import { TILE_SIZE, WORKER_STATE } from '../core/Constants.js';
import { workerColor } from '../utils/ColorUtils.js';
import { lerp } from '../utils/MathUtils.js';

export class AgentRenderer {
  constructor(entityManager, camera) {
    this.entityManager = entityManager;
    this.camera = camera;
  }

  render(ctx, alpha) {
    this._renderWorkers(ctx, alpha);
    this._renderTransports(ctx, alpha);
  }

  _renderWorkers(ctx, alpha) {
    const workers = this.entityManager.query('worker', 'position', 'sprite');
    const ts = TILE_SIZE;

    for (const entity of workers) {
      const worker = getComponent(entity, 'worker');
      const pos = getComponent(entity, 'position');

      // Don't render workers inside the factory
      if (worker.state === WORKER_STATE.WORKING) continue;

      // Interpolated position
      const ix = lerp(pos.prevX, pos.x, alpha) * ts;
      const iy = lerp(pos.prevY, pos.y, alpha) * ts;

      // Worker color based on mood
      const color = workerColor(worker.mood);
      const radius = ts * 0.2;

      // Body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ix, iy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Hat/head indicator for state
      if (worker.state === WORKER_STATE.PROTESTING) {
        // Anger indicator - small exclamation
        ctx.fillStyle = '#ff4040';
        ctx.fillRect(ix - 1, iy - radius - 5, 2, 4);
        ctx.fillRect(ix - 1, iy - radius - 1, 2, 1);
      } else if (worker.state === WORKER_STATE.SEEKING_JOB) {
        // Walking indicator - direction dot
        const vel = getComponent(entity, 'velocity');
        if (vel && (vel.dx !== 0 || vel.dy !== 0)) {
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath();
          ctx.arc(ix + vel.dx * 20, iy + vel.dy * 20, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(ix, iy + radius + 1, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderTransports(ctx, alpha) {
    const transports = this.entityManager.query('transport', 'position', 'sprite', 'cargo');
    const ts = TILE_SIZE;

    for (const entity of transports) {
      const transport = getComponent(entity, 'transport');
      const pos = getComponent(entity, 'position');
      const sprite = getComponent(entity, 'sprite');
      const cargo = getComponent(entity, 'cargo');

      const ix = lerp(pos.prevX, pos.x, alpha) * ts;
      const iy = lerp(pos.prevY, pos.y, alpha) * ts;

      const w = sprite.width * ts;
      const h = sprite.height * ts;

      // Vehicle body
      ctx.fillStyle = sprite.color;

      if (transport.type === 'train') {
        // Train - longer rectangle with cabin
        ctx.fillRect(ix - w / 2, iy - h / 2, w, h);
        ctx.fillStyle = '#555';
        ctx.fillRect(ix - w / 2, iy - h / 2, w * 0.25, h);
        // Chimney
        ctx.fillStyle = '#444';
        ctx.fillRect(ix - w / 2 + 2, iy - h / 2 - 4, 4, 4);
      } else if (transport.type === 'barge') {
        // Barge - boat shape
        ctx.beginPath();
        ctx.moveTo(ix - w / 2, iy);
        ctx.lineTo(ix - w / 3, iy - h / 2);
        ctx.lineTo(ix + w / 3, iy - h / 2);
        ctx.lineTo(ix + w / 2, iy);
        ctx.lineTo(ix + w / 3, iy + h / 2);
        ctx.lineTo(ix - w / 3, iy + h / 2);
        ctx.closePath();
        ctx.fill();
      } else {
        // Cart - rectangle with wheels
        ctx.fillRect(ix - w / 2, iy - h / 2, w, h);
        // Wheels
        ctx.fillStyle = '#3a3020';
        ctx.beginPath();
        ctx.arc(ix - w * 0.3, iy + h * 0.3, 2, 0, Math.PI * 2);
        ctx.arc(ix + w * 0.3, iy + h * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cargo indication (stacked rectangles)
      if (cargo.carried > 0) {
        const fillRatio = cargo.carried / cargo.capacity;
        ctx.fillStyle = 'rgba(230, 210, 160, 0.7)';
        const cargoH = h * 0.4 * fillRatio;
        ctx.fillRect(ix - w * 0.2, iy - h * 0.3 - cargoH, w * 0.4, cargoH);
      }
    }
  }
}

import { getComponent, hasComponent } from '../ecs/Entity.js';
import { TILE_SIZE, COLORS, BUILDING_TYPE } from '../core/Constants.js';

export class BuildingRenderer {
  constructor(entityManager, camera) {
    this.entityManager = entityManager;
    this.camera = camera;
  }

  render(ctx) {
    const buildings = this.entityManager.query('building', 'position', 'sprite');
    const ts = TILE_SIZE;

    for (const entity of buildings) {
      const building = getComponent(entity, 'building');
      const pos = getComponent(entity, 'position');
      const sprite = getComponent(entity, 'sprite');

      const x = pos.col * ts;
      const y = pos.row * ts;
      const w = sprite.width * ts;
      const h = sprite.height * ts;

      switch (building.type) {
        case BUILDING_TYPE.FACTORY:
          this._renderFactory(ctx, x, y, w, h, entity);
          break;
        case BUILDING_TYPE.WAREHOUSE:
          this._renderWarehouse(ctx, x, y, w, h, entity);
          break;
        case BUILDING_TYPE.WATER_WHEEL:
          this._renderWaterWheel(ctx, x, y, ts, entity);
          break;
        case BUILDING_TYPE.HOUSING:
          this._renderHousing(ctx, x, y, w, h, entity);
          break;
        case BUILDING_TYPE.COMPETITOR:
          this._renderCompetitor(ctx, x, y, w, h, entity);
          break;
        case BUILDING_TYPE.STATION:
          this._renderStation(ctx, x, y, w, h);
          break;
        default:
          ctx.fillStyle = sprite.color;
          ctx.fillRect(x, y, w, h);
      }
    }
  }

  _renderFactory(ctx, x, y, w, h, entity) {
    // Main building
    ctx.fillStyle = COLORS.FACTORY_WALL;
    ctx.fillRect(x, y, w, h);

    // Roof (darker top)
    ctx.fillStyle = COLORS.FACTORY_ROOF;
    ctx.fillRect(x, y, w, TILE_SIZE * 0.5);

    // Window grid
    ctx.fillStyle = 'rgba(180, 160, 100, 0.3)';
    const ts = TILE_SIZE;
    for (let r = 1; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        ctx.fillRect(x + c * ts + 4, y + r * ts + 4, ts - 8, ts - 8);
      }
    }

    // Factory door
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(x - ts * 0.1, y + ts, ts * 0.4, ts * 1.5);

    // Chimney
    ctx.fillStyle = '#4a3528';
    ctx.fillRect(x + w - ts, y - ts * 0.8, ts * 0.4, ts * 0.8);

    // Work seats indicator
    if (hasComponent(entity, 'factory')) {
      const factory = getComponent(entity, 'factory');
      // Lit windows for filled seats
      ctx.fillStyle = 'rgba(255, 200, 80, 0.5)';
      for (let i = 0; i < factory.filledSeats && i < 6; i++) {
        ctx.fillRect(x + i * ts + 6, y + ts + 6, ts - 12, ts - 12);
      }
    }
  }

  _renderWarehouse(ctx, x, y, w, h, entity) {
    ctx.fillStyle = COLORS.WAREHOUSE;
    ctx.fillRect(x, y, w, h);

    // Peaked roof
    ctx.fillStyle = '#4a5a40';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y - TILE_SIZE * 0.4);
    ctx.lineTo(x + w, y);
    ctx.fill();

    // Door
    ctx.fillStyle = '#3a4a30';
    ctx.fillRect(x + w * 0.3, y + h * 0.4, w * 0.4, h * 0.6);

    // Fill level bar
    if (hasComponent(entity, 'warehouse')) {
      const warehouse = getComponent(entity, 'warehouse');
      const fillRatio = warehouse.shirts / warehouse.capacity;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 2, y + h + 2, w - 4, 4);
      ctx.fillStyle = fillRatio > 0.8 ? '#c84040' : fillRatio > 0.5 ? '#c8b040' : '#60b848';
      ctx.fillRect(x + 2, y + h + 2, (w - 4) * fillRatio, 4);
    }
  }

  _renderWaterWheel(ctx, x, y, ts, entity) {
    const cx = x + ts / 2;
    const cy = y + ts / 2;
    const radius = ts * 0.45;

    // Wheel body
    ctx.strokeStyle = COLORS.WATER_WHEEL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Spokes
    if (hasComponent(entity, 'waterWheel')) {
      const ww = getComponent(entity, 'waterWheel');
      for (let i = 0; i < 6; i++) {
        const angle = ww.angle + (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.stroke();
      }

      // Paddle tips
      ctx.fillStyle = COLORS.WATER_WHEEL;
      for (let i = 0; i < 6; i++) {
        const angle = ww.angle + (i * Math.PI) / 3;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        ctx.fillRect(px - 3, py - 3, 6, 6);
      }
    }
  }

  _renderHousing(ctx, x, y, w, h, entity) {
    // House body
    ctx.fillStyle = COLORS.HOUSING;
    ctx.fillRect(x, y, w, h);

    // Roof
    ctx.fillStyle = COLORS.HOUSING_ROOF;
    ctx.beginPath();
    ctx.moveTo(x - 2, y);
    ctx.lineTo(x + w / 2, y - TILE_SIZE * 0.5);
    ctx.lineTo(x + w + 2, y);
    ctx.fill();

    // Door
    ctx.fillStyle = '#4a3a28';
    ctx.fillRect(x + w * 0.35, y + h * 0.5, w * 0.3, h * 0.5);

    // Window
    ctx.fillStyle = 'rgba(180, 160, 100, 0.3)';
    ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);

    // Occupancy dots
    if (hasComponent(entity, 'housing')) {
      const housing = getComponent(entity, 'housing');
      for (let i = 0; i < housing.residents; i++) {
        ctx.fillStyle = '#60b848';
        ctx.beginPath();
        ctx.arc(x + 4 + i * 6, y + h + 4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _renderCompetitor(ctx, x, y, w, h, entity) {
    const comp = getComponent(entity, 'competitor');
    const pulse = comp ? Math.sin(comp.pulsePhase) * 0.15 + 0.85 : 1;

    // Dark block with pulsing opacity
    ctx.fillStyle = COLORS.COMPETITOR;
    ctx.globalAlpha = pulse;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    // Outline
    ctx.strokeStyle = `rgba(100, 60, 60, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Name
    if (comp) {
      ctx.fillStyle = 'rgba(200, 160, 160, 0.6)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(comp.name, x + w / 2, y + h / 2);
      ctx.textAlign = 'left';
    }
  }

  _renderStation(ctx, x, y, w, h) {
    ctx.fillStyle = COLORS.STATION;
    ctx.fillRect(x, y, w, h);

    // Platform
    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(x - TILE_SIZE * 0.3, y + h, w + TILE_SIZE * 0.6, TILE_SIZE * 0.3);

    // Sign
    ctx.fillStyle = '#d0b060';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STATION', x + w / 2, y + h / 2 + 3);
    ctx.textAlign = 'left';
  }
}

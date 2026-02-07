import { TILE_SIZE, TERRAIN, COLORS } from '../core/Constants.js';
import { riverColor, pollutionOverlay } from '../utils/ColorUtils.js';

export class MapRenderer {
  constructor(tileMap, camera, mapData) {
    this.tileMap = tileMap;
    this.camera = camera;
    this.mapData = mapData; // from generator
    this.riverOffset = 0;

    // Precompute grass variation set
    this.grassAltSet = new Set();
    if (mapData.grassVariation) {
      for (const g of mapData.grassVariation) {
        this.grassAltSet.add(g.col + g.row * tileMap.cols);
      }
    }
  }

  update() {
    this.riverOffset += 0.3;
  }

  render(ctx) {
    const { minCol, maxCol, minRow, maxRow } = this.camera.getVisibleTiles();
    const ts = TILE_SIZE;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const x = c * ts;
        const y = r * ts;
        const terrain = this.tileMap.get(c, r);

        switch (terrain) {
          case TERRAIN.GRASS: {
            const alt = this.grassAltSet.has(c + r * this.tileMap.cols);
            ctx.fillStyle = alt ? COLORS.GRASS_ALT : COLORS.GRASS;
            ctx.fillRect(x, y, ts, ts);
            break;
          }
          case TERRAIN.WATER: {
            const poll = this.tileMap.getPollution(c, r);
            ctx.fillStyle = riverColor(poll);
            ctx.fillRect(x, y, ts, ts);
            // Wave animation
            const waveY = Math.sin((c * 0.5 + this.riverOffset * 0.05)) * 2;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(x, y + ts * 0.4 + waveY, ts, 2);
            break;
          }
          case TERRAIN.ROAD: {
            ctx.fillStyle = COLORS.ROAD;
            ctx.fillRect(x, y, ts, ts);
            // Center line
            ctx.fillStyle = COLORS.ROAD_MARKING;
            ctx.fillRect(x + ts * 0.45, y, ts * 0.1, ts);
            break;
          }
          case TERRAIN.BUILDING: {
            ctx.fillStyle = COLORS.FACTORY_WALL;
            ctx.fillRect(x, y, ts, ts);
            // Grid lines
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.strokeRect(x, y, ts, ts);
            break;
          }
          case TERRAIN.RAIL: {
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(x, y, ts, ts);
            // Rail ties
            ctx.fillStyle = COLORS.RAIL_TIE;
            for (let i = 0; i < 3; i++) {
              ctx.fillRect(x + 2, y + i * (ts / 3) + 2, ts - 4, 3);
            }
            // Rails
            ctx.fillStyle = COLORS.RAIL;
            ctx.fillRect(x + ts * 0.25, y, 2, ts);
            ctx.fillRect(x + ts * 0.7, y, 2, ts);
            break;
          }
          case TERRAIN.CANAL: {
            ctx.fillStyle = COLORS.CANAL;
            ctx.fillRect(x, y, ts, ts);
            // Stone embankment edges
            ctx.fillStyle = 'rgba(100,90,70,0.5)';
            ctx.fillRect(x, y, 2, ts);
            ctx.fillRect(x + ts - 2, y, 2, ts);
            break;
          }
          case TERRAIN.BRIDGE: {
            ctx.fillStyle = COLORS.ROAD;
            ctx.fillRect(x, y, ts, ts);
            // Bridge rails
            ctx.fillStyle = '#6a5a40';
            ctx.fillRect(x, y, 3, ts);
            ctx.fillRect(x + ts - 3, y, 3, ts);
            break;
          }
        }

        // Pollution overlay on water
        if (terrain === TERRAIN.WATER || terrain === TERRAIN.CANAL) {
          const poll = this.tileMap.getPollution(c, r);
          if (poll > 0.05) {
            ctx.fillStyle = pollutionOverlay(poll);
            ctx.fillRect(x, y, ts, ts);
          }
        }
      }
    }
  }
}

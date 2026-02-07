import { MAP_COLS, MAP_ROWS, TERRAIN } from '../core/Constants.js';

export class TileMap {
  constructor() {
    this.cols = MAP_COLS;
    this.rows = MAP_ROWS;
    this.tiles = new Array(this.cols * this.rows).fill(TERRAIN.GRASS);
    this.pollution = new Float32Array(this.cols * this.rows); // 0-1 per tile
    this.density = new Float32Array(this.cols * this.rows);   // crowd density
    this.buildingIds = new Int32Array(this.cols * this.rows);  // entity id occupying tile, 0=none
  }

  idx(col, row) {
    return row * this.cols + col;
  }

  inBounds(col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  get(col, row) {
    if (!this.inBounds(col, row)) return TERRAIN.WATER; // out of bounds = water (impassable)
    return this.tiles[this.idx(col, row)];
  }

  set(col, row, terrain) {
    if (!this.inBounds(col, row)) return;
    this.tiles[this.idx(col, row)] = terrain;
  }

  getPollution(col, row) {
    if (!this.inBounds(col, row)) return 0;
    return this.pollution[this.idx(col, row)];
  }

  setPollution(col, row, val) {
    if (!this.inBounds(col, row)) return;
    this.pollution[this.idx(col, row)] = Math.min(1, Math.max(0, val));
  }

  addPollution(col, row, amount) {
    if (!this.inBounds(col, row)) return;
    const i = this.idx(col, row);
    this.pollution[i] = Math.min(1, this.pollution[i] + amount);
  }

  getDensity(col, row) {
    if (!this.inBounds(col, row)) return 0;
    return this.density[this.idx(col, row)];
  }

  getBuildingId(col, row) {
    if (!this.inBounds(col, row)) return 0;
    return this.buildingIds[this.idx(col, row)];
  }

  setBuildingId(col, row, id) {
    if (!this.inBounds(col, row)) return;
    this.buildingIds[this.idx(col, row)] = id;
  }

  isWalkable(col, row) {
    if (!this.inBounds(col, row)) return false;
    const t = this.get(col, row);
    return t === TERRAIN.GRASS || t === TERRAIN.ROAD || t === TERRAIN.BRIDGE;
  }

  isWater(col, row) {
    if (!this.inBounds(col, row)) return false;
    const t = this.get(col, row);
    return t === TERRAIN.WATER || t === TERRAIN.CANAL;
  }

  isRoad(col, row) {
    return this.inBounds(col, row) && this.get(col, row) === TERRAIN.ROAD;
  }

  isRail(col, row) {
    return this.inBounds(col, row) && this.get(col, row) === TERRAIN.RAIL;
  }

  // Find all water tiles (for river queries)
  getRiverTiles() {
    const tiles = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.get(c, r) === TERRAIN.WATER) {
          tiles.push({ col: c, row: r });
        }
      }
    }
    return tiles;
  }

  // Average pollution across river tiles
  getRiverHealth() {
    const river = this.getRiverTiles();
    if (river.length === 0) return 1;
    let total = 0;
    for (const t of river) {
      total += this.getPollution(t.col, t.row);
    }
    return 1 - (total / river.length);
  }

  // Reset density each tick (recalculated by DensitySystem)
  resetDensity() {
    this.density.fill(0);
  }

  addDensity(col, row, amount) {
    if (!this.inBounds(col, row)) return;
    this.density[this.idx(col, row)] += amount;
  }

  // Find nearest walkable tile to a given position
  findNearestWalkable(col, row) {
    if (this.isWalkable(col, row)) return { col, row };
    for (let r = 1; r < 10; r++) {
      for (let dc = -r; dc <= r; dc++) {
        for (let dr = -r; dr <= r; dr++) {
          if (Math.abs(dc) !== r && Math.abs(dr) !== r) continue;
          const nc = col + dc;
          const nr = row + dr;
          if (this.isWalkable(nc, nr)) return { col: nc, row: nr };
        }
      }
    }
    return { col, row };
  }
}

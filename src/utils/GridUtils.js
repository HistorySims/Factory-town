import { TILE_SIZE } from '../core/Constants.js';

export function tileToWorld(col, row) {
  return { x: col * TILE_SIZE, y: row * TILE_SIZE };
}

export function worldToTile(x, y) {
  return { col: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE) };
}

export function tileCenterWorld(col, row) {
  return { x: (col + 0.5) * TILE_SIZE, y: (row + 0.5) * TILE_SIZE };
}

export function neighbors4(col, row) {
  return [
    { col: col - 1, row },
    { col: col + 1, row },
    { col, row: row - 1 },
    { col, row: row + 1 },
  ];
}

export function neighbors8(col, row) {
  const n = [];
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (dc === 0 && dr === 0) continue;
      n.push({ col: col + dc, row: row + dr });
    }
  }
  return n;
}

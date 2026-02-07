import { neighbors4 } from '../utils/GridUtils.js';

// A* pathfinder over the tile grid
export class Pathfinder {
  constructor(tileMap) {
    this.tileMap = tileMap;
    this.cache = new Map(); // simple LRU-ish cache
    this.maxCacheSize = 200;
  }

  findPath(startCol, startRow, endCol, endRow, allowWater = false) {
    const key = `${startCol},${startRow}-${endCol},${endRow}`;
    if (this.cache.has(key)) {
      return this.cache.get(key).slice(); // return copy
    }

    const map = this.tileMap;
    if (!map.inBounds(endCol, endRow)) return null;

    const canWalk = (c, r) => {
      if (allowWater) return map.inBounds(c, r) && (map.isWalkable(c, r) || map.isWater(c, r));
      return map.isWalkable(c, r);
    };

    if (!canWalk(startCol, startRow) || !canWalk(endCol, endRow)) {
      return null;
    }

    // A* implementation
    const openSet = new MinHeap();
    const gScore = new Map();
    const cameFrom = new Map();

    const startKey = startCol + startRow * map.cols;
    const endKey = endCol + endRow * map.cols;

    gScore.set(startKey, 0);
    openSet.push({ key: startKey, col: startCol, row: startRow, f: this._heuristic(startCol, startRow, endCol, endRow) });

    let iterations = 0;
    const maxIterations = 2000;

    while (openSet.size() > 0 && iterations < maxIterations) {
      iterations++;
      const current = openSet.pop();

      if (current.key === endKey) {
        // Reconstruct path
        const path = [];
        let k = endKey;
        while (k !== startKey) {
          const c = k % map.cols;
          const r = Math.floor(k / map.cols);
          path.unshift({ col: c, row: r });
          k = cameFrom.get(k);
          if (k === undefined) break;
        }
        // Cache it
        if (this.cache.size >= this.maxCacheSize) {
          const first = this.cache.keys().next().value;
          this.cache.delete(first);
        }
        this.cache.set(key, path);
        return path.slice();
      }

      const currentG = gScore.get(current.key);
      const nbrs = neighbors4(current.col, current.row);

      for (const n of nbrs) {
        if (!canWalk(n.col, n.row)) continue;

        const nKey = n.col + n.row * map.cols;
        const tentativeG = currentG + 1;

        if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
          gScore.set(nKey, tentativeG);
          cameFrom.set(nKey, current.key);
          const f = tentativeG + this._heuristic(n.col, n.row, endCol, endRow);
          openSet.push({ key: nKey, col: n.col, row: n.row, f });
        }
      }
    }

    return null; // no path found
  }

  _heuristic(c1, r1, c2, r2) {
    return Math.abs(c2 - c1) + Math.abs(r2 - r1);
  }

  clearCache() {
    this.cache.clear();
  }
}

// Simple min-heap for A*
class MinHeap {
  constructor() {
    this.data = [];
  }

  size() {
    return this.data.length;
  }

  push(item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].f < this.data[parent].f) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }

  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.data[left].f < this.data[smallest].f) smallest = left;
      if (right < n && this.data[right].f < this.data[smallest].f) smallest = right;
      if (smallest !== i) {
        [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
        i = smallest;
      } else break;
    }
  }
}

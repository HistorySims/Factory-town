import { clamp } from '../utils/MathUtils.js';
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from './Constants.js';

export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = (MAP_COLS * TILE_SIZE) / 2;
    this.y = (MAP_ROWS * TILE_SIZE) / 2;
    this.zoom = 1.5;
    this.minZoom = 0.5;
    this.maxZoom = 4;
  }

  zoomAt(screenX, screenY, factor) {
    const oldZoom = this.zoom;
    this.zoom = clamp(this.zoom * factor, this.minZoom, this.maxZoom);
    // Zoom toward mouse position
    const worldBefore = this.screenToWorld(screenX, screenY);
    const worldAfter = this.screenToWorld(screenX, screenY);
    // Recalculate to keep point under mouse stable
    const scale = this.zoom / oldZoom;
    // Actually re-derive: we want the world point that was under the mouse to stay there
    // screenToWorld uses current zoom, so after changing zoom:
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    // Before zoom: worldBefore = (screenX - cx) / oldZoom + this.x
    // After zoom we want same world point: worldBefore = (screenX - cx) / this.zoom + newX
    // newX = worldBefore - (screenX - cx) / this.zoom
    this.x = worldBefore.x - (screenX - cx) / this.zoom;
    this.y = worldBefore.y - (screenY - cy) / this.zoom;
  }

  screenToWorld(sx, sy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    return {
      x: (sx - cx) / this.zoom + this.x,
      y: (sy - cy) / this.zoom + this.y,
    };
  }

  worldToScreen(wx, wy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    return {
      x: (wx - this.x) * this.zoom + cx,
      y: (wy - this.y) * this.zoom + cy,
    };
  }

  getVisibleRect() {
    const halfW = (this.canvas.width / 2) / this.zoom;
    const halfH = (this.canvas.height / 2) / this.zoom;
    return {
      left: this.x - halfW,
      top: this.y - halfH,
      right: this.x + halfW,
      bottom: this.y + halfH,
    };
  }

  getVisibleTiles() {
    const r = this.getVisibleRect();
    return {
      minCol: Math.max(0, Math.floor(r.left / TILE_SIZE) - 1),
      maxCol: Math.min(MAP_COLS - 1, Math.ceil(r.right / TILE_SIZE) + 1),
      minRow: Math.max(0, Math.floor(r.top / TILE_SIZE) - 1),
      maxRow: Math.min(MAP_ROWS - 1, Math.ceil(r.bottom / TILE_SIZE) + 1),
    };
  }

  applyTransform(ctx) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    ctx.setTransform(this.zoom, 0, 0, this.zoom, cx - this.x * this.zoom, cy - this.y * this.zoom);
  }
}

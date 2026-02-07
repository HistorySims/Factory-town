import { TILE_SIZE, MAP_COLS, MAP_ROWS, PHASE } from '../core/Constants.js';

export class HudRenderer {
  constructor(camera, gameState, tileMap) {
    this.camera = camera;
    this.gameState = gameState;
    this.tileMap = tileMap;
  }

  render(ctx, canvasWidth, canvasHeight) {
    // Reset transform for HUD drawing (screen space)
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    this._renderMinimap(ctx, canvasWidth, canvasHeight);
    this._renderPhaseIndicator(ctx, canvasWidth);
  }

  _renderMinimap(ctx, canvasWidth, canvasHeight) {
    const mmW = 140;
    const mmH = 90;
    const mmX = canvasWidth - mmW - 16;
    const mmY = canvasHeight - mmH - 16;
    const scaleX = mmW / MAP_COLS;
    const scaleY = mmH / MAP_ROWS;

    // Background
    ctx.fillStyle = 'rgba(10, 8, 15, 0.7)';
    ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
    ctx.strokeStyle = '#44403a';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);

    // Terrain
    for (let r = 0; r < MAP_ROWS; r += 2) {
      for (let c = 0; c < MAP_COLS; c += 2) {
        const terrain = this.tileMap.get(c, r);
        let color;
        switch (terrain) {
          case 1: // WATER
            color = '#3a6fb5';
            break;
          case 2: // ROAD
            color = '#8a7d60';
            break;
          case 3: // BUILDING
            color = '#6b5040';
            break;
          case 4: // RAIL
            color = '#555';
            break;
          default:
            color = '#3a5a2a';
        }
        ctx.fillStyle = color;
        ctx.fillRect(mmX + c * scaleX, mmY + r * scaleY, scaleX * 2, scaleY * 2);
      }
    }

    // Camera viewport indicator
    const visRect = this.camera.getVisibleRect();
    const vx = mmX + (visRect.left / (MAP_COLS * TILE_SIZE)) * mmW;
    const vy = mmY + (visRect.top / (MAP_ROWS * TILE_SIZE)) * mmH;
    const vw = ((visRect.right - visRect.left) / (MAP_COLS * TILE_SIZE)) * mmW;
    const vh = ((visRect.bottom - visRect.top) / (MAP_ROWS * TILE_SIZE)) * mmH;

    ctx.strokeStyle = '#d0b060';
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, vw, vh);
  }

  _renderPhaseIndicator(ctx, canvasWidth) {
    const phase = this.gameState.phase;
    let label, color;

    switch (phase) {
      case PHASE.EARLY:
        label = 'Early Industry';
        color = '#6a8a50';
        break;
      case PHASE.MID:
        label = 'Expansion';
        color = '#c8a050';
        break;
      case PHASE.LATE:
        label = 'Industrial Age';
        color = '#c85050';
        break;
    }

    ctx.fillStyle = 'rgba(10, 8, 15, 0.5)';
    ctx.fillRect(canvasWidth / 2 - 60, 8, 120, 22);
    ctx.fillStyle = color;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, canvasWidth / 2, 23);
    ctx.textAlign = 'left';
  }
}

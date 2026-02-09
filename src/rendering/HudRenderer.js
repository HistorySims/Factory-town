import { TILE_SIZE, MAP_COLS, MAP_ROWS, PHASE } from '../core/Constants.js';

export class HudRenderer {
  constructor(camera, gameState, tileMap, isTouchDevice) {
    this.camera = camera;
    this.gameState = gameState;
    this.tileMap = tileMap;
    this.isTouchDevice = isTouchDevice; // function that returns current value
    this.hintTimer = 600; // show for ~10 seconds then fade
  }

  render(ctx, canvasWidth, canvasHeight) {
    // Reset transform for HUD drawing (screen space)
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const isMobile = canvasWidth < 700;
    this._renderMinimap(ctx, canvasWidth, canvasHeight, isMobile);
    this._renderPhaseIndicator(ctx, canvasWidth, isMobile);

    if (this.hintTimer > 0) {
      this.hintTimer--;
      this._renderControlHint(ctx, canvasWidth, canvasHeight, isMobile);
    }
  }

  _renderMinimap(ctx, canvasWidth, canvasHeight, isMobile) {
    const mmW = isMobile ? 100 : 140;
    const mmH = isMobile ? 64 : 90;
    const mmX = canvasWidth - mmW - 12;
    // On mobile push minimap above the bottom control bar
    const mmY = isMobile
      ? canvasHeight - mmH - 150
      : canvasHeight - mmH - 16;
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

  _renderPhaseIndicator(ctx, canvasWidth, isMobile) {
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

    const y = isMobile ? 36 : 8;
    ctx.fillStyle = 'rgba(10, 8, 15, 0.5)';
    ctx.fillRect(canvasWidth / 2 - 60, y, 120, 22);
    ctx.fillStyle = color;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, canvasWidth / 2, y + 15);
    ctx.textAlign = 'left';
  }

  _renderControlHint(ctx, canvasWidth, canvasHeight, isMobile) {
    const alpha = this.hintTimer < 120 ? this.hintTimer / 120 : 1;
    const isTouch = typeof this.isTouchDevice === 'function'
      ? this.isTouchDevice()
      : this.isTouchDevice;

    const lines = isTouch
      ? ['Drag to pan  |  Pinch to zoom  |  Tap to build']
      : ['WASD to pan  |  Scroll to zoom  |  Click to build', 'Shift+Click to drag  |  1-4 hotkeys'];

    const y = isMobile ? canvasHeight - 160 : canvasHeight - 130;

    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = '#a09878';
    ctx.font = `${isMobile ? 11 : 10}px monospace`;
    ctx.textAlign = 'center';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], canvasWidth / 2, y + i * 16);
    }
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

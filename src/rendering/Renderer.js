import { MapRenderer } from '../map/MapRenderer.js';
import { BuildingRenderer } from './BuildingRenderer.js';
import { AgentRenderer } from './AgentRenderer.js';
import { EffectsRenderer } from './EffectsRenderer.js';
import { HudRenderer } from './HudRenderer.js';

export class Renderer {
  constructor(canvas, camera, entityManager, tileMap, gameState, mapData, input) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;

    this.mapRenderer = new MapRenderer(tileMap, camera, mapData);
    this.buildingRenderer = new BuildingRenderer(entityManager, camera);
    this.agentRenderer = new AgentRenderer(entityManager, camera);
    this.effectsRenderer = new EffectsRenderer(entityManager, tileMap, camera, gameState);
    this.hudRenderer = new HudRenderer(camera, gameState, tileMap, () => input.isTouchDevice);
  }

  update() {
    this.mapRenderer.update();
    this.effectsRenderer.update();
  }

  render(alpha) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Apply camera transform
    this.camera.applyTransform(ctx);

    // Render layers in z-order
    this.mapRenderer.render(ctx);
    this.buildingRenderer.render(ctx);
    this.agentRenderer.render(ctx, alpha);
    this.effectsRenderer.render(ctx);

    // HUD (screen space)
    this.hudRenderer.render(ctx, w, h);
  }
}

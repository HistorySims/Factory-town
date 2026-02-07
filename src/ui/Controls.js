import { PHASE } from '../core/Constants.js';
import { worldToTile } from '../utils/GridUtils.js';
import { createHousingBuilding } from '../entities/BuildingFactory.js';

export class Controls {
  constructor(gameState, eventBus, entityManager, tileMap, input, mapData) {
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.entityManager = entityManager;
    this.tileMap = tileMap;
    this.input = input;
    this.mapData = mapData;

    this.buildMode = null; // 'housing', 'seat', 'canal'
    this.housingCost = 15;
    this.seatCost = 10;
    this.canalCost = 20;

    this._setupSliders();
    this._setupButtons();
    this._setupPhaseUnlocks();
  }

  _setupSliders() {
    const wageSlider = document.getElementById('wage-slider');
    const wageValue = document.getElementById('wage-value');
    const priceSlider = document.getElementById('price-slider');
    const priceValue = document.getElementById('price-value');

    wageSlider.addEventListener('input', () => {
      this.gameState.wage = parseInt(wageSlider.value);
      wageValue.textContent = wageSlider.value;
    });

    priceSlider.addEventListener('input', () => {
      this.gameState.price = parseInt(priceSlider.value);
      priceValue.textContent = priceSlider.value;
    });
  }

  _setupButtons() {
    document.getElementById('btn-housing').addEventListener('click', () => {
      this._toggleBuildMode('housing');
    });
    document.getElementById('btn-seat').addEventListener('click', () => {
      this._toggleBuildMode('seat');
    });
    document.getElementById('btn-canal').addEventListener('click', () => {
      this._toggleBuildMode('canal');
    });
    document.getElementById('btn-dump-waste').addEventListener('click', () => {
      this._toggleWasteDumping();
    });
  }

  _setupPhaseUnlocks() {
    this.eventBus.on('phase:changed', (data) => {
      if (data.to === PHASE.MID || data.to === PHASE.LATE) {
        document.getElementById('btn-canal').classList.remove('hidden');
        document.getElementById('btn-dump-waste').classList.remove('hidden');
      }
    });
  }

  _toggleBuildMode(mode) {
    // Deactivate all
    document.querySelectorAll('#build-buttons button').forEach(b => b.classList.remove('active'));

    if (this.buildMode === mode) {
      this.buildMode = null;
    } else {
      this.buildMode = mode;
      const btnId = mode === 'housing' ? 'btn-housing' : mode === 'seat' ? 'btn-seat' : 'btn-canal';
      document.getElementById(btnId).classList.add('active');
    }
  }

  _toggleWasteDumping() {
    const factory = this.entityManager.queryOne('factory');
    if (factory) {
      const f = factory.components.get('factory');
      f.dumpingWaste = !f.dumpingWaste;
      const btn = document.getElementById('btn-dump-waste');
      btn.textContent = f.dumpingWaste ? 'Stop Dumping' : 'Dump Waste';
      btn.classList.toggle('active', f.dumpingWaste);
    }
  }

  update() {
    // Handle keyboard shortcuts (using number keys to avoid WASD camera conflicts)
    if (this.input.consumeKeyPress('1')) this._toggleBuildMode('housing');
    if (this.input.consumeKeyPress('2')) this._toggleBuildMode('seat');
    if (this.input.consumeKeyPress('3')) this._toggleBuildMode('canal');
    if (this.input.consumeKeyPress('4')) this._toggleWasteDumping();
    if (this.input.consumeKeyPress('escape')) {
      this.buildMode = null;
      document.querySelectorAll('#build-buttons button').forEach(b => b.classList.remove('active'));
    }

    // Handle build placement
    if (this.buildMode) {
      const click = this.input.consumeClick();
      if (click) {
        const tile = worldToTile(click.x, click.y);
        this._tryBuild(tile.col, tile.row);
      }
    }

    // Cancel build on right click
    const rightClick = this.input.consumeRightClick();
    if (rightClick && this.buildMode) {
      this.buildMode = null;
      document.querySelectorAll('#build-buttons button').forEach(b => b.classList.remove('active'));
    }

    // Update info panel
    this._updateInfoPanel();
  }

  _tryBuild(col, row) {
    switch (this.buildMode) {
      case 'housing':
        this._tryBuildHousing(col, row);
        break;
      case 'seat':
        this._tryAddSeat();
        break;
      case 'canal':
        this._tryBuildCanal(col, row);
        break;
    }
  }

  _tryBuildHousing(col, row) {
    if (this.gameState.money < this.housingCost) return;

    // Check 2x2 area is free grass
    for (let dc = 0; dc < 2; dc++) {
      for (let dr = 0; dr < 2; dr++) {
        if (!this.tileMap.isWalkable(col + dc, row + dr)) return;
        if (this.tileMap.getBuildingId(col + dc, row + dr) !== 0) return;
      }
    }

    this.gameState.money -= this.housingCost;
    createHousingBuilding(this.entityManager, this.tileMap, col, row);
    this.eventBus.emit('building:built', { type: 'housing', col, row });
  }

  _tryAddSeat() {
    if (this.gameState.money < this.seatCost) return;

    const factory = this.entityManager.queryOne('factory');
    if (!factory) return;

    const f = factory.components.get('factory');
    f.seats++;
    this.gameState.money -= this.seatCost;
    this.eventBus.emit('factory:seatAdded', { seats: f.seats });
  }

  _tryBuildCanal(col, row) {
    if (this.gameState.money < this.canalCost) return;

    // Can only build canal adjacent to water
    let adjacentWater = false;
    const neighbors = [
      [col - 1, row], [col + 1, row], [col, row - 1], [col, row + 1],
    ];
    for (const [nc, nr] of neighbors) {
      if (this.tileMap.isWater(nc, nr)) {
        adjacentWater = true;
        break;
      }
    }

    if (!adjacentWater) return;
    if (!this.tileMap.isWalkable(col, row)) return;

    this.tileMap.set(col, row, 5); // CANAL
    this.gameState.money -= this.canalCost;
    this.gameState.hasCanal = true;
    this.eventBus.emit('canal:built', { col, row });
  }

  _updateInfoPanel() {
    const gs = this.gameState;
    document.querySelector('#info-workers span').textContent = gs.population;
    document.querySelector('#info-production span').textContent = gs.production.toFixed(2);
    document.querySelector('#info-warehouse span').textContent = Math.floor(gs.warehouseShirts);
    document.querySelector('#info-money span').textContent = Math.floor(gs.money);
    document.querySelector('#info-unrest span').textContent = Math.round(gs.unrest * 100) + '%';
  }
}

import { EventBus } from './EventBus.js';
import { Camera } from './Camera.js';
import { Input } from './Input.js';
import { TICK_MS, PHASE, DEFAULT_WAGE, DEFAULT_PRICE, STARTING_MONEY } from './Constants.js';

import { EntityManager } from '../ecs/EntityManager.js';
import { TileMap } from '../map/TileMap.js';
import { MapGenerator } from '../map/MapGenerator.js';
import { Pathfinder } from '../map/Pathfinder.js';
import { Renderer } from '../rendering/Renderer.js';

import { MovementSystem } from '../systems/MovementSystem.js';
import { WorkerSystem } from '../systems/WorkerSystem.js';
import { ProductionSystem } from '../systems/ProductionSystem.js';
import { TransportSystem } from '../systems/TransportSystem.js';
import { RailroadSystem } from '../systems/RailroadSystem.js';
import { PollutionSystem } from '../systems/PollutionSystem.js';
import { DensitySystem } from '../systems/DensitySystem.js';
import { CompetitorSystem } from '../systems/CompetitorSystem.js';
import { UnrestSystem } from '../systems/UnrestSystem.js';
import { PhaseSystem } from '../systems/PhaseSystem.js';
import { HousingSystem } from '../systems/HousingSystem.js';

import { createFactoryBuilding, createWarehouse, createWaterWheel } from '../entities/BuildingFactory.js';
import { createCompetitor } from '../entities/CompetitorFactory.js';
import { createWorker } from '../entities/AgentFactory.js';

import { MeetingDialog } from '../ui/MeetingDialog.js';
import { PhaseBanner } from '../ui/PhaseBanner.js';
import { Controls } from '../ui/Controls.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.paused = false;

    // Game state (shared mutable state read by all systems)
    this.state = {
      phase: PHASE.EARLY,
      wage: DEFAULT_WAGE,
      price: DEFAULT_PRICE,
      money: STARTING_MONEY,
      population: 0,
      production: 0,
      totalProduced: 0,
      totalSold: 0,
      warehouseShirts: 0,
      unrest: 0,
      riverHealth: 1,
      hasCanal: false,
      mapData: null,
      policies: {
        housingSubsidy: false,
        wageFloor: false,
        wageFloorAmount: 0,
        railExpansion: false,
        sewers: false,
        policing: false,
        pollutionTax: false,
        factoryInspections: false,
      },
    };

    // Core
    this.eventBus = new EventBus();
    this.entityManager = new EntityManager();
    this.camera = new Camera(canvas);
    this.input = new Input(canvas, this.camera);

    // Map
    this.tileMap = new TileMap();
    const generator = new MapGenerator();
    this.mapData = generator.generate(this.tileMap);
    this.state.mapData = this.mapData;

    // Pathfinder
    this.pathfinder = new Pathfinder(this.tileMap);

    // Create initial entities
    this._createInitialEntities();

    // Systems
    this.movementSystem = new MovementSystem(this.entityManager, this.tileMap);
    this.workerSystem = new WorkerSystem(this.entityManager, this.tileMap, this.pathfinder, this.eventBus, this.state);
    this.productionSystem = new ProductionSystem(this.entityManager, this.tileMap, this.eventBus, this.state);
    this.transportSystem = new TransportSystem(this.entityManager, this.tileMap, this.pathfinder, this.eventBus, this.state, this.mapData);
    this.railroadSystem = new RailroadSystem(this.entityManager, this.tileMap, this.pathfinder, this.eventBus, this.state, this.mapData);
    this.pollutionSystem = new PollutionSystem(this.entityManager, this.tileMap, this.state, this.mapData);
    this.densitySystem = new DensitySystem(this.entityManager, this.tileMap, this.state);
    this.competitorSystem = new CompetitorSystem(this.entityManager, this.state);
    this.unrestSystem = new UnrestSystem(this.entityManager, this.tileMap, this.state, this.eventBus);
    this.phaseSystem = new PhaseSystem(this.state, this.eventBus);
    this.housingSystem = new HousingSystem(this.entityManager, this.tileMap, this.state, this.eventBus);

    // Renderer
    this.renderer = new Renderer(canvas, this.camera, this.entityManager, this.tileMap, this.state, this.mapData, this.input);

    // UI
    this.meetingDialog = new MeetingDialog(this.state, this.eventBus);
    this.phaseBanner = new PhaseBanner(this.eventBus);
    this.controls = new Controls(this.state, this.eventBus, this.entityManager, this.tileMap, this.input, this.mapData);

    // Event handlers
    this.eventBus.on('game:pause', () => { this.paused = true; });
    this.eventBus.on('game:resume', () => { this.paused = false; });

    // Center camera on factory
    const fp = this.mapData.factoryOrigin;
    this.camera.x = (fp.col + 3) * 24; // TILE_SIZE
    this.camera.y = (fp.row + 2) * 24;

    // Game loop timing
    this.lastTime = 0;
    this.accumulator = 0;
  }

  _createInitialEntities() {
    const md = this.mapData;

    // Factory
    createFactoryBuilding(this.entityManager, this.tileMap, md.factoryOrigin.col, md.factoryOrigin.row);

    // Warehouse
    createWarehouse(this.entityManager, this.tileMap, md.warehouseLocation.col, md.warehouseLocation.row);

    // Water wheel
    createWaterWheel(this.entityManager, md.waterWheelLocation.col, md.waterWheelLocation.row);

    // Competitors
    for (const cl of md.competitorLocations) {
      createCompetitor(this.entityManager, this.tileMap, cl.col, cl.row, cl.name);
    }

    // Initial workers (a few wandering the town)
    for (let i = 0; i < 5; i++) {
      const col = md.factoryOrigin.col - 3 + Math.floor(Math.random() * 10);
      const row = md.roadRow + Math.floor(Math.random() * 3) - 1;
      const walkable = this.tileMap.findNearestWalkable(col, row);
      createWorker(this.entityManager, walkable.col, walkable.row, walkable.col, walkable.row);
    }
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this._loop(this.lastTime);
  }

  _loop(timestamp) {
    if (!this.running) return;

    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Resize canvas
    if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    if (!this.paused) {
      this.accumulator += dt;

      // Fixed timestep updates
      let steps = 0;
      while (this.accumulator >= TICK_MS && steps < 4) {
        this._update();
        this.accumulator -= TICK_MS;
        steps++;
      }

      // Render with interpolation alpha
      const alpha = this.accumulator / TICK_MS;
      this.renderer.update();
      this.renderer.render(alpha);
    } else {
      // Still render when paused (but no game update)
      this.renderer.render(0);
    }

    // Input updates (always, even when paused for camera movement)
    this.input.update();
    this.input.endFrame();

    requestAnimationFrame((t) => this._loop(t));
  }

  _update() {
    // Update systems in order
    this.densitySystem.update();
    this.housingSystem.update();
    this.workerSystem.update();
    this.movementSystem.update();
    this.productionSystem.update();
    this.transportSystem.update();
    this.railroadSystem.update();
    this.pollutionSystem.update();
    this.competitorSystem.update();
    this.unrestSystem.update();
    this.phaseSystem.update();
    this.controls.update();

    // Apply policy effects
    this._applyPolicies();

    // Cleanup dead entities
    this.entityManager.cleanup();
  }

  _applyPolicies() {
    const p = this.state.policies;

    // Pollution tax: deduct money based on pollution
    if (p.pollutionTax) {
      const pollution = 1 - this.state.riverHealth;
      this.state.money -= pollution * 0.01;
    }

    // Factory inspections: reduce production slightly
    if (p.factoryInspections) {
      const factory = this.entityManager.queryOne('factory');
      if (factory) {
        const f = factory.components.get('factory');
        // Cap seats that can be active
        f.power = Math.min(f.power, Math.floor(f.seats * 0.8));
      }
    }
  }
}

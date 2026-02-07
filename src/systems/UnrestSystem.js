import { getComponent } from '../ecs/Entity.js';
import { WORKER_STATE, MEETING_UNREST_THRESHOLD, UNREST_WAGE_THRESHOLD, UNREST_DENSITY_THRESHOLD } from '../core/Constants.js';
import { clamp } from '../utils/MathUtils.js';

export class UnrestSystem {
  constructor(entityManager, tileMap, gameState, eventBus) {
    this.entityManager = entityManager;
    this.tileMap = tileMap;
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.meetingCooldown = 0;
    this.lastMeetingUnrest = 0;
  }

  update() {
    if (this.meetingCooldown > 0) this.meetingCooldown--;

    // Calculate unrest factors
    let unrestPressure = 0;

    // Low wages
    if (this.gameState.wage < UNREST_WAGE_THRESHOLD) {
      unrestPressure += (UNREST_WAGE_THRESHOLD - this.gameState.wage) * 0.05;
    }

    // Pollution
    const riverHealth = this.tileMap.getRiverHealth();
    unrestPressure += (1 - riverHealth) * 0.3;

    // High density / overcrowding
    const population = this.gameState.population;
    const housing = this.entityManager.count('housing');
    const housingCapacity = housing * 4;
    if (population > housingCapacity) {
      unrestPressure += (population - housingCapacity) * 0.02;
    }

    // Density hotspots
    const workers = this.entityManager.query('worker', 'position');
    let maxDensity = 0;
    for (const w of workers) {
      const pos = getComponent(w, 'position');
      const d = this.tileMap.getDensity(pos.col, pos.row);
      maxDensity = Math.max(maxDensity, d);
    }
    if (maxDensity > UNREST_DENSITY_THRESHOLD) {
      unrestPressure += (maxDensity - UNREST_DENSITY_THRESHOLD) * 0.02;
    }

    // Policy effects
    if (this.gameState.policies.policing) {
      unrestPressure *= 0.6; // Police suppress unrest
    }
    if (this.gameState.policies.wageFloor && this.gameState.wage < this.gameState.policies.wageFloorAmount) {
      // Player violating wage floor
      unrestPressure += 0.2;
    }

    // Smoothly update unrest
    const targetUnrest = clamp(unrestPressure, 0, 1);
    this.gameState.unrest += (targetUnrest - this.gameState.unrest) * 0.005;
    this.gameState.unrest = clamp(this.gameState.unrest, 0, 1);

    // Trigger meeting when unrest threshold crossed
    if (this.gameState.unrest > MEETING_UNREST_THRESHOLD &&
        this.meetingCooldown <= 0 &&
        this.gameState.unrest - this.lastMeetingUnrest > 0.1) {
      this.meetingCooldown = 3000; // cooldown ticks
      this.lastMeetingUnrest = this.gameState.unrest;
      this.eventBus.emit('meeting:called', { reason: 'unrest' });
    }

    // Workers switch to protesting if unrest is very high
    if (this.gameState.unrest > 0.7) {
      for (const w of workers) {
        const worker = getComponent(w, 'worker');
        if (worker.state === WORKER_STATE.IDLE && Math.random() < 0.01) {
          worker.state = WORKER_STATE.PROTESTING;
        }
      }
    }
  }
}

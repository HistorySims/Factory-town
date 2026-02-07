import { getComponent, hasComponent } from '../ecs/Entity.js';
import { WORKER_STATE, BUILDING_TYPE, BASE_WALK_SPEED } from '../core/Constants.js';
import { distance } from '../utils/MathUtils.js';

export class WorkerSystem {
  constructor(entityManager, tileMap, pathfinder, eventBus, gameState) {
    this.entityManager = entityManager;
    this.tileMap = tileMap;
    this.pathfinder = pathfinder;
    this.eventBus = eventBus;
    this.gameState = gameState;
  }

  update() {
    const workers = this.entityManager.query('worker', 'position', 'pathfinding');
    const factoryEntity = this.entityManager.queryOne('factory');
    if (!factoryEntity) return;

    const factory = getComponent(factoryEntity, 'factory');
    const factoryPos = getComponent(factoryEntity, 'position');

    for (const entity of workers) {
      const worker = getComponent(entity, 'worker');
      const pos = getComponent(entity, 'position');
      const pf = getComponent(entity, 'pathfinding');
      const vel = getComponent(entity, 'velocity');

      this._updateMood(worker);

      switch (worker.state) {
        case WORKER_STATE.IDLE:
          this._handleIdle(entity, worker, pos, pf, vel, factory, factoryPos);
          break;
        case WORKER_STATE.SEEKING_JOB:
          this._handleSeeking(entity, worker, pos, pf, vel, factory, factoryPos);
          break;
        case WORKER_STATE.WALKING_TO_WORK:
          this._handleWalkingToWork(entity, worker, pos, pf, factory, factoryPos);
          break;
        case WORKER_STATE.WORKING:
          this._handleWorking(entity, worker, pos, pf, vel, factory);
          break;
        case WORKER_STATE.WALKING_HOME:
          this._handleWalkingHome(entity, worker, pos, pf);
          break;
        case WORKER_STATE.PROTESTING:
          this._handleProtesting(entity, worker, pos, pf, vel);
          break;
      }
    }
  }

  _handleIdle(entity, worker, pos, pf, vel, factory, factoryPos) {
    worker.idleTimer++;

    // Wander randomly when idle
    if ((!pf.path || pf.pathIndex >= pf.path.length) && worker.idleTimer % 120 === 0) {
      const wanderCol = pos.col + Math.floor(Math.random() * 6) - 3;
      const wanderRow = pos.row + Math.floor(Math.random() * 6) - 3;
      const walkable = this.tileMap.findNearestWalkable(wanderCol, wanderRow);
      const path = this.pathfinder.findPath(pos.col, pos.row, walkable.col, walkable.row);
      if (path) {
        pf.path = path;
        pf.pathIndex = 0;
      }
    }

    // Check if should seek a job
    if (worker.idleTimer > 60) {
      // Check if player's wage is attractive
      const playerWage = this.gameState.wage;
      const competitorBestWage = this._getBestCompetitorWage();

      if (playerWage > competitorBestWage * 0.8 && factory.filledSeats < factory.seats) {
        worker.state = WORKER_STATE.SEEKING_JOB;
        worker.idleTimer = 0;
      } else if (worker.mood < 0.3) {
        worker.state = WORKER_STATE.PROTESTING;
        worker.idleTimer = 0;
      } else {
        // Maybe wander toward competitor
        if (Math.random() < 0.1) {
          this._tryGoToCompetitor(entity, worker, pos, pf);
        }
      }
    }
  }

  _handleSeeking(entity, worker, pos, pf, vel, factory, factoryPos) {
    // Walk toward factory gate
    if (!pf.path || pf.pathIndex >= pf.path.length) {
      const gateCol = factoryPos.col - 1;
      const gateRow = factoryPos.row + 1;
      const walkable = this.tileMap.findNearestWalkable(gateCol, gateRow);
      const path = this.pathfinder.findPath(pos.col, pos.row, walkable.col, walkable.row);
      if (path && path.length > 0) {
        pf.path = path;
        pf.pathIndex = 0;
      } else {
        worker.state = WORKER_STATE.IDLE;
        return;
      }
    }

    // Check if arrived at factory
    const gateCol = factoryPos.col - 1;
    const gateRow = factoryPos.row + 1;
    if (distance(pos.x, pos.y, gateCol + 0.5, gateRow + 0.5) < 2) {
      if (factory.filledSeats < factory.seats) {
        worker.state = WORKER_STATE.WALKING_TO_WORK;
        worker.employed = true;
        factory.filledSeats++;
        worker.wage = this.gameState.wage;
        this.eventBus.emit('worker:hired', { entityId: entity.id });
      } else {
        worker.state = WORKER_STATE.IDLE;
        worker.idleTimer = 0;
      }
    }
  }

  _handleWalkingToWork(entity, worker, pos, pf, factory, factoryPos) {
    // Move inside factory (visually disappear from streets)
    const targetCol = factoryPos.col + 1 + Math.floor(Math.random() * 4);
    const targetRow = factoryPos.row + 1;

    if (!pf.path || pf.pathIndex >= pf.path.length) {
      // Just snap into factory
      pos.x = targetCol + 0.5;
      pos.y = targetRow + 0.5;
      pos.col = targetCol;
      pos.row = targetRow;
      worker.state = WORKER_STATE.WORKING;
      worker.workTimer = 0;
    }
  }

  _handleWorking(entity, worker, pos, pf, vel, factory) {
    worker.workTimer++;
    vel.dx = 0;
    vel.dy = 0;

    // Work for a shift (about 600 ticks = 10 seconds at 60fps)
    if (worker.workTimer > 600) {
      worker.state = WORKER_STATE.WALKING_HOME;
      worker.workTimer = 0;
      factory.filledSeats = Math.max(0, factory.filledSeats - 1);
      worker.employed = false;

      // Path to home
      const walkable = this.tileMap.findNearestWalkable(worker.homeCol, worker.homeRow);
      const gateWalkable = this.tileMap.findNearestWalkable(
        getComponent(this.entityManager.queryOne('factory'), 'position').col - 1,
        getComponent(this.entityManager.queryOne('factory'), 'position').row + 1,
      );
      // First go to gate
      pos.x = gateWalkable.col + 0.5;
      pos.y = gateWalkable.row + 0.5;
      pos.col = gateWalkable.col;
      pos.row = gateWalkable.row;

      const path = this.pathfinder.findPath(pos.col, pos.row, walkable.col, walkable.row);
      if (path) {
        pf.path = path;
        pf.pathIndex = 0;
      }
    }
  }

  _handleWalkingHome(entity, worker, pos, pf) {
    if (!pf.path || pf.pathIndex >= pf.path.length) {
      // Arrived home
      worker.state = WORKER_STATE.IDLE;
      worker.idleTimer = 0;
    }
  }

  _handleProtesting(entity, worker, pos, pf, vel) {
    worker.idleTimer++;

    // Cluster near factory gate and mill around
    if ((!pf.path || pf.pathIndex >= pf.path.length) && worker.idleTimer % 80 === 0) {
      const factoryEntity = this.entityManager.queryOne('factory');
      if (factoryEntity) {
        const fp = getComponent(factoryEntity, 'position');
        const wanderCol = fp.col - 1 + Math.floor(Math.random() * 4) - 2;
        const wanderRow = fp.row - 2 + Math.floor(Math.random() * 3) - 1;
        const walkable = this.tileMap.findNearestWalkable(wanderCol, wanderRow);
        const path = this.pathfinder.findPath(pos.col, pos.row, walkable.col, walkable.row);
        if (path) {
          pf.path = path;
          pf.pathIndex = 0;
        }
      }
    }

    // Recover from protest if conditions improve
    if (worker.mood > 0.4) {
      worker.state = WORKER_STATE.IDLE;
      worker.idleTimer = 0;
    }
  }

  _updateMood(worker) {
    const targetMood = this._calculateTargetMood(worker);
    // Smooth transition
    worker.mood += (targetMood - worker.mood) * 0.01;
  }

  _calculateTargetMood(worker) {
    let mood = 0.5;

    // Wage effect
    const wage = this.gameState.wage;
    mood += (wage - 5) * 0.05; // Base wage of 5 is neutral

    // Employment effect
    if (worker.employed) mood += 0.15;

    // Pollution effect
    const avgPollution = 1 - this.tileMap.getRiverHealth();
    mood -= avgPollution * 0.3;

    // Unrest effect
    mood -= this.gameState.unrest * 0.2;

    return Math.max(0, Math.min(1, mood));
  }

  _getBestCompetitorWage() {
    const competitors = this.entityManager.query('competitor');
    let best = 0;
    for (const c of competitors) {
      const comp = getComponent(c, 'competitor');
      best = Math.max(best, comp.wage);
    }
    return best;
  }

  _tryGoToCompetitor(entity, worker, pos, pf) {
    const competitors = this.entityManager.query('competitor');
    if (competitors.length === 0) return;

    const comp = competitors[Math.floor(Math.random() * competitors.length)];
    const compPos = getComponent(comp, 'position');
    const compData = getComponent(comp, 'competitor');

    if (compData.wage > this.gameState.wage) {
      const walkable = this.tileMap.findNearestWalkable(compPos.col, compPos.row);
      const path = this.pathfinder.findPath(pos.col, pos.row, walkable.col, walkable.row);
      if (path) {
        pf.path = path;
        pf.pathIndex = 0;
        // Worker gets "absorbed" when they arrive
        compData.workersAbsorbed++;
      }
    }
  }
}

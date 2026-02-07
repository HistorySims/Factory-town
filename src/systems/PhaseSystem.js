import { PHASE, MID_PHASE_PRODUCTION, LATE_PHASE_PRODUCTION,
         MID_PHASE_POPULATION, LATE_PHASE_POPULATION } from '../core/Constants.js';

export class PhaseSystem {
  constructor(gameState, eventBus) {
    this.gameState = gameState;
    this.eventBus = eventBus;
  }

  update() {
    const gs = this.gameState;
    const prevPhase = gs.phase;

    if (gs.phase === PHASE.EARLY) {
      if (gs.totalProduced >= MID_PHASE_PRODUCTION && gs.population >= MID_PHASE_POPULATION) {
        gs.phase = PHASE.MID;
      }
    } else if (gs.phase === PHASE.MID) {
      if (gs.totalProduced >= LATE_PHASE_PRODUCTION && gs.population >= LATE_PHASE_POPULATION) {
        gs.phase = PHASE.LATE;
      }
    }

    if (gs.phase !== prevPhase) {
      this.eventBus.emit('phase:changed', { from: prevPhase, to: gs.phase });
    }
  }
}

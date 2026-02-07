import { getComponent } from '../ecs/Entity.js';
import { clamp } from '../utils/MathUtils.js';

export class CompetitorSystem {
  constructor(entityManager, gameState) {
    this.entityManager = entityManager;
    this.gameState = gameState;
    this.tickCounter = 0;
  }

  update() {
    this.tickCounter++;

    const competitors = this.entityManager.query('competitor');
    for (const entity of competitors) {
      const comp = getComponent(entity, 'competitor');

      // Competitors adjust wages to compete with player
      if (this.tickCounter % 300 === 0) {
        // Slowly react to player's wage
        if (this.gameState.wage > comp.wage + 1) {
          comp.wage = Math.min(comp.wage + 0.5, this.gameState.wage - 1);
        } else if (this.gameState.wage < comp.wage - 2) {
          comp.wage = Math.max(comp.wage - 0.5, 2);
        }

        // Adjust price too
        if (this.gameState.price < comp.price - 2) {
          comp.price = Math.max(comp.price - 0.5, 3);
        }
      }

      // Update pulse animation
      comp.pulsePhase += 0.02;

      // Strength based on workers absorbed
      comp.strength = clamp(0.3 + comp.workersAbsorbed * 0.05, 0.3, 1.0);
    }
  }
}

import { PHASE } from '../core/Constants.js';

const PHASE_MESSAGES = {
  [PHASE.MID]: 'The railway arrives. Transport reshapes everything.',
  [PHASE.LATE]: 'Tensions rise in the tenements. The city strains under its own weight.',
};

export class PhaseBanner {
  constructor(eventBus) {
    this.banner = document.getElementById('phase-banner');
    this.eventBus = eventBus;

    this.eventBus.on('phase:changed', (data) => {
      this.show(data.to);
    });
  }

  show(phase) {
    const message = PHASE_MESSAGES[phase];
    if (!message) return;

    this.banner.textContent = message;
    this.banner.classList.remove('hidden', 'fade-out');

    // Auto-hide after 4 seconds
    setTimeout(() => {
      this.banner.classList.add('fade-out');
      setTimeout(() => {
        this.banner.classList.add('hidden');
        this.banner.classList.remove('fade-out');
      }, 1500);
    }, 4000);
  }
}

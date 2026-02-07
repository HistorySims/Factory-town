import { PHASE } from '../core/Constants.js';

const MEETINGS = {
  unrest_early: {
    title: 'Town Council Meeting',
    description: 'The local alderman has called a meeting. Workers are grumbling about conditions. What do you request?',
    choices: [
      {
        text: 'Request housing subsidies — the council funds new worker housing',
        effect: (gs) => { gs.policies.housingSubsidy = true; gs.money += 30; },
        label: 'Housing Subsidies',
      },
      {
        text: 'Propose a voluntary wage agreement — you pledge to pay fairly',
        effect: (gs) => { gs.policies.wageFloor = true; gs.policies.wageFloorAmount = 4; },
        label: 'Wage Agreement',
      },
      {
        text: 'Ask for nothing — maintain your independence',
        effect: () => {},
        label: 'Decline',
      },
    ],
  },
  unrest_mid: {
    title: 'Parliamentary Committee',
    description: 'A committee of Parliament has convened to address growing tensions in factory towns. You have been invited to testify.',
    choices: [
      {
        text: 'Request rail expansion — faster transport will grow the economy for everyone',
        effect: (gs) => { gs.policies.railExpansion = true; },
        label: 'Rail Expansion',
      },
      {
        text: 'Propose sewers and sanitation — clean up the river, improve health',
        effect: (gs) => { gs.policies.sewers = true; gs.unrest *= 0.7; },
        label: 'Sewers & Sanitation',
      },
      {
        text: 'Request policing — restore order and discipline in the streets',
        effect: (gs) => { gs.policies.policing = true; },
        label: 'Policing',
      },
    ],
  },
  unrest_late: {
    title: 'Emergency Session',
    description: 'The situation is critical. Crowds gather outside Parliament. The Home Secretary demands answers from factory owners.',
    choices: [
      {
        text: 'Accept a minimum wage law — workers must be paid at least 6 per period',
        effect: (gs) => { gs.policies.wageFloor = true; gs.policies.wageFloorAmount = 6; gs.unrest *= 0.5; },
        label: 'Minimum Wage',
      },
      {
        text: 'Propose a pollution tax — factories pay for waste, river cleanup begins',
        effect: (gs) => { gs.policies.pollutionTax = true; gs.unrest *= 0.6; },
        label: 'Pollution Tax',
      },
      {
        text: 'Demand military intervention — suppress the unrest by force',
        effect: (gs) => { gs.policies.policing = true; gs.unrest *= 0.3; },
        label: 'Military Force',
      },
      {
        text: 'Propose factory inspections — limit working hours, improve safety',
        effect: (gs) => { gs.policies.factoryInspections = true; gs.unrest *= 0.4; },
        label: 'Factory Inspections',
      },
    ],
  },
};

export class MeetingDialog {
  constructor(gameState, eventBus) {
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.overlay = document.getElementById('meeting-overlay');
    this.title = document.getElementById('meeting-title');
    this.description = document.getElementById('meeting-description');
    this.choices = document.getElementById('meeting-choices');
    this.active = false;

    this.eventBus.on('meeting:called', (data) => {
      this.show(data.reason);
    });
  }

  show(reason) {
    if (this.active) return;
    this.active = true;

    // Pick meeting based on phase
    let meetingKey;
    if (this.gameState.phase === PHASE.LATE) {
      meetingKey = 'unrest_late';
    } else if (this.gameState.phase === PHASE.MID) {
      meetingKey = 'unrest_mid';
    } else {
      meetingKey = 'unrest_early';
    }

    const meeting = MEETINGS[meetingKey];
    this.title.textContent = meeting.title;
    this.description.textContent = meeting.description;

    this.choices.innerHTML = '';
    for (const choice of meeting.choices) {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.addEventListener('click', () => {
        choice.effect(this.gameState);
        this.hide();
        this.eventBus.emit('meeting:resolved', { choice: choice.label });
      });
      this.choices.appendChild(btn);
    }

    this.overlay.classList.remove('hidden');
    this.eventBus.emit('game:pause', {});
  }

  hide() {
    this.active = false;
    this.overlay.classList.add('hidden');
    this.eventBus.emit('game:resume', {});
  }
}

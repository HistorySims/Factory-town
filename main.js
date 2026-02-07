import { Game } from './src/core/Game.js';

const canvas = document.getElementById('gameCanvas');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('btn-start');

let game = null;

function init() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  game = new Game(canvas);

  startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    game.start();
  });

  // Also start on Enter key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !startScreen.classList.contains('hidden')) {
      startScreen.classList.add('hidden');
      game.start();
    }
  });
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

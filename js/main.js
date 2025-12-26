import Game from './game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    // Maintain aspect ratio logic could go here if needed, 
    // but CSS max-height handles most of it.

    const game = new Game(canvas);
    game.start();
});

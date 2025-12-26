import Game from './game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const container = document.getElementById('game-area');

    // Initial sizing with fallback
    let w = container.clientWidth;
    let h = container.clientHeight;

    // Fallback if layout not ready
    if (!w || !h) {
        w = window.innerWidth;
        h = window.innerHeight * 0.7; // Top 70%
    }

    canvas.width = w;
    canvas.height = h;

    const game = new Game(canvas, w, h);
    game.start();

    // Responsive resize
    window.addEventListener('resize', () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        game.resize(canvas.width, canvas.height);
    });
});

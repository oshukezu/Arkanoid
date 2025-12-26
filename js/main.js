import Game from './game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const container = document.getElementById('game-area');

    // Initial sizing
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const game = new Game(canvas, canvas.width, canvas.height);
    game.start();

    // Responsive resize
    window.addEventListener('resize', () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        game.resize(canvas.width, canvas.height);
    });
});

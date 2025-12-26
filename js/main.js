import Game from './game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('arkanoidCanvas');
    const container = document.getElementById('game-container');

    // Canvas Sizing
    const resize = () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (window.gameInstance) {
            window.gameInstance.resize(canvas.width, canvas.height);
        }
    };

    // Initial Size
    canvas.width = container.clientWidth || window.innerWidth;
    canvas.height = container.clientHeight || (window.innerHeight * 0.7);

    // Init Game
    const game = new Game(canvas, canvas.width, canvas.height);
    window.gameInstance = game; // Exposed for resize access
    game.start();

    // Resize Listener
    window.addEventListener('resize', resize);

    // Bind Controls
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnA = document.getElementById('btn-a');

    const handleInput = (key, state) => {
        if (game.input) {
            game.input.setKey(key, state);
        }
    };

    const bindBtn = (btn, key) => {
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(key, true); });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); handleInput(key, false); });
        btn.addEventListener('mousedown', (e) => { e.preventDefault(); handleInput(key, true); });
        btn.addEventListener('mouseup', (e) => { e.preventDefault(); handleInput(key, false); });
        btn.addEventListener('mouseleave', (e) => { e.preventDefault(); handleInput(key, false); });
    };

    bindBtn(btnLeft, 'left');
    bindBtn(btnRight, 'right');
    bindBtn(btnA, 'action');
});

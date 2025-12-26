export default class InputHandler {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            action: false
        };

        this.setupKeyboardListeners();
        this.setupTouchListeners();
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'Space':
                case 'KeyA':
                    this.keys.action = true;
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'Space':
                case 'KeyA':
                    this.keys.action = false;
                    break;
            }
        });
    }

    setupTouchListeners() {
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnA = document.getElementById('btn-a');

        // Helper for touch events
        const addTouch = (elem, key) => {
            if (!elem) return;
            elem.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
            elem.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
            // Mouse events for testing on desktop
            elem.addEventListener('mousedown', (e) => { e.preventDefault(); this.keys[key] = true; });
            elem.addEventListener('mouseup', (e) => { e.preventDefault(); this.keys[key] = false; });
            elem.addEventListener('mouseleave', (e) => { e.preventDefault(); this.keys[key] = false; });
        };

        addTouch(btnLeft, 'left');
        addTouch(btnRight, 'right');
        addTouch(btnA, 'action');
    }
}

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
        // Zone based touch:
        // Left < 40% width
        // Right > 60% width
        // Center (40-60%) = Action

        const handleTouch = (e) => {
            e.preventDefault();
            // Reset keys first to handle multi-touch accurately or simple single touch logic
            // For simplicity in this game, we might prioritize one. 
            // But let's support multi-touch for holding move + tapping action?
            // Actually, usually users use two thumbs.

            this.keys.left = false;
            this.keys.right = false;
            this.keys.action = false;

            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                const width = window.innerWidth;
                const x = touch.clientX;
                const pct = x / width;

                if (pct < 0.4) {
                    this.keys.left = true;
                } else if (pct > 0.6) {
                    this.keys.right = true;
                } else {
                    this.keys.action = true;
                }
            }
        };

        const resetKeys = (e) => {
            e.preventDefault();
            // If all fingers lifted, reset. 
            // If some lifted, re-evaluate remaining touches?
            if (e.touches.length === 0) {
                this.keys.left = false;
                this.keys.right = false;
                this.keys.action = false;
            } else {
                handleTouch(e);
            }
        };

        document.addEventListener('touchstart', handleTouch, { passive: false });
        document.addEventListener('touchmove', handleTouch, { passive: false });
        document.addEventListener('touchend', resetKeys, { passive: false });
    }
}

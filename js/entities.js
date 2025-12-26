export class Paddle {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.width = 80;
        this.height = 12;

        this.x = gameWidth / 2 - this.width / 2;
        this.y = gameHeight - 30;

        this.speed = 0;
        this.maxSpeed = 8;
    }

    update(input) {
        this.speed = 0;
        if (input.keys.left) {
            this.speed = -this.maxSpeed;
        }
        if (input.keys.right) {
            this.speed = this.maxSpeed;
        }

        this.x += this.speed;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.gameWidth) {
            this.x = this.gameWidth - this.width;
        }
    }

    draw(ctx) {
        // SNES style gradient/look
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        // Bright metallic blue/cyan look
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#0088aa');
        gradient.addColorStop(1, '#004466');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

export class Ball {
    constructor(gameWidth, gameHeight, paddle) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.paddle = paddle;

        this.size = 8; // Size of the ball (diameter or box size)

        this.reset();
    }

    reset() {
        this.speed = { x: 0, y: 0 };
        this.position = { x: 0, y: 0 };
        this.sticky = true;
        this.initialSpeed = 6; // Base speed
        this.speedMultiplier = 1.0;

        // Initial position relative to paddle
        this.updateStickyPosition();
    }

    updateStickyPosition() {
        this.position.x = this.paddle.x + this.paddle.width / 2 - this.size / 2;
        this.position.y = this.paddle.y - this.size;
    }

    update(input) {
        if (this.sticky) {
            this.updateStickyPosition();

            if (input.keys.action) {
                this.sticky = false;
                // Launch ball!
                // Randomize slightly between -1 and 1 for X to make it interesting
                // Or standard -speed, -speed? stick to classic:
                // usually shoots up-right or up-left depending on input, or just straight up-ish.
                // Let's go with a fixed upward angle but allow paddle momentum to influence? 
                // For SNES Arkanoid, it usually launches at a fixed angle.

                this.speed.y = -this.initialSpeed;
                this.speed.x = this.initialSpeed * (Math.random() > 0.5 ? 1 : -1);
            }
        } else {
            this.position.x += this.speed.x;
            this.position.y += this.speed.y;

            // Wall collisions
            if (this.position.x < 0) {
                this.speed.x = -this.speed.x;
                this.position.x = 0;
            }

            if (this.position.x + this.size > this.gameWidth) {
                this.speed.x = -this.speed.x;
                this.position.x = this.gameWidth - this.size;
            }

            if (this.position.y < 0) {
                this.speed.y = -this.speed.y;
                this.position.y = 0;
            }

            // Floor collision (death) handled by Game class usually, 
            // but for now let's bounce to test
            if (this.position.y + this.size > this.gameHeight) {
                // Game over logic will go here
                // For now, reset to sticky
                this.reset();
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#fff'; // White ball or SNES silver
        ctx.beginPath();
        // Drawing a square/pixel look might be better for SNES
        ctx.fillRect(this.position.x, this.position.y, this.size, this.size);
        ctx.closePath();
    }
}

export class Brick {
    constructor(x, y, width, height, colorCode) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.status = 1; // 1 = active, 0 = broken

        // Map colorCode or just randomize/fixed based on row in Game class? 
        // For simplicity let's handle color in draw or pass it in.
        this.color = this.getColor(colorCode);
    }

    getColor(code) {
        // SNES palette
        const colors = [
            '#c0c0c0', // 0 (actually empty usually, but if code passed... )
            '#d32f2f', // Red
            '#f57c00', // Orange
            '#fbc02d', // Yellow
            '#388e3c', // Green
            '#1976d2', // Blue
            '#7b1fa2'  // Purple
        ];
        // Reuse colors if code > length
        return colors[code % colors.length] || '#fff';
    }

    draw(ctx) {
        if (this.status === 1) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Bevel effect / shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(this.x, this.y + this.height - 2, this.width, 2);
            ctx.fillRect(this.x + this.width - 2, this.y, 2, this.height);

            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(this.x, this.y, this.width, 2);
            ctx.fillRect(this.x, this.y, 2, this.height);
        }
    }
}

export class Paddle {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.width = 100; // Wider relative to 540 (approx 1/5th screen)
        this.height = 16;

        this.x = gameWidth / 2 - this.width / 2;
        this.y = gameHeight - 100; // Higher up for thumb space

        this.speed = 0;
        this.maxSpeed = 10;
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

        this.size = 12; // Larger ball for mobile
        this.initialSpeed = 8; // Faster base speed for vertical gameplay
        this.maxBallSpeed = this.initialSpeed * 2.5;

        this.reset();
    }

    reset() {
        this.position = { x: this.gameWidth / 2, y: this.gameHeight / 2 };
        this.speed = { x: 0, y: 0 }; // Start stuck
        this.stuck = true;
        this.stuckOffset = 0; // Relative to paddle center
        // Initial position relative to paddle
        this.updateStickyPosition();
    }

    split() {
        // Return a new ball instance with slightly different angle
        const newBall = new Ball(this.gameWidth, this.gameHeight, this.paddle);
        newBall.position = { ...this.position };
        newBall.stuck = false;

        // Diverge speed
        const speedMag = Math.sqrt(this.speed.x ** 2 + this.speed.y ** 2);
        // Perturb angle
        const angle = Math.atan2(this.speed.y, this.speed.x) + (Math.random() * 0.5 - 0.25);

        newBall.speed = {
            x: Math.cos(angle) * speedMag,
            y: Math.sin(angle) * speedMag
        };
        return newBall;
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
                this.speed.y = -this.initialSpeed;
                this.speed.x = this.initialSpeed * (Math.random() > 0.5 ? 0.5 : -0.5); // Less horizontal angle initially
            }
        } else {
            // Cap speed
            let currentSpeed = Math.sqrt(this.speed.x ** 2 + this.speed.y ** 2);
            if (currentSpeed > this.maxBallSpeed) {
                let ratio = this.maxBallSpeed / currentSpeed;
                this.speed.x *= ratio;
                this.speed.y *= ratio;
            }

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
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 1=Normal, 2=Hard, 3=Item
        this.status = 1; // 1 = active, 0 = broken

        if (this.type === 2) {
            this.hp = 2;
            this.color = '#777'; // Silver for hard
        } else if (this.type === 3) {
            this.hp = 1;
            this.color = '#ffd700'; // Gold for item
        } else {
            this.hp = 1;
            this.color = this.getRandomColor();
        }
    }

    getRandomColor() {
        const colors = ['#d32f2f', '#f57c00', '#fbc02d', '#388e3c', '#1976d2', '#7b1fa2'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    hit() {
        if (this.type === 2) {
            this.hp--;
            if (this.hp <= 0) {
                this.status = 0;
                return true; // Destroyed
            } else {
                // Blink or change color logic?
                this.color = '#aaa'; // Damaged silver
                return false; // Not destroyed
            }
        } else {
            this.status = 0;
            return true;
        }
    }

    draw(ctx) {
        if (this.status === 1) {
            let color;
            switch (this.type) {
                case 1: color = '#e91e63'; break; // Pink for normal
                case 2: color = '#bdbdbd'; break; // Silver for Hard
                case 3: color = '#ffd700'; break; // Gold for Item
                case 4: color = '#f44336'; break; // Red (Slow)
                case 5: color = '#ffeb3b'; break; // Yellow (Fast) - Brighter than gold
                case 6: color = '#2196f3'; break; // Blue (Split)
                default: color = '#fff';
            }

            // If random normal color needed, we can stick to one or hash position
            if (this.type === 1) {
                // Simple rainbow rows effect based on Y position?
                const hue = (this.y / 5) % 360;
                color = `hsl(${hue}, 70%, 50%)`;
            }

            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Bevel effect
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(this.x, this.y, this.width, 2);
            ctx.fillRect(this.x, this.y, 2, this.height);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(this.x + this.width - 2, this.y, 2, this.height);
            ctx.fillRect(this.x, this.y + this.height - 2, this.width, 2);
        }
    }
}

export class Paddle {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.baseWidth = gameWidth * 0.2; // 20% of screen width
        this.width = this.baseWidth;
        this.height = 16;
        this.x = (gameWidth - this.width) / 2;
        this.y = gameHeight * 0.9; // 90% down
        this.speed = 0;
        this.maxSpeed = gameWidth * 0.02; // Dynamic speed based on width
    }

    resize(w, h) {
        this.gameWidth = w;
        this.gameHeight = h;
        // Keep ratio? Or fixed pixel? User said "L: Long, S: Short". 
        // Let's recalibrate base width.
        const ratio = this.width / this.baseWidth;
        this.baseWidth = w * 0.2;
        this.width = this.baseWidth * ratio;
        this.y = h * 0.9;
        this.maxSpeed = w * 0.02;
    }

    update(input) {
        if (input.keys.left) this.x -= this.maxSpeed;
        if (input.keys.right) this.x += this.maxSpeed;

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.gameWidth) this.x = this.gameWidth - this.width;
    }

    setWidthType(type) {
        if (type === 'L') this.width = this.baseWidth * 1.5;
        else if (type === 'S') this.width = this.baseWidth * 0.75;
        else this.width = this.baseWidth;
    }

    draw(ctx) {
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

export class Ball {
    constructor(gameWidth, gameHeight, paddle) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.paddle = paddle;
        this.size = 10;
        this.reset();
    }

    reset() {
        this.stuck = true;
        this.speed = { x: 0, y: 0 };
        this.baseSpeed = this.gameHeight * 0.008; // Proportional speed
        this.updateStuck();
    }

    updateStuck() {
        this.x = this.paddle.x + this.paddle.width / 2 - this.size / 2;
        this.y = this.paddle.y - this.size - 2;
    }

    launch() {
        this.stuck = false;
        // Random angle between -45 and 45 from vertical
        const angle = (Math.random() * 90 - 45) * (Math.PI / 180);
        this.speed.x = this.baseSpeed * Math.sin(angle);
        this.speed.y = -this.baseSpeed * Math.cos(angle);
    }

    update() {
        if (this.stuck) {
            this.updateStuck();
            return;
        }

        this.x += this.speed.x;
        this.y += this.speed.y;

        // Walls
        if (this.x <= 0) {
            this.x = 0;
            this.speed.x *= -1;
        }
        if (this.x + this.size >= this.gameWidth) {
            this.x = this.gameWidth - this.size;
            this.speed.x *= -1;
        }
        if (this.y <= 0) {
            this.y = 0;
            this.speed.y *= -1;
        }
        // Bottom is handled by Game class death check
    }

    draw(ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

export class Brick {
    constructor(x, y, w, h, type) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // 1=Normal, 2=Hard, 4=Red, 5=Yellow, 6=Blue
        this.active = true;
        this.hp = (type === 2) ? 2 : 1;
    }

    draw(ctx) {
        if (!this.active) return;

        let color = '#fff';
        switch (this.type) {
            case 2: color = '#aaa'; break; // Silver (Hard)
            case 4: color = '#f00'; break; // Red (Slow)
            case 5: color = '#ff0'; break; // Yellow (Fast)
            case 6: color = '#00f'; break; // Blue (Split)
            default: color = `hsl(${(this.y * 0.5) % 360}, 70%, 50%)`; // Rainbow Normal
        }

        // Indicate damage on hard brick
        if (this.type === 2 && this.hp === 1) color = '#666';

        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Simple Bevel
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

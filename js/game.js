import InputHandler from './input.js';
import { Paddle, Ball, Brick } from './entities.js';
import { levels } from './levels.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameWidth = canvas.width;
        this.gameHeight = canvas.height;

        this.gameState = 'MENU'; // MENU, PLAYING, GAMEOVER, LEVEL_TRANSITION
        this.paddle = new Paddle(this.gameWidth, this.gameHeight);
        this.ball = new Ball(this.gameWidth, this.gameHeight, this.paddle);
        this.input = new InputHandler();

        this.bricks = [];
        this.currentLevel = 0;
        this.lives = 5;
        this.score = 0;

        this.updateUI();
    }

    start() {
        // Initialize game resources but wait in MENU
        this.currentLevel = 0;
        this.score = 0;
        this.lives = 5;
        this.loadLevel(this.currentLevel);

        this.gameState = 'MENU';
        this.updateUI();
        this.loop();
    }

    restartGame() {
        this.currentLevel = 0;
        this.score = 0;
        this.lives = 5;
        this.loadLevel(0);
        this.gameState = 'PLAYING';
        this.updateUI();
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        this.update();
        this.draw();
    }

    update() {
        if (this.gameState === 'MENU') {
            if (this.input.keys.action) {
                this.gameState = 'PLAYING';
            }
        } else if (this.gameState === 'PLAYING') {
            this.paddle.update(this.input);
            this.ball.update(this.input);
            this.checkCollisions();
            this.checkGameOver();
            this.checkLevelComplete();
        } else if (this.gameState === 'GAMEOVER') {
            if (this.input.keys.action) {
                this.restartGame();
            }
        }
    }

    loadLevel(levelIndex) {
        if (levelIndex >= levels.length) {
            // Victory or Loop?
            alert("YOU WIN! Restarting...");
            this.currentLevel = 0;
        }

        const levelData = levels[levelIndex];
        this.bricks = [];

        // Calculate brick dimensions
        // Grid is usually 10-13 columns.
        const rows = levelData.length;
        const cols = levelData[0].length;
        const padding = 2;
        const offsetTop = 40;
        const offsetLeft = 11; // Center it a bit better? 512 width
        // 512 / 10 = 51.2
        const brickWidth = 48;
        const brickHeight = 16;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (levelData[r][c] === 1) {
                    // We can map numbers to colors if we want: levelData[r][c]
                    let x = c * (brickWidth + padding) + offsetLeft;
                    let y = r * (brickHeight + padding) + offsetTop;
                    // Color based on row or simply red/blue alternating
                    // Let's pass (r+1) as colorCode to get varied colors
                    this.bricks.push(new Brick(x, y, brickWidth, brickHeight, r + 1));
                }
            }
        }

        this.ball.reset();
        this.updateUI();
    }

    checkCollisions() {
        // Ball with Paddle
        if (this.detectCollision(this.ball, this.paddle)) {
            let collidePoint = this.ball.position.x - (this.paddle.x + this.paddle.width / 2);
            // Normalize
            collidePoint = collidePoint / (this.paddle.width / 2);

            // Calculate angle: -60deg to 60deg (PI/3)
            let angle = collidePoint * (Math.PI / 3);

            // Determine speed magnitude
            let speed = Math.sqrt(this.ball.speed.x * this.ball.speed.x + this.ball.speed.y * this.ball.speed.y);
            // Increase speed slightly on paddle bounce too? Or just bricks? 
            // User requirement: "球速會依照每次反彈速度逐漸增加1%" - "反彈" usually means any bounce?
            // Let's apply it on paddle bounce to keep it dynamic, AND bricks.
            speed = speed * 1.01;

            this.ball.speed.x = speed * Math.sin(angle);
            this.ball.speed.y = -speed * Math.cos(angle);
        }

        // Ball with Bricks
        for (let i = 0; i < this.bricks.length; i++) {
            let b = this.bricks[i];
            if (b.status === 1) {
                if (this.detectCollision(this.ball, b)) {
                    this.ball.speed.y = -this.ball.speed.y; // Simple bounce
                    b.status = 0;
                    this.score += 10;

                    // Specific requirement: Speed increases by 1% on bounce
                    this.ball.speed.x *= 1.01;
                    this.ball.speed.y *= 1.01;

                    this.updateUI();
                }
            }
        }
    }

    detectCollision(ball, object) {
        // AABB Collision (simplified for ball box)
        let ballLeft = ball.position.x;
        let ballRight = ball.position.x + ball.size;
        let ballTop = ball.position.y;
        let ballBottom = ball.position.y + ball.size;

        let objLeft = object.x;
        let objRight = object.x + object.width;
        let objTop = object.y;
        let objBottom = object.y + object.height;

        return (ballRight > objLeft &&
            ballLeft < objRight &&
            ballBottom > objTop &&
            ballTop < objBottom);
    }

    checkGameOver() {
        if (this.ball.position.y > this.gameHeight) {
            this.lives--;
            this.updateUI();
            if (this.lives > 0) {
                this.ball.reset();
            } else {
                this.gameState = 'GAMEOVER';
            }
        }
    }

    checkLevelComplete() {
        // Check if all bricks are status 0
        const activeBricks = this.bricks.filter(b => b.status === 1);
        if (activeBricks.length === 0) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
        }
    }

    updateUI() {
        document.getElementById('score-val').innerText = this.score;
        document.getElementById('lives-val').innerText = this.lives;
        document.getElementById('level-val').innerText = this.currentLevel + 1;
    }

    draw() {
        // Background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        // Entities
        this.paddle.draw(this.ctx);
        this.ball.draw(this.ctx); // Draw ball even in menu? maybe
        this.bricks.forEach(brick => brick.draw(this.ctx));

        // Overlays
        this.ctx.textAlign = 'center';

        if (this.gameState === 'MENU') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px "Press Start 2P"';
            this.ctx.fillText("ARKANOID", this.gameWidth / 2, this.gameHeight / 2 - 40);
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.fillText("SNES EDITION", this.gameWidth / 2, this.gameHeight / 2);

            this.ctx.font = '14px "Press Start 2P"';
            // Pulsate text effect
            const alpha = Math.abs(Math.sin(Date.now() / 500));
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillText("PRESS A / SPACE TO START", this.gameWidth / 2, this.gameHeight / 2 + 60);
        }
        else if (this.gameState === 'GAMEOVER') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '30px "Press Start 2P"';
            this.ctx.fillText("GAME OVER", this.gameWidth / 2, this.gameHeight / 2);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px "Press Start 2P"';
            this.ctx.fillText("FINAL SCORE: " + this.score, this.gameWidth / 2, this.gameHeight / 2 + 40);

            const alpha = Math.abs(Math.sin(Date.now() / 500));
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillText("PRESS A TO RESTART", this.gameWidth / 2, this.gameHeight / 2 + 80);
        }
    }
}

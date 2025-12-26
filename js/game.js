import InputHandler from './input.js';
import { Paddle, Ball, Brick } from './entities.js';
import { generateLevel } from './levels.js';
import { SoundManager } from './audio.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        // Use internal resolution
        this.gameWidth = 540;
        this.gameHeight = 960;

        // Scale canvas CSS if needed via style (handled by CSS, but internal logic stays 540x960)

        this.gameState = 'MENU';
        this.paddle = new Paddle(this.gameWidth, this.gameHeight);
        this.ball = new Ball(this.gameWidth, this.gameHeight, this.paddle);
        this.input = new InputHandler();
        this.audio = new SoundManager();

        this.bricks = [];
        this.currentLevel = 0;
        this.lives = 5;
        this.score = 0;

        this.updateUI();

        // Resume audio context on first click if needed
        document.addEventListener('click', () => {
            if (this.audio.ctx.state === 'suspended') {
                this.audio.ctx.resume();
            }
        }, { once: true });
    }

    start() {
        // Initialize game resources but wait in MENU
        this.currentLevel = 1; // Start at 1
        this.score = 0;
        this.lives = 5;
        this.loadLevel(this.currentLevel);

        this.gameState = 'MENU';
        this.updateUI();
        this.loop();
    }

    restartGame() {
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 5;
        this.loadLevel(1);
        this.gameState = 'MENU'; // User request: "Game over的時候應該回到初始畫面"
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
                this.audio.play('win'); // Start sound
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
        const levelData = generateLevel(levelIndex);
        this.bricks = [];

        const rows = levelData.length;
        const cols = levelData[0].length; // Should be 8
        const padding = 4;
        const offsetTop = 150;

        // 540 width. 8 cols. 
        // 540 - (padding * 9) / 8? 
        // Let's fix brick width: (540 - 20 padding total) / 8 = 65
        const brickWidth = 64;
        const brickHeight = 24;
        const offsetLeft = (this.gameWidth - (cols * (brickWidth + padding))) / 2 + padding / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const type = levelData[r][c];
                if (type !== 0) {
                    let x = c * (brickWidth + padding) + offsetLeft;
                    let y = r * (brickHeight + padding) + offsetTop;
                    this.bricks.push(new Brick(x, y, brickWidth, brickHeight, type));
                }
            }
        }

        this.ball.reset();
        this.updateUI();
    }

    checkCollisions() {
        // Paddle
        if (this.detectCollision(this.ball, this.paddle)) {
            let collidePoint = this.ball.position.x - (this.paddle.x + this.paddle.width / 2);
            collidePoint = collidePoint / (this.paddle.width / 2);
            let angle = collidePoint * (Math.PI / 3);
            let speed = Math.sqrt(this.ball.speed.x ** 2 + this.ball.speed.y ** 2);
            speed = speed * 1.01;

            this.ball.speed.x = speed * Math.sin(angle);
            this.ball.speed.y = -speed * Math.cos(angle);
            this.audio.play('hit');
        }

        // Floor Check (handled in checkGameOver) but wall bounce should play sound? 
        // Ball class handles bounce. Let's make ball return a status or check here?
        // Basic wall bounce sound manually:
        if (this.ball.position.y <= 0) {
            this.audio.play('wall');
        }

        // Bricks
        for (let i = 0; i < this.bricks.length; i++) {
            let b = this.bricks[i];
            if (b.status === 1) {
                if (this.detectCollision(this.ball, b)) {
                    this.ball.speed.y = -this.ball.speed.y;

                    const destroyed = b.hit();
                    if (destroyed) {
                        this.audio.play('brick');
                        if (b.type === 3) {
                            this.score += 500; // Item bonus
                            this.audio.play('item');
                            // Simple effect: Expand paddle briefly?
                            // Implementing item drop is complex. 
                            // For "random item", maybe instant effect + text?
                        } else {
                            this.score += 100 * b.type;
                            // Hard brick destroy sound
                        }
                    } else {
                        // Hard brick hit but not destroyed
                        this.score += 50;
                        this.audio.play('hit');
                    }

                    // Speed up
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
            this.audio.play('die'); // Sound
            if (this.lives > 0) {
                this.ball.reset();
            } else {
                this.gameState = 'GAMEOVER';
            }
        }
    }

    checkLevelComplete() {
        // Check if all bricks (except unbreakable if any, but we don't have them yet) are gone
        const activeBricks = this.bricks.filter(b => b.status === 1);
        if (activeBricks.length === 0) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
            this.audio.play('win'); // Level up sound
        }
    }

    updateUI() {
        const s = document.getElementById('score-val');
        const l = document.getElementById('lives-val');
        const v = document.getElementById('level-val');
        if (s) s.innerText = this.score;
        if (l) l.innerText = this.lives;
        if (v) v.innerText = this.currentLevel;
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
            this.ctx.fillText("ARKANDOID", this.gameWidth / 2, this.gameHeight / 2 - 40);
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.fillText("OSHUKEZU VIBE CODING", this.gameWidth / 2, this.gameHeight / 2);

            this.ctx.font = '14px "Press Start 2P"';
            // Pulsate text effect
            const alpha = Math.abs(Math.sin(Date.now() / 500));
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillText("TAP 'A' BUTTON TO START", this.gameWidth / 2, this.gameHeight / 2 + 60);
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

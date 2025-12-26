import { Paddle, Ball, Brick } from './entities.js';
import { generateLevel } from './levels.js';
import { SoundManager } from './audio.js';

export default class Game {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;

        this.audio = new SoundManager();
        this.input = {
            keys: { left: false, right: false, action: false },
            setKey(k, v) { this.keys[k] = v; }
        };

        this.lives = 5;
        this.score = 0;
        this.level = 1;
        this.nextLifeScore = 10000;

        this.paddle = new Paddle(width, height);
        this.balls = [new Ball(width, height, this.paddle)];
        this.bricks = [];
        this.items = []; // To implement Item Drops: L, S, B

        this.state = 'PLAYING'; // PLAYING, GAMEOVER

        // Start Level 1
        this.loadLevel(1);

        this.updateUI();
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.paddle.resize(w, h);
        // Balls? Updating position by ratio is complex. 
        // Simplified: Just ensure they are within bounds
        this.balls.forEach(b => {
            b.gameWidth = w;
            b.gameHeight = h;
            if (b.x > w) b.x = w - 10;
            if (b.y > h) b.y = h - 10;
        });
        // Bricks: Need reload to fit width properly
        this.loadLevel(this.level, true); // True = keep progress? No, hard to map.
        // For verify: Just reload level logic.
        this.loadLevel(this.level);
    }

    loadLevel(lvl) {
        const map = generateLevel(lvl);
        this.bricks = [];
        const padding = 2;
        const availableW = this.width - (padding * 9); // 8 cols + padding
        const bW = availableW / 8;
        const bH = this.height * 0.03;

        map.forEach((row, r) => {
            row.forEach((type, c) => {
                if (type !== 0) {
                    this.bricks.push(new Brick(
                        padding + c * (bW + padding),
                        padding * 20 + r * (bH + padding), // Top margin
                        bW, bH, type
                    ));
                }
            });
        });

        // Reset Ball if level change
        if (this.balls.length === 0 || this.state === 'PLAYING') {
            this.resetBall();
        }
    }

    resetBall() {
        this.balls = [new Ball(this.width, this.height, this.paddle)];
    }

    start() {
        this.loop();
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        this.update();
        this.draw();
    }

    update() {
        if (this.state === 'GAMEOVER') return;

        // UI Updates
        this.updateUI();

        // Paddle
        this.paddle.update(this.input);

        // Balls
        // Launch logic
        if (this.input.keys.action) {
            this.balls.forEach(b => {
                if (b.stuck) {
                    b.launch();
                    this.audio.play('shoot');
                }
            });
        }

        // Update physics
        this.balls.forEach(b => {
            b.update();
            this.checkCollisions(b);
        });

        // Check Death (Only if no balls left)
        if (this.balls.length > 0) {
            // Remove balls that fell
            this.balls = this.balls.filter(b => b.y < this.height);
            if (this.balls.length === 0) {
                this.lives--;
                this.audio.play('die');
                if (this.lives > 0) {
                    this.resetBall();
                } else {
                    this.state = 'GAMEOVER';
                    document.getElementById('game-over').style.display = 'flex';
                    document.getElementById('final-score').innerText = this.score;
                }
            }
        }

        // Check Level Clear
        if (this.bricks.every(b => !b.active || b.type === 2)) { // Silver bricks required? Use standard: Active bricks count check. 
            // Usually silver bricks must be cleared too unless invincible. Ours are destructible.
            if (this.bricks.every(b => !b.active)) {
                this.level++;
                this.audio.play('1up'); // Win sound
                this.loadLevel(this.level);
            }
        }
    }

    checkCollisions(ball) {
        // Paddle
        if (this.aabb(ball, this.paddle)) {
            this.audio.play('hit');
            // Reflect Y
            ball.speed.y = -Math.abs(ball.speed.y);
            // Add Speed 1%
            ball.speed.x *= 1.01;
            ball.speed.y *= 1.01;

            // English (Angle control)
            let center = this.paddle.x + this.paddle.width / 2;
            let dis = (ball.x + ball.size / 2) - center;
            ball.speed.x += dis * 0.05;
        }

        // Bricks
        for (let b of this.bricks) {
            if (!b.active) continue;
            if (this.aabb(ball, b)) {
                ball.speed.y *= -1; // Reflect

                if (b.type === 2) { // Hard
                    b.hp--;
                    if (b.hp <= 0) b.active = false;
                    this.audio.play('hit');
                } else {
                    b.active = false;
                    this.processBrickEffect(b, ball);
                    this.audio.play('brick');

                    // Item Drop Chance 15%
                    if (Math.random() < 0.15) {
                        this.spawnItemEffect();
                    }
                }

                this.score += 100;
                this.checkScoreLife();
                break; // One collision per frame per ball
            }
        }
    }

    spawnItemEffect() {
        // Immediate Logic for simplicity as per requirement: L, S, B
        const r = Math.random();
        // Text Feedback?
        if (r < 0.33) {
            // L: Long Paddle
            this.paddle.setWidthType('L');
        } else if (r < 0.66) {
            // S: Short Paddle
            this.paddle.setWidthType('S');
        } else {
            // B: Add Bricks? Or maybe Bonus Points?
            // "B: 隨機加磚 (Brick Add)"
            // Revive 3 random bricks
            let count = 0;
            for (let b of this.bricks) {
                if (!b.active && count < 3) {
                    b.active = true;
                    // Reset type to normal?
                    b.type = 1;
                    count++;
                }
            }
        }
    }

    processBrickEffect(brick, ball) {
        // Red: Slow 15%
        if (brick.type === 4) {
            ball.speed.x *= 0.85;
            ball.speed.y *= 0.85;
            this.audio.play('powerup');
        }
        // Yellow: Fast 15%
        if (brick.type === 5) {
            ball.speed.x *= 1.15;
            ball.speed.y *= 1.15;
            this.audio.play('powerup');
        }
        // Blue: Split
        if (brick.type === 6) {
            // Clone ball
            let newBall = new Ball(this.width, this.height, this.paddle);
            newBall.stuck = false;
            newBall.x = ball.x;
            newBall.y = ball.y;
            newBall.speed.x = -ball.speed.x; // Reverse X
            newBall.speed.y = ball.speed.y;
            this.balls.push(newBall);
            this.audio.play('powerup');
        }
    }

    checkScoreLife() {
        if (this.score >= this.nextLifeScore) {
            this.lives++;
            this.nextLifeScore += 10000;
            this.audio.play('1up');
        }
    }

    aabb(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.size > b.x &&
            a.y < b.y + b.height &&
            a.y + a.size > b.y;
    }

    updateUI() {
        const s = document.getElementById('score');
        const l = document.getElementById('lives');
        const lv = document.getElementById('level');
        if (s) s.innerText = this.score;
        if (l) l.innerText = this.lives;
        if (lv) lv.innerText = this.level;
    }

    draw() {
        // Clear
        this.ctx.clearRect(0, 0, this.width, this.height);
        // Note: BG is handled by CSS on canvas

        this.paddle.draw(this.ctx);
        this.balls.forEach(b => b.draw(this.ctx));
        this.bricks.forEach(b => b.draw(this.ctx));

        if (this.state === 'MENU') {
            // Darken background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowOffsetX = 4;
            this.ctx.shadowOffsetY = 4;

            // Title
            this.ctx.font = '40px "Press Start 2P"';
            this.ctx.fillText("ARKANDOID", this.width / 2, this.height / 2 - 50);

            // Subtitle
            this.ctx.font = '16px "Press Start 2P"';
            this.ctx.fillText("OSHUKEZU VIBE EDITION", this.width / 2, this.height / 2);

            // Prompt
            const alpha = Math.abs(Math.sin(Date.now() / 500));
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillText("PRESS A TO START", this.width / 2, this.height / 2 + 60);

            // Reset shadow
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }
    }
}

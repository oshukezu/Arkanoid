import InputHandler from './input.js';
import { Paddle, Ball, Brick } from './entities.js';
import { generateLevel } from './levels.js';
import { SoundManager } from './audio.js';

export default class Game {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameWidth = width;
        this.gameHeight = height;

        this.gameState = 'MENU';
        this.paddle = new Paddle(this.gameWidth, this.gameHeight);

        // Multiball support
        this.balls = [];
        // Initial ball (will be reset in start)
        this.balls.push(new Ball(this.gameWidth, this.gameHeight, this.paddle));

        this.input = new InputHandler();
        this.audio = new SoundManager();

        this.bricks = [];
        this.currentLevel = 0;
        this.lives = 5;
        this.score = 0;
        this.lastScoreLifeBonus = 0; // Track score for extra life

        this.updateUI();

        document.addEventListener('click', () => {
            if (this.audio.ctx.state === 'suspended') {
                this.audio.ctx.resume();
            }
            // Click to restart on Game Over
            if (this.gameState === 'GAMEOVER') {
                this.restartGame();
            }
        });
    }

    resize(w, h) {
        this.gameWidth = w;
        this.gameHeight = h;
        this.paddle.gameWidth = w;
        this.paddle.gameHeight = h;
        this.paddle.y = h - 30; // Keep paddle at bottom

        // Balls need update if they go out of bounds? 
        // Just let them be, wall collision will catch them next frame.
        this.balls.forEach(b => {
            b.gameWidth = w;
            b.gameHeight = h;
        });

        // Re-layout bricks if necessary? 
        // Ideally we should regenerate level or scale positions. 
        // For simplicity, let's just clear and reload current level if resizing drastically?
        // Or just let them float. "Full width" usually implies responsive layout.
        // Let's reload the level to fit new width properly.
        if (this.gameState === 'PLAYING') {
            this.loadLevel(this.currentLevel);
        }
    }

    start() {
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 5;
        this.lastScoreLifeBonus = 0;
        this.loadLevel(this.currentLevel);

        this.gameState = 'MENU';
        this.updateUI();
        this.loop();
    }

    restartGame() {
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 5;
        this.lastScoreLifeBonus = 0;
        this.loadLevel(1);
        this.gameState = 'MENU';
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
                this.audio.play('win');
            }
        } else if (this.gameState === 'PLAYING') {
            this.paddle.update(this.input);

            // Update all balls
            this.balls.forEach(ball => ball.update(this.input));

            // Remove balls that fell out
            this.balls = this.balls.filter(ball => ball.position.y <= this.gameHeight);

            this.checkCollisions();
            this.checkGameOver();
            this.checkLevelComplete();
            this.checkScoreBonus();
        }
        // Game Over logic moved to click handler and visual draw
    }

    checkScoreBonus() {
        // 10000 points = +1 Life
        if (Math.floor(this.score / 10000) > this.lastScoreLifeBonus) {
            this.lives++;
            this.lastScoreLifeBonus++;
            this.audio.play('win'); // Re-use win sound for 1up
            this.updateUI();
        }
    }

    loadLevel(levelIndex) {
        const levelData = generateLevel(levelIndex);
        this.bricks = [];

        const rows = levelData.length;
        const cols = levelData[0].length;
        const padding = 4;
        const offsetTop = 150;

        // Calculate dynamic brick width based on screen width
        const totalPadding = (cols + 1) * padding;
        const availableWidth = this.gameWidth - totalPadding;
        const brickWidth = Math.floor(availableWidth / cols);
        const brickHeight = 24;
        const offsetLeft = padding;

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

        // Reset balls
        this.balls = [new Ball(this.gameWidth, this.gameHeight, this.paddle)];
        this.balls[0].reset();
        this.updateUI();
    }

    checkCollisions() {
        this.balls.forEach(ball => {
            // Paddle
            if (this.detectCollision(ball, this.paddle)) {
                let collidePoint = ball.position.x - (this.paddle.x + this.paddle.width / 2);
                collidePoint = collidePoint / (this.paddle.width / 2);
                let angle = collidePoint * (Math.PI / 3);
                let speed = Math.sqrt(ball.speed.x ** 2 + ball.speed.y ** 2);
                speed = speed * 1.01;

                ball.speed.x = speed * Math.sin(angle);
                ball.speed.y = -speed * Math.cos(angle);
                this.audio.play('hit');
            }

            // Wall Sound
            if (ball.position.x <= 0 || ball.position.x + ball.size >= this.gameWidth) {
                // Ball handles bounce, we just play sound? 
                // Actually ball update handles position limits. 
                // We can check if it just reversed velocity?
                // Simple check:
                if (ball.position.x <= 1 || ball.position.x + ball.size >= this.gameWidth - 1) {
                    this.audio.play('wall');
                }
            }
            if (ball.position.y <= 0) {
                this.audio.play('wall');
            }

            // Bricks
            for (let i = 0; i < this.bricks.length; i++) {
                let b = this.bricks[i];
                if (b.status === 1) {
                    if (this.detectCollision(ball, b)) {
                        ball.speed.y = -ball.speed.y;

                        const destroyed = b.hit();
                        if (destroyed) {
                            this.audio.play('brick');
                            this.applyBrickEffect(b, ball);
                        } else {
                            this.score += 50;
                            this.audio.play('hit');
                        }

                        // Speed up slightly on every hit
                        ball.speed.x *= 1.01;
                        ball.speed.y *= 1.01;

                        this.updateUI();
                    }
                }
            }
        });
    }

    applyBrickEffect(brick, ball) {
        // Basic Score
        this.score += 100 * brick.type;

        // Special Colors (IDs from generateLevel)
        // Let's assume: 40=Red(Slow), 50=Yellow(Fast), 60=Blue(Split) based on planned logic
        // But generateLevel produces 1,2,3... need to map properly.
        // For now, let's hook into the type directly if we updated generateLevel, 
        // or just use arbitrary types for now.
        // Current types: 1=Color, 2=Hard, 3=Item(Gold)

        if (brick.type === 3) { // Items
            this.score += 500;
            this.audio.play('item');
        }

        // We will define these types in levels.js next step. 
        // 4: Red (Slow)
        // 5: Yellow (Fast)
        // 6: Blue (Split)

        const speedMag = Math.sqrt(ball.speed.x ** 2 + ball.speed.y ** 2);

        if (brick.type === 4) { // RED - Slow
            const factor = 0.7;
            ball.speed.x *= factor;
            ball.speed.y *= factor;
            this.audio.play('item'); // Reuse sound or new one
        }
        else if (brick.type === 5) { // YELLOW - Fast
            const factor = 1.3;
            ball.speed.x *= factor;
            ball.speed.y *= factor;
            this.audio.play('item');
        }
        else if (brick.type === 6) { // BLUE - Split
            this.balls.push(ball.split());
            this.audio.play('item');
        }
    }

    detectCollision(ball, object) {
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
        // Only game over if NO balls left
        if (this.balls.length === 0) {
            this.lives--;
            this.updateUI();
            this.audio.play('die');

            if (this.lives > 0) {
                // Respawn one ball
                this.balls = [new Ball(this.gameWidth, this.gameHeight, this.paddle)];
                this.balls[0].reset();
            } else {
                this.gameState = 'GAMEOVER';
            }
        }
    }

    checkLevelComplete() {
        // Check if all destructible bricks are gone
        const activeBricks = this.bricks.filter(b => b.status === 1 && b.type !== 999); // 999 for unbreakable if added
        if (activeBricks.length === 0) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
            this.audio.play('win');
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
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        this.paddle.draw(this.ctx);
        this.balls.forEach(ball => ball.draw(this.ctx));
        this.bricks.forEach(brick => brick.draw(this.ctx));

        this.ctx.textAlign = 'center';

        if (this.gameState === 'MENU') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px "Press Start 2P", monospace, sans-serif';
            this.ctx.fillText("ARKANDOID", this.gameWidth / 2, this.gameHeight / 2 - 40);
            this.ctx.font = '20px "Press Start 2P", monospace, sans-serif';
            this.ctx.fillText("OSHUKEZU VIBE CODING", this.gameWidth / 2, this.gameHeight / 2);

            this.ctx.font = '14px "Press Start 2P", monospace, sans-serif';
            const alpha = Math.abs(Math.sin(Date.now() / 500));
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillText("TAP 'A' BUTTON TO START", this.gameWidth / 2, this.gameHeight / 2 + 60);
        }
        else if (this.gameState === 'GAMEOVER') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '30px "Press Start 2P", monospace, sans-serif';
            this.ctx.fillText("GAME OVER", this.gameWidth / 2, this.gameHeight / 2);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px "Press Start 2P", monospace, sans-serif';
            this.ctx.fillText("FINAL SCORE: " + this.score, this.gameWidth / 2, this.gameHeight / 2 + 40);

            const alpha = Math.abs(Math.sin(Date.now() / 500));
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillText("TAP SCREEN TO RESTART", this.gameWidth / 2, this.gameHeight / 2 + 80);
        }
    }
}

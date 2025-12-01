// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = {
    'I': '#00f0f0',
    'O': '#f0f000',
    'T': '#a000f0',
    'S': '#00f000',
    'Z': '#f00000',
    'J': '#0000f0',
    'L': '#f0a000',
    'empty': '#000000',
    'grid': '#333333'
};

// Tetromino shapes
const SHAPES = {
    'I': [
        [[0, 0, 0, 0],
         [1, 1, 1, 1],
         [0, 0, 0, 0],
         [0, 0, 0, 0]]
    ],
    'O': [
        [[1, 1],
         [1, 1]]
    ],
    'T': [
        [[0, 1, 0],
         [1, 1, 1],
         [0, 0, 0]]
    ],
    'S': [
        [[0, 1, 1],
         [1, 1, 0],
         [0, 0, 0]]
    ],
    'Z': [
        [[1, 1, 0],
         [0, 1, 1],
         [0, 0, 0]]
    ],
    'J': [
        [[1, 0, 0],
         [1, 1, 1],
         [0, 0, 0]]
    ],
    'L': [
        [[0, 0, 1],
         [1, 1, 1],
         [0, 0, 0]]
    ]
};

// Game state
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.isPlaying = false;

        this.currentPiece = null;
        this.nextPiece = null;

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        this.setupEventListeners();
        this.draw();
    }

    createBoard() {
        return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    }

    setupEventListeners() {
        document.getElementById('start-button').addEventListener('click', () => this.start());
        document.getElementById('pause-button').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-button').addEventListener('click', () => this.restart());

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    start() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.gameOver = false;
        this.isPaused = false;
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 1000;

        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();

        document.getElementById('start-button').disabled = true;
        document.getElementById('pause-button').disabled = false;
        document.getElementById('game-over').classList.add('hidden');

        this.updateDisplay();
        this.drawNext();
        this.lastTime = performance.now();
        this.gameLoop();
    }

    restart() {
        this.isPlaying = false;
        document.getElementById('start-button').disabled = false;
        document.getElementById('pause-button').disabled = true;
        this.start();
    }

    togglePause() {
        if (!this.isPlaying || this.gameOver) return;

        this.isPaused = !this.isPaused;
        document.getElementById('pause-button').textContent = this.isPaused ? 'Resume' : 'Pause';

        if (!this.isPaused) {
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    createPiece() {
        const pieces = Object.keys(SHAPES);
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        return new Piece(type);
    }

    handleKeyPress(e) {
        if (!this.isPlaying || this.gameOver || this.isPaused) {
            if (e.key === 'r' || e.key === 'R') {
                this.restart();
            }
            return;
        }

        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                this.togglePause();
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                this.restart();
                break;
        }
    }

    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;

        if (this.checkCollision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;

            if (dy > 0) {
                this.lockPiece();
            }
            return false;
        }

        this.draw();
        return true;
    }

    rotatePiece() {
        const originalRotation = this.currentPiece.rotation;
        this.currentPiece.rotate();

        // Wall kick system
        const kicks = [0, 1, -1, 2, -2];
        for (let kick of kicks) {
            this.currentPiece.x += kick;
            if (!this.checkCollision()) {
                this.draw();
                return;
            }
            this.currentPiece.x -= kick;
        }

        // Rotation failed, revert
        this.currentPiece.rotation = originalRotation;
    }

    hardDrop() {
        while (this.movePiece(0, 1)) {
            this.score += 2;
        }
        this.updateDisplay();
    }

    checkCollision() {
        const shape = this.currentPiece.getShape();

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;

                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }

                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    lockPiece() {
        const shape = this.currentPiece.getShape();

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newY = this.currentPiece.y + y;
                    const newX = this.currentPiece.x + x;

                    if (newY < 0) {
                        this.endGame();
                        return;
                    }

                    this.board[newY][newX] = this.currentPiece.type;
                }
            }
        }

        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();

        if (this.checkCollision()) {
            this.endGame();
        }

        this.draw();
        this.drawNext();
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;

            // Scoring system
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;

            // Level up every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            }

            this.updateDisplay();
        }
    }

    endGame() {
        this.gameOver = true;
        this.isPlaying = false;
        document.getElementById('start-button').disabled = false;
        document.getElementById('pause-button').disabled = true;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    gameLoop(time = 0) {
        if (!this.isPlaying || this.gameOver || this.isPaused) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropCounter = 0;
        }

        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = COLORS.empty;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = COLORS.grid;
        this.ctx.lineWidth = 0.5;

        for (let x = 0; x <= COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            this.ctx.stroke();
        }

        for (let y = 0; y <= ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            this.ctx.stroke();
        }

        // Draw locked pieces
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, COLORS[this.board[y][x]], this.ctx);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            const shape = this.currentPiece.getShape();
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            COLORS[this.currentPiece.type],
                            this.ctx
                        );
                    }
                }
            }
        }
    }

    drawNext() {
        if (!this.nextPiece) return;

        // Clear the canvas completely
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        // Fill with background color
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        const shape = this.nextPiece.getShape();
        const offsetX = (4 - shape[0].length) / 2;
        const offsetY = (4 - shape.length) / 2;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.drawBlock(
                        offsetX + x,
                        offsetY + y,
                        COLORS[this.nextPiece.type],
                        this.nextCtx
                    );
                }
            }
        }
    }

    drawBlock(x, y, color, ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

        // Add 3D effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            x * BLOCK_SIZE + 1,
            y * BLOCK_SIZE + 1,
            BLOCK_SIZE - 2,
            BLOCK_SIZE - 2
        );
    }
}

// Piece class
class Piece {
    constructor(type) {
        this.type = type;
        this.shapes = SHAPES[type];
        this.rotation = 0;
        this.x = Math.floor((COLS - this.getShape()[0].length) / 2);
        this.y = 0;
    }

    getShape() {
        // O piece doesn't rotate
        if (this.type === 'O') {
            return this.shapes[0];
        }
        return this.getRotatedShape();
    }

    getRotatedShape() {
        const shape = this.shapes[0];
        const size = shape.length;
        const rotated = Array(size).fill(null).map(() => Array(size).fill(0));

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                switch(this.rotation % 4) {
                    case 0:
                        rotated[y][x] = shape[y][x];
                        break;
                    case 1:
                        rotated[y][x] = shape[size - 1 - x][y];
                        break;
                    case 2:
                        rotated[y][x] = shape[size - 1 - y][size - 1 - x];
                        break;
                    case 3:
                        rotated[y][x] = shape[x][size - 1 - y];
                        break;
                }
            }
        }

        return rotated;
    }

    rotate() {
        this.rotation++;
    }
}

// Initialize game when DOM is loaded
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});

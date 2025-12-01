# n8n-automation-scripts
First Github Repository

## Tetris Clone

A fully functional Tetris game built with HTML5, CSS3, and vanilla JavaScript.

### Features

- Classic Tetris gameplay with all 7 tetromino shapes (I, O, T, S, Z, J, L)
- Smooth piece rotation with wall-kick system
- Line clearing and scoring system
- Progressive difficulty (level increases every 10 lines)
- Next piece preview
- Pause and restart functionality
- Responsive design with beautiful gradient UI
- Game over detection

### How to Play

1. Open `index.html` in your web browser
2. Click "Start Game" to begin
3. Use keyboard controls:
   - **Left/Right Arrow**: Move piece horizontally
   - **Down Arrow**: Soft drop (move piece down faster)
   - **Up Arrow**: Rotate piece
   - **Spacebar**: Hard drop (instantly drop piece to bottom)
   - **P**: Pause/Resume game
   - **R**: Restart game

### Scoring

- Clearing 1 line: 100 points × level
- Clearing 2 lines: 300 points × level
- Clearing 3 lines: 500 points × level
- Clearing 4 lines (Tetris): 800 points × level
- Hard drop: 2 points per cell dropped

### Files

- `index.html` - Game structure and UI
- `styles.css` - Styling and animations
- `tetris.js` - Game logic and mechanics

### Browser Compatibility

Works in all modern browsers that support HTML5 Canvas and ES6 JavaScript.

# Mini Games - React Native Expo

A collection of 3 mini-games built with React Native and Expo for MVP testing purposes.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Project Structure](#project-structure)
3. [Game 1: Flappy Bird](#game-1-flappy-bird)
4. [Game 2: Maze Runner](#game-2-maze-runner)
5. [Game 3: Platform Jumper](#game-3-platform-jumper)
6. [Storage & Persistence](#storage--persistence)
7. [Future Backend Integration](#future-backend-integration)

---

## Project Setup

### Prerequisites
- Node.js (v20+)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

### Dependencies
- `expo` - Core Expo framework
- `react-native` - React Native framework
- `@react-native-async-storage/async-storage` - Local data persistence
- `expo-sensors` - Accelerometer for tilt controls (Jumper game)
- `react-native-gesture-handler` - Gesture handling

---

## Project Structure

```
/src
├── /games
│   ├── FlappyGame.tsx          # Flappy Bird game
│   ├── MazeGame.tsx            # Maze Runner game
│   ├── JumperGame.tsx          # Platform Jumper game
│   │
│   ├── /flappy
│   │   └── /utils
│   │       └── Storage.ts      # Flappy high score storage
│   │
│   ├── /maze
│   │   ├── /components
│   │   │   ├── SwipeArea.tsx   # Swipe gesture handler
│   │   │   ├── StarRating.tsx  # Star rating display
│   │   │   └── Timer.tsx       # Timer component
│   │   └── /utils
│   │       ├── Constants.ts    # Maze colors, dimensions
│   │       ├── MazeGenerator.ts # Maze generation algorithm
│   │       └── Storage.ts      # Maze progress storage
│   │
│   └── /jumper
│       └── /utils
│           ├── Constants.ts    # Jumper physics constants
│           ├── PlatformGenerator.ts # Platform generation
│           └── Storage.ts      # Jumper high score storage
│
├── /services
│   └── GameResultService.ts    # Abstracted storage service
│
└── /types
    └── GameResult.ts           # TypeScript interfaces

App.tsx                         # Main app with navigation
```

---

## Game 1: Flappy Bird

### Overview
A classic Flappy Bird clone where the player taps to make a bird fly through gaps in pipes.

### File Location
`src/games/FlappyGame.tsx`

### Game Mechanics
- Tap anywhere to make the bird flap upward
- Bird constantly falls due to gravity
- Navigate through gaps between pipes
- Score increases for each pipe passed
- Game ends when bird hits a pipe or the ground

### Configuration Constants

```typescript
// Location: Inside FlappyGame.tsx

// Difficulty Modes
const GAME_MODES = {
  easy: {
    gravity: 0.4,        // Lower = slower fall
    flapStrength: -7,    // Higher negative = stronger flap
    pipeGap: 200,        // Larger = easier to pass
    pipeSpeed: 2.5,      // Lower = slower pipes
    pipeSpacing: 300,    // Larger = more time between pipes
  },
  medium: {
    gravity: 0.5,
    flapStrength: -8,
    pipeGap: 170,
    pipeSpeed: 3,
    pipeSpacing: 280,
  },
  hard: {
    gravity: 0.6,
    flapStrength: -8.5,
    pipeGap: 140,
    pipeSpeed: 3.5,
    pipeSpacing: 250,
  },
};

// Bird dimensions
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;

// Pipe dimensions
const PIPE_WIDTH = 60;
```

### Adjusting Difficulty

| Parameter | Effect | Easier | Harder |
|-----------|--------|--------|--------|
| `gravity` | How fast bird falls | Lower (0.3) | Higher (0.8) |
| `flapStrength` | How high bird jumps | More negative (-10) | Less negative (-6) |
| `pipeGap` | Space between pipes | Larger (220) | Smaller (120) |
| `pipeSpeed` | How fast pipes move | Lower (2) | Higher (5) |
| `pipeSpacing` | Distance between pipe pairs | Larger (350) | Smaller (200) |

### Game States
- `MENU` - Start screen with difficulty selection
- `PLAYING` - Active gameplay
- `GAME_OVER` - Score display and restart option

---

## Game 2: Maze Runner

### Overview
Navigate a mouse through a randomly generated maze to reach the apple (exit).

### File Locations
- Main: `src/games/MazeGame.tsx`
- Generator: `src/games/maze/utils/MazeGenerator.ts`
- Constants: `src/games/maze/utils/Constants.ts`

### Game Mechanics
- Player (🐭) starts at one position
- Goal is to reach the exit (🍎)
- Walls block movement
- Timer tracks completion time
- Move counter tracks efficiency

### Maze Generation Algorithm

The maze uses **Recursive Backtracking** algorithm:

```typescript
// Location: src/games/maze/utils/MazeGenerator.ts

// 1. Start with a grid of cells, all walls intact
// 2. Pick a starting cell, mark as visited
// 3. Randomly choose an unvisited neighbor
// 4. Remove wall between current and neighbor
// 5. Move to neighbor, repeat from step 3
// 6. If no unvisited neighbors, backtrack
// 7. Continue until all cells visited

// Grid size by difficulty
switch (difficulty) {
  case 'easy':
    cellRows = 8;   // Creates 17x17 grid
    cellCols = 8;
    break;
  case 'medium':
    cellRows = 10;  // Creates 21x21 grid
    cellCols = 10;
    break;
  case 'hard':
    cellRows = 12;  // Creates 25x25 grid
    cellCols = 12;
    break;
}
```

### Configuration Constants

```typescript
// Location: src/games/maze/utils/Constants.ts

export const MAZE_PADDING = 16;

export const CELL_TYPES = {
  PATH: 0,    // Walkable
  WALL: 1,    // Blocked
  START: 2,   // Player start position
  EXIT: 3,    // Goal position
  COIN: 4,    // (Future) Collectible
};

export const COLORS = {
  background: '#1a1a2e',
  mazeBg: '#f5e6c8',      // Cream path color
  wall: '#4a6fa5',        // Blue wall color
  player: '#8B4513',      // Brown player
  // ... other colors
};
```

### Adjusting Difficulty

| Parameter | Location | Effect |
|-----------|----------|--------|
| `cellRows/cellCols` | MazeGenerator.ts | Larger = more complex maze |
| `extraConnections` | MazeGenerator.ts | More = multiple paths (easier) |
| `threeStarTime` | MazeGame.tsx | Time threshold for 3 stars |
| `twoStarTime` | MazeGame.tsx | Time threshold for 2 stars |

```typescript
// Star rating thresholds (seconds)
const DIFFICULTY_CONFIG = {
  easy: { threeStarTime: 30, twoStarTime: 60 },
  medium: { threeStarTime: 45, twoStarTime: 90 },
  hard: { threeStarTime: 60, twoStarTime: 120 },
};
```

### Controls
- **Swipe**: Drag finger in direction to move
- **Buttons**: D-Pad buttons for directional movement

### Maze Solvability
Every generated maze is verified solvable using BFS (Breadth-First Search):

```typescript
function isSolvable(grid: number[][]): boolean {
  // BFS from START to EXIT
  // Returns true only if path exists
}
```

---

## Game 3: Platform Jumper

### Overview
A Doodle Jump-style endless vertical jumper where the player bounces on platforms.

### File Locations
- Main: `src/games/JumperGame.tsx`
- Storage: `src/games/jumper/utils/Storage.ts`

### Game Mechanics
- Player automatically bounces when landing on platforms
- Touch and drag left/right to move horizontally
- Camera follows player upward
- Platforms generate procedurally above
- Game ends when player falls off screen

### Configuration Constants

```typescript
// Location: Inside JumperGame.tsx

// Physics
const GRAVITY = 0.5;           // Fall speed acceleration
const JUMP_VELOCITY = -12;     // Bounce strength (negative = up)

// Dimensions
const PLAYER_SIZE = 35;
const PLATFORM_WIDTH = 70;
const PLATFORM_HEIGHT = 12;

// Platform spacing
const PLATFORM_GAP_MIN = 60;   // Minimum vertical gap
const PLATFORM_GAP_MAX = 100;  // Maximum vertical gap
```

### Adjusting Difficulty

| Parameter | Effect | Easier | Harder |
|-----------|--------|--------|--------|
| `GRAVITY` | Fall speed | Lower (0.3) | Higher (0.8) |
| `JUMP_VELOCITY` | Bounce height | More negative (-15) | Less negative (-10) |
| `PLATFORM_WIDTH` | Platform size | Wider (100) | Narrower (50) |
| `PLATFORM_GAP_MAX` | Max gap between platforms | Smaller (80) | Larger (150) |

### Platform Generation

```typescript
// Platforms generated above screen as player ascends
const createPlatform = (y: number): Platform => {
  return {
    id: platformIdRef.current++,
    x: Math.random() * (SCREEN_WIDTH - PLATFORM_WIDTH),
    y: y,
  };
};

// Gap between platforms
const newY = highestPlatY - 60 - Math.random() * 40;
```

### Adding Platform Types (Future Enhancement)

```typescript
// Platform types for variety
type PlatformType = 'NORMAL' | 'MOVING' | 'BREAKING' | 'SPRING';

interface Platform {
  id: number;
  x: number;
  y: number;
  type: PlatformType;
  broken?: boolean;
  movingDirection?: number;
}

// Different bounce velocities
if (platform.type === 'SPRING') {
  velocityY = SPRING_VELOCITY;  // -18 for higher bounce
} else {
  velocityY = JUMP_VELOCITY;    // -12 normal bounce
}
```

### Controls
- Touch anywhere and drag left/right
- Player smoothly follows finger position
- Release to stop horizontal movement

---

## Storage & Persistence

All games use AsyncStorage for local data persistence.

### Storage Keys

```typescript
// Flappy Game
'@flappy_high_score'           // number

// Maze Game
'@maze_progress'               // { bestTimes: {}, stars: {} }

// Jumper Game
'@jumper_high_score'           // number
```

### Storage Functions

```typescript
// Example: Jumper Storage
// Location: src/games/jumper/utils/Storage.ts

export async function getHighScore(): Promise<number> {
  const score = await AsyncStorage.getItem('@jumper_high_score');
  return score ? parseInt(score, 10) : 0;
}

export async function saveHighScore(score: number): Promise<boolean> {
  const currentHigh = await getHighScore();
  if (score > currentHigh) {
    await AsyncStorage.setItem('@jumper_high_score', score.toString());
    return true;  // New high score
  }
  return false;
}
```

---

## Future Backend Integration

The codebase is structured for easy backend integration.

### GameResultService Abstraction

```typescript
// Location: src/services/GameResultService.ts

interface GameResult {
  gameType: 'flappy' | 'maze' | 'jumper';
  score: number;
  duration?: number;
  difficulty?: string;
  timestamp: Date;
}

class GameResultService {
  // Currently saves locally
  async saveResult(result: GameResult): Promise<void> {
    // TODO: Replace with API call
    await AsyncStorage.setItem(...);
  }

  // Currently reads locally
  async getResults(gameType: string): Promise<GameResult[]> {
    // TODO: Replace with API call
    return await AsyncStorage.getItem(...);
  }
}
```

### Backend Integration Steps

1. **Create API endpoints:**
   - `POST /api/games/results` - Save game result
   - `GET /api/games/results/:gameType` - Get leaderboard
   - `GET /api/games/results/user/:userId` - Get user's scores

2. **Update GameResultService:**
   ```typescript
   async saveResult(result: GameResult): Promise<void> {
     // Save to backend
     await fetch('/api/games/results', {
       method: 'POST',
       body: JSON.stringify(result),
     });

     // Also cache locally for offline support
     await AsyncStorage.setItem(...);
   }
   ```

3. **Add authentication:**
   ```typescript
   // Add user context
   const { userId } = useAuth();

   // Include in results
   await gameResultService.saveResult({
     ...result,
     userId,
   });
   ```

---

## Performance Tips

### Optimizing Game Loop

```typescript
// Use refs for mutable state in game loop
const playerRef = useRef(position);

// Only update React state for rendering
setPlayer({ ...playerRef.current });

// Use requestAnimationFrame for smooth 60fps
gameLoopRef.current = requestAnimationFrame(gameLoop);
```

### Reducing Re-renders

```typescript
// Bad: Creates new object every render
style={{ left: player.x, top: player.y }}

// Better: Memoize or use refs
const playerStyle = useMemo(() => ({
  left: player.x,
  top: player.y,
}), [player.x, player.y]);
```

---

## Troubleshooting

### Common Issues

1. **Game not rendering:**
   - Check if game state is correctly set
   - Verify requestAnimationFrame is running

2. **Touch not working:**
   - Ensure View has proper touch handlers
   - Check if gesture handler is blocking touches

3. **Performance issues:**
   - Reduce number of rendered elements
   - Use refs instead of state for game loop
   - Remove console.logs in production

4. **Maze not solvable:**
   - Check isSolvable() function
   - Verify start and exit positions exist

---

## License

This project is for MVP testing purposes.

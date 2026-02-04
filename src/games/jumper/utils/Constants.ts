import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Physics constants (tunable)
export const PHYSICS = {
  GRAVITY: 0.6,
  BOUNCE_VELOCITY: -15,
  SPRING_VELOCITY: -22,
  HORIZONTAL_SPEED: 0.3,
  MAX_HORIZONTAL_SPEED: 8,
  HORIZONTAL_FRICTION: 0.95,
};

// Player dimensions
export const PLAYER = {
  WIDTH: 40,
  HEIGHT: 40,
};

// Platform dimensions and types
export const PLATFORM = {
  WIDTH: 80,
  HEIGHT: 15,
  TYPES: {
    NORMAL: 'NORMAL',
    MOVING: 'MOVING',
    BREAKING: 'BREAKING',
    SPRING: 'SPRING',
  } as const,
};

// Platform colors
export const PLATFORM_COLORS = {
  NORMAL: '#27ae60',   // Green
  MOVING: '#3498db',   // Blue
  BREAKING: '#8B4513', // Brown
  SPRING: '#e74c3c',   // Red
};

// Game settings
export const GAME = {
  CAMERA_THRESHOLD: SCREEN_HEIGHT / 3, // Player stays in lower third
  MAX_JUMP_HEIGHT: Math.abs(PHYSICS.BOUNCE_VELOCITY * PHYSICS.BOUNCE_VELOCITY / (2 * PHYSICS.GRAVITY)),
  MIN_PLATFORM_GAP: 50,
  PLATFORM_COUNT: 15, // Initial platforms on screen
  MOVING_PLATFORM_SPEED: 2,
};

// Difficulty settings based on height
export const DIFFICULTY = {
  EASY: { maxHeight: 1000, normalWeight: 85, movingWeight: 10, breakingWeight: 5, springWeight: 0 },
  MEDIUM: { maxHeight: 3000, normalWeight: 70, movingWeight: 20, breakingWeight: 5, springWeight: 5 },
  HARD: { maxHeight: 5000, normalWeight: 60, movingWeight: 20, breakingWeight: 15, springWeight: 5 },
  EXTREME: { maxHeight: Infinity, normalWeight: 50, movingWeight: 20, breakingWeight: 20, springWeight: 10 },
};

// Colors
export const COLORS = {
  background: '#87CEEB', // Sky blue
  player: '#3498db',
  text: '#2c3e50',
  scoreText: '#ffffff',
  menuBg: 'rgba(0,0,0,0.7)',
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };

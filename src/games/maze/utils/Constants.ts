import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MAZE_PADDING = 16;
export const MAZE_WIDTH = SCREEN_WIDTH - MAZE_PADDING * 2;

export const CELL_TYPES = {
  PATH: 0,
  WALL: 1,
  START: 2,
  EXIT: 3,
  COIN: 4,
} as const;

export const COLORS = {
  background: '#1a1a2e',
  mazeBg: '#f5e6c8', // Cream/beige background like reference
  wall: '#4a6fa5', // Blue walls like reference
  path: '#f5e6c8', // Same as maze background
  start: '#e74c3c', // Red apple/marker for start
  exit: '#f5e6c8', // Exit blends with path, marked with icon
  player: '#8B4513', // Brown player (like character in reference)
  coin: '#fdcb6e',
  text: '#ffffff',
  timerBg: 'rgba(0,0,0,0.5)',
  dpadBg: 'rgba(255,255,255,0.1)',
  dpadActive: 'rgba(255,255,255,0.3)',
};

export const PLAYER_MOVE_DURATION = 100; // ms per cell movement

export { SCREEN_WIDTH, SCREEN_HEIGHT };

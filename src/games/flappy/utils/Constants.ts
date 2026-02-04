import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

// Bird
export const BIRD_WIDTH = 40;
export const BIRD_HEIGHT = 40;
export const BIRD_X = width * 0.25;

// Physics
export const GRAVITY = 0.8;
export const FLAP_VELOCITY = -12;

// Pipes
export const PIPE_WIDTH = 60;
export const PIPE_SPEED = 3;
export const GAP_SIZE = 150;
export const PIPE_SPAWN_INTERVAL = 2000;

// Ground
export const GROUND_HEIGHT = 80;

// Game area
export const GAME_HEIGHT = height - GROUND_HEIGHT;

// Colors
export const COLORS = {
  sky: '#87CEEB',
  bird: '#FFD700',
  pipe: '#228B22',
  ground: '#8B4513',
  groundTop: '#90EE90',
  text: '#FFFFFF',
  textShadow: '#000000',
};

import {
  SCREEN_WIDTH,
  PIPE_WIDTH,
  GAP_SIZE,
  GAME_HEIGHT,
  PIPE_SPAWN_INTERVAL,
} from '../utils/Constants';
import { GameEntities } from '../types';
import Pipe from '../components/Pipe';

let lastPipeTime = 0;
let pipeId = 0;

export const resetPipeSpawner = () => {
  lastPipeTime = 0;
  pipeId = 0;
};

interface SpawnerProps {
  time: {
    current: number;
  };
}

const PipeSpawner = (entities: GameEntities, { time }: SpawnerProps): GameEntities => {
  const currentTime = time.current;

  // Spawn new pipe pair
  if (currentTime - lastPipeTime > PIPE_SPAWN_INTERVAL) {
    lastPipeTime = currentTime;
    pipeId++;

    // Random gap position (keeping gap within playable area)
    const minGapTop = 80;
    const maxGapTop = GAME_HEIGHT - GAP_SIZE - 80;
    const gapTop = Math.random() * (maxGapTop - minGapTop) + minGapTop;

    const topHeight = gapTop;
    const bottomY = gapTop + GAP_SIZE;
    const bottomHeight = GAME_HEIGHT - bottomY;

    entities[`pipe${pipeId}`] = {
      position: { x: SCREEN_WIDTH },
      topHeight,
      bottomY,
      bottomHeight,
      scored: false,
      renderer: Pipe,
    };
  }

  // Remove off-screen pipes
  Object.keys(entities).forEach((key) => {
    if (key.startsWith('pipe')) {
      const pipe = entities[key];
      if (pipe && pipe.position && pipe.position.x < -PIPE_WIDTH) {
        delete entities[key];
      }
    }
  });

  return entities;
};

export default PipeSpawner;

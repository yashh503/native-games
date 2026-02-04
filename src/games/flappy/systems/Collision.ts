import {
  BIRD_WIDTH,
  BIRD_HEIGHT,
  PIPE_WIDTH,
  GAME_HEIGHT,
} from '../utils/Constants';
import { GameEntities } from '../types';

interface CollisionProps {
  events: any[];
  dispatch: (event: { type: string }) => void;
}

const Collision = (entities: GameEntities, { dispatch }: CollisionProps): GameEntities => {
  const bird = entities.bird;
  const birdBox = {
    x: bird.position.x,
    y: bird.position.y,
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
  };

  // Check ground collision
  if (bird.position.y >= GAME_HEIGHT - BIRD_HEIGHT) {
    dispatch({ type: 'game_over' });
    return entities;
  }

  // Check ceiling collision
  if (bird.position.y <= 0) {
    dispatch({ type: 'game_over' });
    return entities;
  }

  // Check pipe collisions
  Object.keys(entities).forEach((key) => {
    if (key.startsWith('pipe')) {
      const pipe = entities[key];
      if (!pipe || !pipe.position) return;

      const pipeX = pipe.position.x;

      // Top pipe collision box
      const topPipeBox = {
        x: pipeX,
        y: 0,
        width: PIPE_WIDTH,
        height: pipe.topHeight,
      };

      // Bottom pipe collision box
      const bottomPipeBox = {
        x: pipeX,
        y: pipe.bottomY,
        width: PIPE_WIDTH,
        height: pipe.bottomHeight,
      };

      if (checkOverlap(birdBox, topPipeBox) || checkOverlap(birdBox, bottomPipeBox)) {
        dispatch({ type: 'game_over' });
      }
    }
  });

  return entities;
};

const checkOverlap = (
  box1: { x: number; y: number; width: number; height: number },
  box2: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  );
};

export default Collision;

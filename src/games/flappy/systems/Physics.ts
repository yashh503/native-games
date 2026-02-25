import { GRAVITY, GAME_HEIGHT, BIRD_HEIGHT, PIPE_SPEED } from '../utils/Constants';
import { GameEntities, GameEvent } from '../types';

const Physics = (entities: GameEntities, { events }: { events: GameEvent[] }): GameEntities => {
  const bird = entities.bird;

  // Handle flap events
  events.forEach((e) => {
    if (e.type === 'flap') {
      if (e.velocity !== undefined) bird.velocity = e.velocity;
    }
  });

  // Apply gravity
  bird.velocity += GRAVITY;
  bird.position.y += bird.velocity;

  // Clamp to screen bounds
  if (bird.position.y < 0) {
    bird.position.y = 0;
    bird.velocity = 0;
  }

  if (bird.position.y > GAME_HEIGHT - BIRD_HEIGHT) {
    bird.position.y = GAME_HEIGHT - BIRD_HEIGHT;
  }

  // Move pipes
  Object.keys(entities).forEach((key) => {
    if (key.startsWith('pipe')) {
      const pipe = entities[key];
      if (pipe && pipe.position) {
        pipe.position.x -= PIPE_SPEED;
      }
    }
  });

  return entities;
};

export default Physics;

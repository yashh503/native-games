import { BIRD_X, BIRD_WIDTH, PIPE_WIDTH } from '../utils/Constants';
import { GameEntities } from '../types';

interface ScoreProps {
  dispatch: (event: { type: string }) => void;
}

const ScoreSystem = (entities: GameEntities, { dispatch }: ScoreProps): GameEntities => {
  const birdRightEdge = BIRD_X + BIRD_WIDTH;

  Object.keys(entities).forEach((key) => {
    if (key.startsWith('pipe')) {
      const pipe = entities[key];
      if (!pipe || !pipe.position) return;

      const pipeRightEdge = pipe.position.x + PIPE_WIDTH;

      // Check if bird passed through pipe (pipe's right edge passed bird's left edge)
      if (!pipe.scored && pipeRightEdge < BIRD_X) {
        pipe.scored = true;
        dispatch({ type: 'score' });
      }
    }
  });

  return entities;
};

export default ScoreSystem;

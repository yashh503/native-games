import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { getHighScore, updateHighScoreIfNeeded } from './flappy/utils/Storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
type GameModeType = 'easy' | 'hard' | 'medium';
const gameMode: GameModeType = 'easy';

// Constants
const BIRD_WIDTH = 35;
const BIRD_HEIGHT = 35;
const BIRD_X = SCREEN_WIDTH * 0.25;
const GRAVITY = gameMode === "easy" ? 0.8 : 1.2;
const FLAP_VELOCITY = gameMode === "easy" ? -12 : -9;
const PIPE_WIDTH = 60;
const PIPE_SPEED = gameMode === "easy" ? 2 : 3;
const GAP_SIZE = gameMode === "easy" ? 350 : 200;
const PIPE_SPAWN_INTERVAL = gameMode === "easy" ? 2500 : 1500;
const GROUND_HEIGHT = 80;
const GAME_HEIGHT = SCREEN_HEIGHT - GROUND_HEIGHT;

const COLORS = {
  sky: '#87CEEB',
  bird: '#FFD700',
  pipe: '#228B22',
  ground: '#8B4513',
  groundTop: '#90EE90',
  text: '#FFFFFF',
  textShadow: '#000000',
};

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

interface Pipe {
  id: number;
  x: number;
  gapTop: number;
  scored: boolean;
}

export default function FlappyGame() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2 - BIRD_HEIGHT / 2);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const velocityRef = useRef(0);
  const lastPipeTimeRef = useRef(0);
  const pipeIdRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const gameStateRef = useRef<GameState>('MENU');
  const birdYRef = useRef(GAME_HEIGHT / 2 - BIRD_HEIGHT / 2);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);

  useEffect(() => {
    loadHighScore();
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const loadHighScore = async () => {
    const saved = await getHighScore();
    setHighScore(saved);
  };

  const resetGame = useCallback(() => {
    velocityRef.current = 0;
    lastPipeTimeRef.current = Date.now();
    pipeIdRef.current = 0;
    birdYRef.current = GAME_HEIGHT / 2 - BIRD_HEIGHT / 2;
    pipesRef.current = [];
    scoreRef.current = 0;
    setBirdY(GAME_HEIGHT / 2 - BIRD_HEIGHT / 2);
    setPipes([]);
    setScore(0);
  }, []);

  const endGame = useCallback(async () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setGameState('GAME_OVER');
    const newHigh = await updateHighScoreIfNeeded(scoreRef.current);
    setHighScore(newHigh);
  }, []);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;

    // Apply gravity
    velocityRef.current += GRAVITY;
    birdYRef.current += velocityRef.current;

    // Clamp bird position
    if (birdYRef.current < 0) {
      birdYRef.current = 0;
      velocityRef.current = 0;
    }

    // Check ground collision
    if (birdYRef.current >= GAME_HEIGHT - BIRD_HEIGHT) {
      birdYRef.current = GAME_HEIGHT - BIRD_HEIGHT;
      endGame();
      return;
    }

    // Spawn new pipes
    const now = Date.now();
    if (now - lastPipeTimeRef.current > PIPE_SPAWN_INTERVAL) {
      lastPipeTimeRef.current = now;
      pipeIdRef.current++;
      const minGapTop = 80;
      const maxGapTop = GAME_HEIGHT - GAP_SIZE - 80;
      const gapTop = Math.random() * (maxGapTop - minGapTop) + minGapTop;
      pipesRef.current.push({
        id: pipeIdRef.current,
        x: SCREEN_WIDTH,
        gapTop,
        scored: false,
      });
    }

    // Move pipes and check collisions
    const birdBox = {
      left: BIRD_X,
      right: BIRD_X + BIRD_WIDTH,
      top: birdYRef.current,
      bottom: birdYRef.current + BIRD_HEIGHT,
    };

    let newScore = scoreRef.current;
    const updatedPipes: Pipe[] = [];

    for (const pipe of pipesRef.current) {
      pipe.x -= PIPE_SPEED;

      // Remove off-screen pipes
      if (pipe.x < -PIPE_WIDTH) continue;

      // Check collision with top pipe
      const topPipeBox = {
        left: pipe.x,
        right: pipe.x + PIPE_WIDTH,
        top: 0,
        bottom: pipe.gapTop,
      };

      // Check collision with bottom pipe
      const bottomPipeBox = {
        left: pipe.x,
        right: pipe.x + PIPE_WIDTH,
        top: pipe.gapTop + GAP_SIZE,
        bottom: GAME_HEIGHT,
      };

      if (checkCollision(birdBox, topPipeBox) || checkCollision(birdBox, bottomPipeBox)) {
        endGame();
        return;
      }

      // Check scoring
      if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.scored = true;
        newScore++;
      }

      updatedPipes.push(pipe);
    }

    pipesRef.current = updatedPipes;
    scoreRef.current = newScore;

    // Update state for render
    setBirdY(birdYRef.current);
    setPipes([...pipesRef.current]);
    setScore(newScore);

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [endGame]);

  const checkCollision = (
    box1: { left: number; right: number; top: number; bottom: number },
    box2: { left: number; right: number; top: number; bottom: number }
  ) => {
    return (
      box1.left < box2.right &&
      box1.right > box2.left &&
      box1.top < box2.bottom &&
      box1.bottom > box2.top
    );
  };

  const startGame = useCallback(() => {
    resetGame();
    setGameState('PLAYING');
    lastPipeTimeRef.current = Date.now();
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [resetGame, gameLoop]);

  const handleTap = useCallback(() => {
    if (gameState === 'MENU') {
      startGame();
    } else if (gameState === 'PLAYING') {
      velocityRef.current = FLAP_VELOCITY;
    } else if (gameState === 'GAME_OVER') {
      startGame();
    }
  }, [gameState, startGame]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {/* Bird */}
        {gameState === 'PLAYING' && (
          <View style={[styles.bird, { top: birdY, left: BIRD_X }]} />
        )}

        {/* Pipes */}
        {gameState === 'PLAYING' &&
          pipes.map((pipe) => (
            <React.Fragment key={pipe.id}>
              {/* Top pipe */}
              <View
                style={[
                  styles.pipe,
                  {
                    left: pipe.x,
                    top: 0,
                    height: pipe.gapTop,
                  },
                ]}
              />
              {/* Bottom pipe */}
              <View
                style={[
                  styles.pipe,
                  {
                    left: pipe.x,
                    top: pipe.gapTop + GAP_SIZE,
                    height: GAME_HEIGHT - (pipe.gapTop + GAP_SIZE),
                  },
                ]}
              />
            </React.Fragment>
          ))}

        {/* Score display */}
        {gameState === 'PLAYING' && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        )}

        {/* Menu overlay */}
        {gameState === 'MENU' && (
          <View style={styles.overlay}>
            <Text style={styles.title}>Flappy Bird</Text>
            <Text style={styles.highScoreText}>High Score: {highScore}</Text>
            <Text style={styles.startText}>Tap to Start</Text>
          </View>
        )}

        {/* Game over overlay */}
        {gameState === 'GAME_OVER' && (
          <View style={styles.overlay}>
            <Text style={styles.gameOverText}>Game Over</Text>
            <Text style={styles.finalScoreText}>Score: {score}</Text>
            <Text style={styles.highScoreText}>High Score: {highScore}</Text>
            <Text style={styles.restartText}>Tap to Restart</Text>
          </View>
        )}

        {/* Ground */}
        <View style={styles.groundContainer}>
          <View style={styles.grassTop} />
          <View style={styles.ground} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.sky,
  },
  bird: {
    position: 'absolute',
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
    backgroundColor: COLORS.bird,
    borderRadius: 8,
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: COLORS.pipe,
  },
  scoreContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 20,
  },
  gameOverText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FF4444',
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 20,
  },
  finalScoreText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 10,
  },
  highScoreText: {
    fontSize: 24,
    color: COLORS.text,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 30,
  },
  startText: {
    fontSize: 24,
    color: COLORS.text,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  restartText: {
    fontSize: 24,
    color: COLORS.text,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  groundContainer: {
    position: 'absolute',
    left: 0,
    top: GAME_HEIGHT,
    width: SCREEN_WIDTH,
    height: GROUND_HEIGHT,
  },
  grassTop: {
    width: '100%',
    height: 10,
    backgroundColor: COLORS.groundTop,
  },
  ground: {
    width: '100%',
    flex: 1,
    backgroundColor: COLORS.ground,
  },
});

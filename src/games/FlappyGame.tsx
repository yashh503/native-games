import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, Dimensions } from 'react-native';
import { getHighScore, updateHighScoreIfNeeded } from './flappy/utils/Storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
type GameModeType = 'easy' | 'hard' | 'medium';
const gameMode: GameModeType = 'easy';

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

const GAME_COLORS = {
  sky: '#87CEEB',
  bird: '#FFD700',
  pipe: '#4F8A4F',
  ground: '#8B6914',
  groundTop: '#5DB858',
};

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

interface Pipe {
  id: number;
  x: number;
  gapTop: number;
  scored: boolean;
}

interface FlappyGameProps {
  onGameComplete?: (result: { gameId: string; score: number }) => void;
  onGoHome?: () => void;
}

export default function FlappyGame({ onGameComplete, onGoHome }: FlappyGameProps) {
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

  useEffect(() => { loadHighScore(); }, []);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

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
    onGameComplete?.({ gameId: 'flappy', score: scoreRef.current });
  }, [onGameComplete]);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;

    velocityRef.current += GRAVITY;
    birdYRef.current += velocityRef.current;

    if (birdYRef.current < 0) { birdYRef.current = 0; velocityRef.current = 0; }

    if (birdYRef.current >= GAME_HEIGHT - BIRD_HEIGHT) {
      birdYRef.current = GAME_HEIGHT - BIRD_HEIGHT;
      endGame();
      return;
    }

    const now = Date.now();
    if (now - lastPipeTimeRef.current > PIPE_SPAWN_INTERVAL) {
      lastPipeTimeRef.current = now;
      pipeIdRef.current++;
      const gapTop = Math.random() * (GAME_HEIGHT - GAP_SIZE - 160) + 80;
      pipesRef.current.push({ id: pipeIdRef.current, x: SCREEN_WIDTH, gapTop, scored: false });
    }

    const birdBox = { left: BIRD_X, right: BIRD_X + BIRD_WIDTH, top: birdYRef.current, bottom: birdYRef.current + BIRD_HEIGHT };
    let newScore = scoreRef.current;
    const updatedPipes: Pipe[] = [];

    for (const pipe of pipesRef.current) {
      pipe.x -= PIPE_SPEED;
      if (pipe.x < -PIPE_WIDTH) continue;

      if (
        checkCollision(birdBox, { left: pipe.x, right: pipe.x + PIPE_WIDTH, top: 0, bottom: pipe.gapTop }) ||
        checkCollision(birdBox, { left: pipe.x, right: pipe.x + PIPE_WIDTH, top: pipe.gapTop + GAP_SIZE, bottom: GAME_HEIGHT })
      ) {
        endGame();
        return;
      }

      if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X) { pipe.scored = true; newScore++; }
      updatedPipes.push(pipe);
    }

    pipesRef.current = updatedPipes;
    scoreRef.current = newScore;
    setBirdY(birdYRef.current);
    setPipes([...pipesRef.current]);
    setScore(newScore);
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [endGame]);

  const checkCollision = (
    a: { left: number; right: number; top: number; bottom: number },
    b: { left: number; right: number; top: number; bottom: number }
  ) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

  const startGame = useCallback(() => {
    resetGame();
    setGameState('PLAYING');
    lastPipeTimeRef.current = Date.now();
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [resetGame, gameLoop]);

  const handleTap = useCallback(() => {
    if (gameState === 'MENU') startGame();
    else if (gameState === 'PLAYING') velocityRef.current = FLAP_VELOCITY;
    else if (gameState === 'GAME_OVER') startGame();
  }, [gameState, startGame]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) { cancelAnimationFrame(frameRef.current); frameRef.current = null; }
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {/* Bird */}
        {gameState === 'PLAYING' && <View style={[styles.bird, { top: birdY, left: BIRD_X }]} />}

        {/* Pipes */}
        {gameState === 'PLAYING' && pipes.map((pipe) => (
          <React.Fragment key={pipe.id}>
            <View style={[styles.pipe, { left: pipe.x, top: 0, height: pipe.gapTop }]} />
            <View style={[styles.pipe, { left: pipe.x, top: pipe.gapTop + GAP_SIZE, height: GAME_HEIGHT - (pipe.gapTop + GAP_SIZE) }]} />
          </React.Fragment>
        ))}

        {/* Live score */}
        {gameState === 'PLAYING' && (
          <View style={styles.scoreContainer}>
            <Text style={styles.liveScore}>{score}</Text>
          </View>
        )}

        {/* Menu */}
        {gameState === 'MENU' && (
          <View style={styles.overlay}>
            {onGoHome && (
              <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.8}>
                <Text style={styles.homeBtnText}>← Home</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.gameTitle}>Flappy Bird</Text>
            {highScore > 0 && <Text style={styles.bestText}>Best: {highScore}</Text>}
            <View style={styles.tapPill}><Text style={styles.tapText}>Tap to Fly 🐦</Text></View>
          </View>
        )}

        {/* Game Over */}
        {gameState === 'GAME_OVER' && (
          <View style={styles.overlay}>
            <Text style={styles.gameOverLabel}>Game Over</Text>
            <Text style={styles.bigScore}>{score}</Text>
            <Text style={styles.bigScoreSub}>pipes passed</Text>
            {highScore > 0 && <Text style={styles.bestText}>Best: {highScore}</Text>}
            <View style={styles.tapPill}><Text style={styles.tapText}>Tap to Play Again</Text></View>
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
  container: { flex: 1, backgroundColor: GAME_COLORS.sky },
  bird: {
    position: 'absolute',
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
    backgroundColor: GAME_COLORS.bird,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: GAME_COLORS.pipe,
    borderRadius: 4,
  },
  scoreContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  liveScore: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
    backgroundColor: 'rgba(135,206,235,0.65)',
  },
  homeBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  homeBtnText: { color: '#1a1a2e', fontWeight: '700', fontSize: 14 },
  gameTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 10,
  },
  gameOverLabel: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 8,
  },
  bigScore: {
    fontSize: 80,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    lineHeight: 88,
  },
  bigScoreSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
    marginBottom: 10,
  },
  bestText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '600',
    marginBottom: 24,
  },
  tapPill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  tapText: { fontSize: 16, color: '#1a1a2e', fontWeight: '700' },
  groundContainer: {
    position: 'absolute',
    left: 0,
    top: GAME_HEIGHT,
    width: SCREEN_WIDTH,
    height: GROUND_HEIGHT,
  },
  grassTop: { width: '100%', height: 10, backgroundColor: GAME_COLORS.groundTop },
  ground: { width: '100%', flex: 1, backgroundColor: GAME_COLORS.ground },
});

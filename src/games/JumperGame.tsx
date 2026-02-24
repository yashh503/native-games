import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import { getHighScore, saveHighScore } from './jumper/utils/Storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLAYER_SIZE = 30;
const PLATFORM_HEIGHT = 14;

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';
type PlatformType = 'NORMAL' | 'MOVING';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', gravity: 0.35, jumpVelocity: -11, moveSpeed: 5, platformWidth: 90, minSpacing: 45, maxSpacing: 90, movingPlatformSpeed: 1, movingPlatformChance: 0.15 },
  medium: { label: 'Medium', gravity: 0.4, jumpVelocity: -12, moveSpeed: 6, platformWidth: 80, minSpacing: 50, maxSpacing: 110, movingPlatformSpeed: 1.5, movingPlatformChance: 0.25 },
  hard: { label: 'Hard', gravity: 0.45, jumpVelocity: -13, moveSpeed: 7, platformWidth: 70, minSpacing: 55, maxSpacing: 130, movingPlatformSpeed: 2, movingPlatformChance: 0.35 },
};

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  type: PlatformType;
  moveDirection: number;
  initialX: number;
}

interface JumperGameProps {
  onGameComplete?: (result: { gameId: string; score: number }) => void;
  onGoHome?: () => void;
}

export default function JumperGame({ onGameComplete, onGoHome }: JumperGameProps) {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const [playerX, setPlayerX] = useState(SCREEN_WIDTH / 2 - PLAYER_SIZE / 2);
  const [playerY, setPlayerY] = useState(SCREEN_HEIGHT - 200);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [cameraY, setCameraY] = useState(0);

  const playerXRef = useRef(SCREEN_WIDTH / 2 - PLAYER_SIZE / 2);
  const playerYRef = useRef(SCREEN_HEIGHT - 200);
  const velocityYRef = useRef(0);
  const platformsRef = useRef<Platform[]>([]);
  const cameraYRef = useRef(0);
  const maxHeightRef = useRef(0);
  const platformIdRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const difficultyRef = useRef<Difficulty>('medium');
  const movingLeftRef = useRef(false);
  const movingRightRef = useRef(false);

  useEffect(() => {
    loadHighScore();
    return () => cleanup();
  }, []);

  const loadHighScore = async () => {
    const hs = await getHighScore();
    setHighScore(hs);
  };

  const cleanup = () => {
    isPlayingRef.current = false;
    if (gameLoopRef.current) { cancelAnimationFrame(gameLoopRef.current); gameLoopRef.current = null; }
  };

  const createPlatform = (y: number, x?: number, forceNormal: boolean = false): Platform => {
    const config = DIFFICULTY_CONFIG[difficultyRef.current];
    platformIdRef.current += 1;
    const platformX = x !== undefined ? x : Math.random() * (SCREEN_WIDTH - config.platformWidth);
    const isMoving = !forceNormal && Math.random() < config.movingPlatformChance;
    return { id: platformIdRef.current, x: platformX, y, width: config.platformWidth, type: isMoving ? 'MOVING' : 'NORMAL', moveDirection: Math.random() > 0.5 ? 1 : -1, initialX: platformX };
  };

  const startGame = () => {
    cleanup();
    platformIdRef.current = 0;
    difficultyRef.current = difficulty;
    const config = DIFFICULTY_CONFIG[difficulty];

    const initialPlatforms: Platform[] = [];
    initialPlatforms.push(createPlatform(SCREEN_HEIGHT - 100, SCREEN_WIDTH / 2 - config.platformWidth / 2, true));

    let currentY = SCREEN_HEIGHT - 100;
    for (let i = 1; i < 12; i++) {
      const spacing = config.minSpacing + Math.random() * (config.maxSpacing - config.minSpacing);
      currentY -= spacing;
      initialPlatforms.push(createPlatform(currentY, undefined, i < 4));
    }

    playerXRef.current = SCREEN_WIDTH / 2 - PLAYER_SIZE / 2;
    playerYRef.current = SCREEN_HEIGHT - 150;
    velocityYRef.current = 0;
    platformsRef.current = initialPlatforms;
    cameraYRef.current = 0;
    maxHeightRef.current = 0;
    movingLeftRef.current = false;
    movingRightRef.current = false;

    setPlayerX(playerXRef.current);
    setPlayerY(playerYRef.current);
    setPlatforms(initialPlatforms);
    setCameraY(0);
    setScore(0);
    setIsNewHighScore(false);
    setGameState('PLAYING');
    isPlayingRef.current = true;
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const endGame = async () => {
    cleanup();
    const finalScore = Math.floor(maxHeightRef.current / 10);
    const isNew = await saveHighScore(finalScore);
    setIsNewHighScore(isNew);
    if (isNew) setHighScore(finalScore);
    setScore(finalScore);
    setGameState('GAME_OVER');
    onGameComplete?.({ gameId: 'jumper', score: finalScore });
  };

  const gameLoop = () => {
    if (!isPlayingRef.current) return;
    const config = DIFFICULTY_CONFIG[difficultyRef.current];

    velocityYRef.current += config.gravity;
    playerYRef.current += velocityYRef.current;

    if (movingLeftRef.current) playerXRef.current -= config.moveSpeed;
    if (movingRightRef.current) playerXRef.current += config.moveSpeed;

    if (playerXRef.current < -PLAYER_SIZE / 2) playerXRef.current = SCREEN_WIDTH - PLAYER_SIZE / 2;
    else if (playerXRef.current > SCREEN_WIDTH - PLAYER_SIZE / 2) playerXRef.current = -PLAYER_SIZE / 2;

    if (velocityYRef.current > 0) {
      const playerBottom = playerYRef.current + PLAYER_SIZE;
      const playerCenterX = playerXRef.current + PLAYER_SIZE / 2;
      for (const plat of platformsRef.current) {
        const platScreenY = plat.y + cameraYRef.current;
        if (playerCenterX >= plat.x - 5 && playerCenterX <= plat.x + plat.width + 5 && playerBottom >= platScreenY && playerBottom <= platScreenY + PLATFORM_HEIGHT + 15) {
          playerYRef.current = platScreenY - PLAYER_SIZE;
          velocityYRef.current = config.jumpVelocity;
          break;
        }
      }
    }

    const cameraThreshold = SCREEN_HEIGHT * 0.35;
    if (playerYRef.current < cameraThreshold) {
      const diff = cameraThreshold - playerYRef.current;
      cameraYRef.current += diff;
      playerYRef.current = cameraThreshold;
      if (cameraYRef.current > maxHeightRef.current) maxHeightRef.current = cameraYRef.current;
    }

    for (const plat of platformsRef.current) {
      if (plat.type === 'MOVING') {
        plat.x += config.movingPlatformSpeed * plat.moveDirection;
        if (plat.x <= 0) { plat.x = 0; plat.moveDirection = 1; }
        else if (plat.x >= SCREEN_WIDTH - plat.width) { plat.x = SCREEN_WIDTH - plat.width; plat.moveDirection = -1; }
      }
    }

    const highestY = Math.min(...platformsRef.current.map(p => p.y));
    if (highestY + cameraYRef.current > -50) {
      const spacing = config.minSpacing + Math.random() * (config.maxSpacing - config.minSpacing);
      platformsRef.current.push(createPlatform(highestY - spacing));
    }
    platformsRef.current = platformsRef.current.filter(p => p.y + cameraYRef.current < SCREEN_HEIGHT + 100);

    if (playerYRef.current > SCREEN_HEIGHT + 50) { endGame(); return; }

    setPlayerX(playerXRef.current);
    setPlayerY(playerYRef.current);
    setPlatforms([...platformsRef.current]);
    setCameraY(cameraYRef.current);
    setScore(Math.floor(maxHeightRef.current / 10));
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  // MENU
  if (gameState === 'MENU') {
    return (
      <View style={styles.menuContainer}>
        {onGoHome && (
          <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.8}>
            <Text style={styles.homeBtnText}>← Home</Text>
          </TouchableOpacity>
        )}
        <View style={styles.menuContent}>
          <Text style={styles.gameTitle}>Jump!</Text>
          <Text style={styles.gameSubtitle}>Endless Jumper</Text>

          {highScore > 0 && (
            <View style={styles.bestScoreCard}>
              <Text style={styles.bestScoreLabel}>Best Score</Text>
              <Text style={styles.bestScoreValue}>{highScore}</Text>
            </View>
          )}

          <View style={styles.difficultyContainer}>
            <Text style={styles.difficultyLabel}>Difficulty</Text>
            <View style={styles.difficultyButtons}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
                  onPress={() => setDifficulty(d)}
                >
                  <Text style={[styles.diffBtnText, difficulty === d && styles.diffBtnTextActive]}>
                    {DIFFICULTY_CONFIG[d].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.playButton} onPress={startGame} activeOpacity={0.85}>
            <Text style={styles.playButtonText}>Play 🚀</Text>
          </TouchableOpacity>

          <View style={styles.howToPlay}>
            <Text style={styles.howTitle}>How to Play</Text>
            <Text style={styles.howText}>Hold LEFT or RIGHT to move</Text>
            <Text style={styles.howText}>Land on platforms to bounce higher</Text>
            <Text style={styles.howText}>🟢 Normal  🟠 Moving</Text>
          </View>
        </View>
      </View>
    );
  }

  // PLAYING
  if (gameState === 'PLAYING') {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.skyBg} />

        {platforms.map((plat) => {
          const screenY = plat.y + cameraY;
          if (screenY < -30 || screenY > SCREEN_HEIGHT + 30) return null;
          return (
            <View
              key={plat.id}
              style={[
                styles.platform,
                plat.type === 'MOVING' && styles.movingPlatform,
                { left: plat.x, top: screenY, width: plat.width, height: PLATFORM_HEIGHT },
              ]}
            >
              {plat.type === 'MOVING' && (
                <Text style={styles.movingArrow}>{plat.moveDirection > 0 ? '→' : '←'}</Text>
              )}
            </View>
          );
        })}

        <View style={[styles.player, { left: playerX, top: playerY, width: PLAYER_SIZE, height: PLAYER_SIZE }]}>
          <View style={styles.playerEye} />
          <View style={[styles.playerEye, styles.playerEyeRight]} />
        </View>

        <View style={styles.scoreDisplay}>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        <View style={styles.controlsContainer}>
          <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            onPressIn={() => { movingLeftRef.current = true; }}
            onPressOut={() => { movingLeftRef.current = false; }}
          >
            <Text style={styles.controlButtonText}>◀</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            onPressIn={() => { movingRightRef.current = true; }}
            onPressOut={() => { movingRightRef.current = false; }}
          >
            <Text style={styles.controlButtonText}>▶</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // GAME OVER
  if (gameState === 'GAME_OVER') {
    return (
      <View style={styles.menuContainer}>
        {onGoHome && (
          <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.8}>
            <Text style={styles.homeBtnText}>← Home</Text>
          </TouchableOpacity>
        )}
        <View style={styles.menuContent}>
          <Text style={styles.gameOverTitle}>Game Over</Text>

          {isNewHighScore && (
            <View style={styles.newBestBadge}>
              <Text style={styles.newBestText}>🏆 New Best!</Text>
            </View>
          )}

          <View style={styles.bestScoreCard}>
            <Text style={styles.bestScoreLabel}>Score</Text>
            <Text style={styles.finalScoreValue}>{score}</Text>
          </View>

          {!isNewHighScore && highScore > 0 && (
            <Text style={styles.prevBest}>Best: {highScore}</Text>
          )}

          <TouchableOpacity style={styles.playButton} onPress={startGame} activeOpacity={0.85}>
            <Text style={styles.playButtonText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setGameState('MENU')}>
            <Text style={styles.secondaryBtnText}>Change Difficulty</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  homeBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    zIndex: 10,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  homeBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 14 },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  gameTitle: {
    fontSize: 56,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -1,
  },
  gameSubtitle: { fontSize: 18, color: '#6B7280', marginBottom: 28 },
  bestScoreCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bestScoreLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  bestScoreValue: { fontSize: 40, fontWeight: '800', color: '#D97706' },
  finalScoreValue: { fontSize: 52, fontWeight: '800', color: '#111827' },
  prevBest: { fontSize: 15, color: '#6B7280', marginBottom: 20 },
  difficultyContainer: { width: '100%', marginBottom: 28 },
  difficultyLabel: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 10, fontWeight: '500' },
  difficultyButtons: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  diffBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F0F2F8',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  diffBtnActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  diffBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  diffBtnTextActive: { color: '#4F46E5' },
  playButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 56,
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  playButtonText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  howToPlay: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  howTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6 },
  howText: { fontSize: 13, color: '#6B7280' },
  gameOverTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  newBestBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  newBestText: { fontSize: 15, fontWeight: '700', color: '#92400E' },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: '#F0F2F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  // Game play styles
  gameContainer: { flex: 1, backgroundColor: '#87CEEB' },
  skyBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#87CEEB' },
  platform: {
    position: 'absolute',
    backgroundColor: '#16A34A',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  movingPlatform: { backgroundColor: '#EA580C' },
  movingArrow: { fontSize: 10, color: '#fff', fontWeight: '700' },
  player: {
    position: 'absolute',
    backgroundColor: '#4F46E5',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  playerEye: { width: 6, height: 6, backgroundColor: '#fff', borderRadius: 3, marginRight: 4 },
  playerEyeRight: { marginRight: 0, marginLeft: 0 },
  scoreDisplay: { position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center' },
  scoreValue: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  controlButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  controlButtonPressed: { backgroundColor: 'rgba(255,255,255,0.75)', transform: [{ scale: 0.95 }] },
  controlButtonText: { fontSize: 34, color: '#333' },
});

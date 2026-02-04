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

// Player and platform dimensions
const PLAYER_SIZE = 30;
const PLATFORM_HEIGHT = 14;

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';
type PlatformType = 'NORMAL' | 'MOVING';
type Difficulty = 'easy' | 'medium' | 'hard';

// Difficulty settings
const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    gravity: 0.35,
    jumpVelocity: -11,
    moveSpeed: 5,
    platformWidth: 90,
    minSpacing: 45,
    maxSpacing: 90,
    movingPlatformSpeed: 1,
    movingPlatformChance: 0.15,
  },
  medium: {
    label: 'Medium',
    gravity: 0.4,
    jumpVelocity: -12,
    moveSpeed: 6,
    platformWidth: 80,
    minSpacing: 50,
    maxSpacing: 110,
    movingPlatformSpeed: 1.5,
    movingPlatformChance: 0.25,
  },
  hard: {
    label: 'Hard',
    gravity: 0.45,
    jumpVelocity: -13,
    moveSpeed: 7,
    platformWidth: 70,
    minSpacing: 55,
    maxSpacing: 130,
    movingPlatformSpeed: 2,
    movingPlatformChance: 0.35,
  },
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

export default function JumperGame() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Render state
  const [playerX, setPlayerX] = useState(SCREEN_WIDTH / 2 - PLAYER_SIZE / 2);
  const [playerY, setPlayerY] = useState(SCREEN_HEIGHT - 200);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [cameraY, setCameraY] = useState(0);

  // Game loop refs
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

  // Simple button-based movement
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
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  const createPlatform = (y: number, x?: number, forceNormal: boolean = false): Platform => {
    const config = DIFFICULTY_CONFIG[difficultyRef.current];
    platformIdRef.current += 1;
    const platformX = x !== undefined ? x : Math.random() * (SCREEN_WIDTH - config.platformWidth);
    const isMoving = !forceNormal && Math.random() < config.movingPlatformChance;

    return {
      id: platformIdRef.current,
      x: platformX,
      y: y,
      width: config.platformWidth,
      type: isMoving ? 'MOVING' : 'NORMAL',
      moveDirection: Math.random() > 0.5 ? 1 : -1,
      initialX: platformX,
    };
  };

  const startGame = () => {
    cleanup();
    platformIdRef.current = 0;
    difficultyRef.current = difficulty;
    const config = DIFFICULTY_CONFIG[difficulty];

    // Create platforms with safe, reachable spacing
    const initialPlatforms: Platform[] = [];

    // Ground platform - centered under player (always normal)
    initialPlatforms.push(createPlatform(SCREEN_HEIGHT - 100, SCREEN_WIDTH / 2 - config.platformWidth / 2, true));

    // Generate platforms upward with random but safe spacing
    let currentY = SCREEN_HEIGHT - 100;
    for (let i = 1; i < 12; i++) {
      const spacing = config.minSpacing + Math.random() * (config.maxSpacing - config.minSpacing);
      currentY -= spacing;
      initialPlatforms.push(createPlatform(currentY, undefined, i < 4));
    }

    // Reset all state
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
  };

  const gameLoop = () => {
    if (!isPlayingRef.current) return;

    const config = DIFFICULTY_CONFIG[difficultyRef.current];

    // Apply gravity
    velocityYRef.current += config.gravity;
    playerYRef.current += velocityYRef.current;

    // Simple left/right movement with buttons
    if (movingLeftRef.current) {
      playerXRef.current -= config.moveSpeed;
    }
    if (movingRightRef.current) {
      playerXRef.current += config.moveSpeed;
    }

    // Screen wrap
    if (playerXRef.current < -PLAYER_SIZE / 2) {
      playerXRef.current = SCREEN_WIDTH - PLAYER_SIZE / 2;
    } else if (playerXRef.current > SCREEN_WIDTH - PLAYER_SIZE / 2) {
      playerXRef.current = -PLAYER_SIZE / 2;
    }

    // Platform collision (only when falling)
    if (velocityYRef.current > 0) {
      const playerBottom = playerYRef.current + PLAYER_SIZE;
      const playerCenterX = playerXRef.current + PLAYER_SIZE / 2;

      for (const plat of platformsRef.current) {
        const platScreenY = plat.y + cameraYRef.current;

        // Generous collision detection
        const onPlatformX = playerCenterX >= plat.x - 5 && playerCenterX <= plat.x + plat.width + 5;
        const onPlatformY = playerBottom >= platScreenY && playerBottom <= platScreenY + PLATFORM_HEIGHT + 15;

        if (onPlatformX && onPlatformY) {
          playerYRef.current = platScreenY - PLAYER_SIZE;
          velocityYRef.current = config.jumpVelocity;
          break;
        }
      }
    }

    // Camera follows player smoothly
    const cameraThreshold = SCREEN_HEIGHT * 0.35;
    if (playerYRef.current < cameraThreshold) {
      const diff = cameraThreshold - playerYRef.current;
      cameraYRef.current += diff;
      playerYRef.current = cameraThreshold;

      if (cameraYRef.current > maxHeightRef.current) {
        maxHeightRef.current = cameraYRef.current;
      }
    }

    // Update moving platforms
    for (const plat of platformsRef.current) {
      if (plat.type === 'MOVING') {
        plat.x += config.movingPlatformSpeed * plat.moveDirection;
        // Bounce off screen edges
        if (plat.x <= 0) {
          plat.x = 0;
          plat.moveDirection = 1;
        } else if (plat.x >= SCREEN_WIDTH - plat.width) {
          plat.x = SCREEN_WIDTH - plat.width;
          plat.moveDirection = -1;
        }
      }
    }

    // Generate new platforms above with safe spacing
    const highestY = Math.min(...platformsRef.current.map(p => p.y));
    if (highestY + cameraYRef.current > -50) {
      const spacing = config.minSpacing + Math.random() * (config.maxSpacing - config.minSpacing);
      platformsRef.current.push(createPlatform(highestY - spacing));
    }

    // Remove platforms below screen
    platformsRef.current = platformsRef.current.filter(
      p => p.y + cameraYRef.current < SCREEN_HEIGHT + 100
    );

    // Game over
    if (playerYRef.current > SCREEN_HEIGHT + 50) {
      endGame();
      return;
    }

    // Update render state
    setPlayerX(playerXRef.current);
    setPlayerY(playerYRef.current);
    setPlatforms([...platformsRef.current]);
    setCameraY(cameraYRef.current);
    setScore(Math.floor(maxHeightRef.current / 10));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  // MENU Screen
  if (gameState === 'MENU') {
    return (
      <View style={styles.menuContainer}>
        <View style={styles.menuContent}>
          <Text style={styles.gameTitle}>Jump!</Text>
          <Text style={styles.gameSubtitle}>Endless Jumper</Text>

          {highScore > 0 && (
            <View style={styles.highScoreContainer}>
              <Text style={styles.highScoreLabel}>Best Score</Text>
              <Text style={styles.highScoreValue}>{highScore}</Text>
            </View>
          )}

          {/* Difficulty Selection */}
          <View style={styles.difficultyContainer}>
            <Text style={styles.difficultyLabel}>Difficulty</Text>
            <View style={styles.difficultyButtons}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.difficultyButton,
                    difficulty === d && styles.difficultyButtonActive,
                  ]}
                  onPress={() => setDifficulty(d)}
                >
                  <Text
                    style={[
                      styles.difficultyButtonText,
                      difficulty === d && styles.difficultyButtonTextActive,
                    ]}
                  >
                    {DIFFICULTY_CONFIG[d].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.playButton} onPress={startGame}>
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>

          <View style={styles.howToPlay}>
            <Text style={styles.howToPlayTitle}>How to Play</Text>
            <Text style={styles.howToPlayText}>Hold LEFT or RIGHT buttons to move</Text>
            <Text style={styles.howToPlayText}>Land on platforms to bounce higher</Text>
            <Text style={styles.howToPlayText}>🟢 Green = Normal  🟠 Orange = Moving</Text>
            <Text style={styles.howToPlayText}>Don't fall!</Text>
          </View>
        </View>
      </View>
    );
  }

  // PLAYING Screen
  if (gameState === 'PLAYING') {
    return (
      <View style={styles.gameContainer}>
        {/* Sky gradient background */}
        <View style={styles.skyBackground} />

        {/* Platforms */}
        {platforms.map((plat) => {
          const screenY = plat.y + cameraY;
          if (screenY < -30 || screenY > SCREEN_HEIGHT + 30) return null;

          const isMoving = plat.type === 'MOVING';

          return (
            <View
              key={plat.id}
              style={[
                styles.platform,
                isMoving && styles.movingPlatform,
                {
                  left: plat.x,
                  top: screenY,
                  width: plat.width,
                  height: PLATFORM_HEIGHT,
                },
              ]}
            >
              {isMoving && (
                <View style={styles.movingIndicator}>
                  <Text style={styles.movingArrow}>
                    {plat.moveDirection > 0 ? '→' : '←'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Player */}
        <View
          style={[
            styles.player,
            {
              left: playerX,
              top: playerY,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
            },
          ]}
        >
          <View style={styles.playerEye} />
          <View style={[styles.playerEye, styles.playerEyeRight]} />
        </View>

        {/* Score Display */}
        <View style={styles.scoreDisplay}>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        {/* Difficulty Badge */}
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficultyBadgeText}>
            {DIFFICULTY_CONFIG[difficultyRef.current].label}
          </Text>
        </View>

        {/* Control Buttons - Large, easy to use */}
        <View style={styles.controlsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              styles.leftButton,
              pressed && styles.controlButtonPressed,
            ]}
            onPressIn={() => { movingLeftRef.current = true; }}
            onPressOut={() => { movingLeftRef.current = false; }}
          >
            <Text style={styles.controlButtonText}>◀</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              styles.rightButton,
              pressed && styles.controlButtonPressed,
            ]}
            onPressIn={() => { movingRightRef.current = true; }}
            onPressOut={() => { movingRightRef.current = false; }}
          >
            <Text style={styles.controlButtonText}>▶</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // GAME OVER Screen
  if (gameState === 'GAME_OVER') {
    return (
      <View style={styles.menuContainer}>
        <View style={styles.menuContent}>
          <Text style={styles.gameOverTitle}>Game Over</Text>

          {isNewHighScore && (
            <View style={styles.newHighScoreBadge}>
              <Text style={styles.newHighScoreText}>New Best!</Text>
            </View>
          )}

          <View style={styles.finalScoreContainer}>
            <Text style={styles.finalScoreLabel}>Score</Text>
            <Text style={styles.finalScoreValue}>{score}</Text>
          </View>

          <Text style={styles.difficultyPlayedText}>
            Mode: {DIFFICULTY_CONFIG[difficultyRef.current].label}
          </Text>

          {!isNewHighScore && highScore > 0 && (
            <Text style={styles.bestScoreText}>Best: {highScore}</Text>
          )}

          <TouchableOpacity style={styles.playButton} onPress={startGame}>
            <Text style={styles.playButtonText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButtonSecondary}
            onPress={() => setGameState('MENU')}
          >
            <Text style={styles.menuButtonSecondaryText}>Change Difficulty</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Menu Styles
  menuContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  gameTitle: {
    fontSize: 56,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 5,
  },
  gameSubtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 30,
  },
  highScoreContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 30,
    alignItems: 'center',
  },
  highScoreLabel: {
    fontSize: 14,
    color: '#ffd700',
    marginBottom: 5,
  },
  highScoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffd700',
  },

  // Difficulty Selection
  difficultyContainer: {
    width: '100%',
    marginBottom: 30,
  },
  difficultyLabel: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  difficultyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#16213e',
  },
  difficultyButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  difficultyButtonText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  difficultyButtonTextActive: {
    color: '#4CAF50',
  },

  playButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 30,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  howToPlay: {
    alignItems: 'center',
    padding: 20,
  },
  howToPlayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 12,
  },
  howToPlayText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },

  // Game Styles
  gameContainer: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#87CEEB',
  },
  platform: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movingPlatform: {
    backgroundColor: '#FF9800',
  },
  movingIndicator: {
    position: 'absolute',
  },
  movingArrow: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  player: {
    position: 'absolute',
    backgroundColor: '#FF6B6B',
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
  playerEye: {
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
    marginRight: 4,
  },
  playerEyeRight: {
    marginRight: 0,
    marginLeft: 0,
  },
  scoreDisplay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  difficultyBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  // Control Buttons
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
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  controlButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    transform: [{ scale: 0.95 }],
  },
  leftButton: {},
  rightButton: {},
  controlButtonText: {
    fontSize: 36,
    color: '#333',
  },

  // Game Over Styles
  gameOverTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FF6B6B',
    marginBottom: 20,
  },
  newHighScoreBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  newHighScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  finalScoreContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  finalScoreLabel: {
    fontSize: 18,
    color: '#888',
    marginBottom: 5,
  },
  finalScoreValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#fff',
  },
  difficultyPlayedText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
  },
  bestScoreText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
  },
  menuButtonSecondary: {
    backgroundColor: '#16213e',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  menuButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

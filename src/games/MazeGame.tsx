import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import {
  COLORS,
  MAZE_PADDING,
  CELL_TYPES,
  MAZE_WIDTH,
} from "./maze/utils/Constants";
import { generateMaze, findStart } from "./maze/utils/MazeGenerator";
import {
  getMazeProgress,
  saveLevelResult,
  formatTime,
  MazeProgress,
} from "./maze/utils/Storage";

type GameState = "MENU" | "PLAYING" | "GAME_OVER";
type Difficulty = "easy" | "medium" | "hard";
type ControlType = "swipe" | "buttons";

const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", threeStarTime: 30, twoStarTime: 60 },
  medium: { label: "Medium", threeStarTime: 45, twoStarTime: 90 },
  hard: { label: "Hard", threeStarTime: 60, twoStarTime: 120 },
};

interface MazeGameProps {
  onGameComplete?: (result: { gameId: string; score: number; stars: number }) => void;
  onGoHome?: () => void;
}

export default function MazeGame({ onGameComplete, onGoHome }: MazeGameProps) {
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [controlType, setControlType] = useState<ControlType>("swipe");
  const [maze, setMaze] = useState<number[][] | null>(null);
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  const [time, setTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [progress, setProgress] = useState<MazeProgress | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [stars, setStars] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const playerPosRef = useRef({ row: 0, col: 0 });
  const mazeRef = useRef<number[][] | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => { loadProgress(); }, []);

  const loadProgress = async () => {
    const savedProgress = await getMazeProgress();
    setProgress(savedProgress);
  };

  const startGame = useCallback(() => {
    const newMaze = generateMaze(difficulty);
    const start = findStart(newMaze);

    setMaze(newMaze);
    mazeRef.current = newMaze;
    setPlayerPos(start);
    playerPosRef.current = start;
    setTime(0);
    setMoves(0);
    setIsNewBest(false);
    setStars(0);
    setGameState("PLAYING");
    isPlayingRef.current = true;
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (isPlayingRef.current) {
        setTime((Date.now() - startTimeRef.current) / 1000);
      }
    }, 100);
  }, [difficulty]);

  const endGame = useCallback(async () => {
    isPlayingRef.current = false;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const finalTime = (Date.now() - startTimeRef.current) / 1000;
    const config = DIFFICULTY_CONFIG[difficulty];
    const earnedStars = finalTime <= config.threeStarTime ? 3 : finalTime <= config.twoStarTime ? 2 : 1;

    const { isNewBest: newBest } = await saveLevelResult(1, finalTime, earnedStars);
    setIsNewBest(newBest);
    setTime(finalTime);
    setStars(earnedStars);
    setGameState("GAME_OVER");
    await loadProgress();
    onGameComplete?.({ gameId: 'maze', score: earnedStars, stars: earnedStars });
  }, [difficulty, onGameComplete]);

  const quitToMenu = () => {
    isPlayingRef.current = false;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setGameState("MENU");
    setMaze(null);
    mazeRef.current = null;
    loadProgress();
  };

  const movePlayer = useCallback((direction: "up" | "down" | "left" | "right") => {
    const currentMaze = mazeRef.current;
    if (!currentMaze || !isPlayingRef.current) return false;

    const { row, col } = playerPosRef.current;
    let newRow = row, newCol = col;

    switch (direction) {
      case "up": newRow = row - 1; break;
      case "down": newRow = row + 1; break;
      case "left": newCol = col - 1; break;
      case "right": newCol = col + 1; break;
    }

    if (newRow < 0 || newRow >= currentMaze.length || newCol < 0 || newCol >= currentMaze[0].length) return false;
    if (currentMaze[newRow][newCol] === CELL_TYPES.WALL) return false;

    playerPosRef.current = { row: newRow, col: newCol };
    setPlayerPos({ row: newRow, col: newCol });
    setMoves((m) => m + 1);

    if (currentMaze[newRow][newCol] === CELL_TYPES.EXIT) endGame();
    return true;
  }, [endGame]);

  const lastSwipeRef = useRef({ x: 0, y: 0 });
  const swipeThreshold = 30;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { lastSwipeRef.current = { x: 0, y: 0 }; },
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { dx, dy } = gestureState;
        const deltaX = dx - lastSwipeRef.current.x;
        const deltaY = dy - lastSwipeRef.current.y;
        if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) movePlayer(deltaX > 0 ? "right" : "left");
          else movePlayer(deltaY > 0 ? "down" : "up");
          lastSwipeRef.current = { x: dx, y: dy };
        }
      },
    }),
  ).current;

  const cellSize = maze ? MAZE_WIDTH / maze[0].length : 0;

  const renderMaze = () => {
    if (!maze) return null;
    return (
      <View style={[styles.mazeContainer, { width: MAZE_WIDTH, height: MAZE_WIDTH }]}>
        <View style={[styles.mazeGrid, { width: MAZE_WIDTH }]}>
          {maze.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.mazeRow}>
              {row.map((cell, colIndex) => {
                const isPlayer = playerPos.row === rowIndex && playerPos.col === colIndex;
                const isStart = cell === CELL_TYPES.START;
                const isExit = cell === CELL_TYPES.EXIT;
                const isWall = cell === CELL_TYPES.WALL;
                return (
                  <View
                    key={colIndex}
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize, backgroundColor: isWall ? COLORS.wall : COLORS.mazeBg },
                    ]}
                  >
                    {isStart && !isPlayer && <Text style={[styles.cellIcon, { fontSize: cellSize * 0.6 }]}></Text>}
                    {isExit && !isPlayer && <Text style={[styles.cellIcon, { fontSize: cellSize * 0.6 }]}>🍎</Text>}
                    {isPlayer && <Text style={[styles.cellIcon, { fontSize: cellSize * 0.6 }]}>🐭</Text>}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // MENU
  if (gameState === "MENU") {
    return (
      <View style={styles.container}>
        {onGoHome && (
          <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.8}>
            <Text style={styles.homeBtnText}>← Home</Text>
          </TouchableOpacity>
        )}
        <View style={styles.menuContent}>
          <Text style={styles.title}>Maze Runner</Text>
          <Text style={styles.subtitle}>
            {controlType === "swipe" ? "Swipe to navigate" : "Use buttons to navigate"}
          </Text>

          {progress?.bestTimes[1] && (
            <View style={styles.bestTimeCard}>
              <Text style={styles.bestTimeLabel}>Best Time</Text>
              <Text style={styles.bestTimeValue}>{formatTime(progress.bestTimes[1])}</Text>
            </View>
          )}

          <View style={styles.selectorBlock}>
            <Text style={styles.selectorLabel}>Difficulty</Text>
            <View style={styles.selectorRow}>
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.selectorBtn, difficulty === d && styles.selectorBtnActive]}
                  onPress={() => setDifficulty(d)}
                >
                  <Text style={[styles.selectorBtnText, difficulty === d && styles.selectorBtnTextActive]}>
                    {DIFFICULTY_CONFIG[d].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.selectorBlock}>
            <Text style={styles.selectorLabel}>Controls</Text>
            <View style={styles.selectorRow}>
              {(["swipe", "buttons"] as ControlType[]).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.selectorBtn, controlType === c && styles.selectorBtnActive]}
                  onPress={() => setControlType(c)}
                >
                  <Text style={[styles.selectorBtnText, controlType === c && styles.selectorBtnTextActive]}>
                    {c === "swipe" ? "Swipe" : "Buttons"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.85}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>

          <View style={styles.instructionRow}>
            <Text style={styles.instructionText}>🟢 Start → 🍎 Exit</Text>
          </View>
        </View>
      </View>
    );
  }

  // D-Pad
  const renderDPad = () => (
    <View style={styles.dpadContainer}>
      <TouchableOpacity style={[styles.dpadButton, styles.dpadUp]} onPress={() => movePlayer("up")} activeOpacity={0.7}>
        <Text style={styles.dpadArrow}>▲</Text>
      </TouchableOpacity>
      <View style={styles.dpadMiddleRow}>
        <TouchableOpacity style={[styles.dpadButton, styles.dpadLeft]} onPress={() => movePlayer("left")} activeOpacity={0.7}>
          <Text style={styles.dpadArrow}>◀</Text>
        </TouchableOpacity>
        <View style={styles.dpadCenter} />
        <TouchableOpacity style={[styles.dpadButton, styles.dpadRight]} onPress={() => movePlayer("right")} activeOpacity={0.7}>
          <Text style={styles.dpadArrow}>▶</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.dpadButton, styles.dpadDown]} onPress={() => movePlayer("down")} activeOpacity={0.7}>
        <Text style={styles.dpadArrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  // PLAYING
  if (gameState === "PLAYING" && maze) {
    const gameContent = (
      <>
        <View style={styles.header}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Moves</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerText}>{formatTime(time)}</Text>
          </View>
          <TouchableOpacity style={styles.quitButton} onPress={quitToMenu} activeOpacity={0.8}>
            <Text style={styles.quitText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mazeWrapper}>{renderMaze()}</View>
        {controlType === "swipe" ? (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>👆 Swipe anywhere to move</Text>
          </View>
        ) : renderDPad()}
      </>
    );

    if (controlType === "swipe") {
      return <View style={styles.container} {...panResponder.panHandlers}>{gameContent}</View>;
    }
    return <View style={styles.container}>{gameContent}</View>;
  }

  // GAME OVER
  if (gameState === "GAME_OVER") {
    return (
      <View style={styles.container}>
        {onGoHome && (
          <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.8}>
            <Text style={styles.homeBtnText}>← Home</Text>
          </TouchableOpacity>
        )}
        <View style={styles.gameOverContent}>
          <Text style={styles.completeTitle}>🎉 Complete!</Text>
          {isNewBest && <Text style={styles.newBestText}>✨ New Best Time!</Text>}

          <View style={styles.starsRow}>
            {[1, 2, 3].map((i) => (
              <Text key={i} style={[styles.starIcon, i <= stars && styles.starIconFilled]}>★</Text>
            ))}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Time</Text>
              <Text style={styles.statItemValue}>{formatTime(time)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Moves</Text>
              <Text style={styles.statItemValue}>{moves}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.85}>
            <Text style={styles.startButtonText}>New Maze</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={quitToMenu}>
            <Text style={styles.secondaryBtnText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
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
    padding: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 28 },
  bestTimeCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bestTimeLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  bestTimeValue: { fontSize: 28, fontWeight: '800', color: '#16A34A' },
  selectorBlock: { width: '100%', marginBottom: 20 },
  selectorLabel: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 10, fontWeight: '500' },
  selectorRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  selectorBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: '#F0F2F8',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectorBtnActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  selectorBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  selectorBtnTextActive: { color: '#4F46E5' },
  startButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    paddingHorizontal: 48,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  instructionRow: { alignItems: 'center', marginTop: 4 },
  instructionText: { fontSize: 14, color: '#9CA3AF' },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: '#F0F2F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  // PLAYING styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MAZE_PADDING,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statBox: { alignItems: 'center', minWidth: 60 },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  timerBox: {
    backgroundColor: '#F0F2F8',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timerText: { fontSize: 20, fontWeight: '800', color: '#111827' },
  quitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitText: { fontSize: 16, color: '#DC2626', fontWeight: '700' },
  mazeWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mazeContainer: {
    backgroundColor: COLORS.mazeBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  mazeGrid: { overflow: 'hidden' },
  mazeRow: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center' },
  cellIcon: { textAlign: 'center' },
  swipeHint: { paddingVertical: 20, alignItems: 'center' },
  swipeHintText: { fontSize: 14, color: '#9CA3AF' },

  // D-Pad
  dpadContainer: { alignItems: 'center', paddingVertical: 16, paddingBottom: 32 },
  dpadButton: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dpadUp: { marginBottom: 4 },
  dpadDown: { marginTop: 4 },
  dpadLeft: { marginRight: 4 },
  dpadRight: { marginLeft: 4 },
  dpadMiddleRow: { flexDirection: 'row', alignItems: 'center' },
  dpadCenter: { width: 60, height: 60 },
  dpadArrow: { fontSize: 22, color: '#4F46E5', fontWeight: '700' },

  // GAME OVER
  gameOverContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  completeTitle: { fontSize: 36, fontWeight: '800', color: '#16A34A', marginBottom: 12 },
  newBestText: { fontSize: 16, color: '#D97706', fontWeight: '700', marginBottom: 16 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  starIcon: { fontSize: 40, color: '#E5E7EB' },
  starIconFilled: { color: '#D97706' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statItemLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 4, fontWeight: '500' },
  statItemValue: { fontSize: 26, fontWeight: '800', color: '#111827' },
});

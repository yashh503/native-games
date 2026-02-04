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

export default function MazeGame() {
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [controlType, setControlType] = useState<ControlType>("swipe");
  const [maze, setMaze] = useState<number[][] | null>(null);
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  const [time, setTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [progress, setProgress] = useState<MazeProgress | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const playerPosRef = useRef({ row: 0, col: 0 });
  const mazeRef = useRef<number[][] | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    loadProgress();
  }, []);

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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const finalTime = (Date.now() - startTimeRef.current) / 1000;
    const config = DIFFICULTY_CONFIG[difficulty];
    const stars =
      finalTime <= config.threeStarTime
        ? 3
        : finalTime <= config.twoStarTime
          ? 2
          : 1;

    const { isNewBest: newBest } = await saveLevelResult(1, finalTime, stars);
    setIsNewBest(newBest);
    setTime(finalTime);
    setGameState("GAME_OVER");
    await loadProgress();
  }, [difficulty]);

  const quitToMenu = () => {
    isPlayingRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGameState("MENU");
    setMaze(null);
    mazeRef.current = null;
    loadProgress();
  };

  const movePlayer = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      const currentMaze = mazeRef.current;
      if (!currentMaze || !isPlayingRef.current) return false;

      const { row, col } = playerPosRef.current;
      let newRow = row;
      let newCol = col;

      switch (direction) {
        case "up":
          newRow = row - 1;
          break;
        case "down":
          newRow = row + 1;
          break;
        case "left":
          newCol = col - 1;
          break;
        case "right":
          newCol = col + 1;
          break;
      }

      if (
        newRow < 0 ||
        newRow >= currentMaze.length ||
        newCol < 0 ||
        newCol >= currentMaze[0].length
      ) {
        return false;
      }

      if (currentMaze[newRow][newCol] === CELL_TYPES.WALL) {
        return false;
      }

      playerPosRef.current = { row: newRow, col: newCol };
      setPlayerPos({ row: newRow, col: newCol });
      setMoves((m) => m + 1);

      if (currentMaze[newRow][newCol] === CELL_TYPES.EXIT) {
        endGame();
      }

      return true;
    },
    [endGame],
  );

  // Pan responder for swipe detection
  const lastSwipeRef = useRef({ x: 0, y: 0 });
  const swipeThreshold = 30;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastSwipeRef.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        const { dx, dy } = gestureState;
        const deltaX = dx - lastSwipeRef.current.x;
        const deltaY = dy - lastSwipeRef.current.y;

        if (
          Math.abs(deltaX) > swipeThreshold ||
          Math.abs(deltaY) > swipeThreshold
        ) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            movePlayer(deltaX > 0 ? "right" : "left");
          } else {
            movePlayer(deltaY > 0 ? "down" : "up");
          }
          lastSwipeRef.current = { x: dx, y: dy };
        }
      },
    }),
  ).current;

  const cellSize = maze ? MAZE_WIDTH / maze[0].length : 0;

  // Render maze grid
  const renderMaze = () => {
    if (!maze) return null;

    return (
      <View
        style={[
          styles.mazeContainer,
          { width: MAZE_WIDTH, height: MAZE_WIDTH },
        ]}
      >
        <View style={[styles.mazeGrid, { width: MAZE_WIDTH }]}>
          {maze.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.mazeRow}>
              {row.map((cell, colIndex) => {
                const isPlayer =
                  playerPos.row === rowIndex && playerPos.col === colIndex;
                const isStart = cell === CELL_TYPES.START;
                const isExit = cell === CELL_TYPES.EXIT;
                const isWall = cell === CELL_TYPES.WALL;

                return (
                  <View
                    key={colIndex}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: isWall ? COLORS.wall : COLORS.mazeBg,
                      },
                    ]}
                  >
                    {/* Start marker */}
                    {isStart && !isPlayer && (
                      <Text
                        style={[styles.cellIcon, { fontSize: cellSize * 0.6 }]}
                      ></Text>
                    )}

                    {/* Exit marker */}
                    {isExit && !isPlayer && (
                      <Text
                        style={[styles.cellIcon, { fontSize: cellSize * 0.6 }]}
                      >
                        🍎
                      </Text>
                    )}

                    {/* Player */}
                    {isPlayer && (
                      <Text
                        style={[styles.cellIcon, { fontSize: cellSize * 0.6 }]}
                      >
                        🐭
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // MENU Screen
  if (gameState === "MENU") {
    return (
      <View style={styles.container}>
        <View style={styles.menuContent}>
          <Text style={styles.title}>Maze Runner</Text>
          <Text style={styles.subtitle}>
            {controlType === "swipe"
              ? "Swipe to navigate"
              : "Use buttons to navigate"}
          </Text>

          {progress?.bestTimes[1] && (
            <View style={styles.bestTimeContainer}>
              <Text style={styles.bestTimeLabel}>Best Time</Text>
              <Text style={styles.bestTimeValue}>
                {formatTime(progress.bestTimes[1])}
              </Text>
            </View>
          )}

          <View style={styles.difficultyContainer}>
            <Text style={styles.difficultyLabel}>Difficulty</Text>
            <View style={styles.difficultyButtons}>
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
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

          <View style={styles.difficultyContainer}>
            <Text style={styles.difficultyLabel}>Controls</Text>
            <View style={styles.difficultyButtons}>
              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  controlType === "swipe" && styles.difficultyButtonActive,
                ]}
                onPress={() => setControlType("swipe")}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    controlType === "swipe" &&
                      styles.difficultyButtonTextActive,
                  ]}
                >
                  Swipe
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  controlType === "buttons" && styles.difficultyButtonActive,
                ]}
                onPress={() => setControlType("buttons")}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    controlType === "buttons" &&
                      styles.difficultyButtonTextActive,
                  ]}
                >
                  Buttons
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>

          <View style={styles.instructions}>
            <Text style={styles.instructionText}>🟢 Start → 🔴 Exit</Text>
            <Text style={styles.instructionText}>
              {controlType === "swipe"
                ? "👆 Swipe to move"
                : "🎮 Use D-Pad to move"}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // D-Pad Component for button controls
  const renderDPad = () => (
    <View style={styles.dpadContainer}>
      <TouchableOpacity
        style={[styles.dpadButton, styles.dpadUp]}
        onPress={() => movePlayer("up")}
        activeOpacity={0.7}
      >
        <Text style={styles.dpadArrow}>▲</Text>
      </TouchableOpacity>
      <View style={styles.dpadMiddleRow}>
        <TouchableOpacity
          style={[styles.dpadButton, styles.dpadLeft]}
          onPress={() => movePlayer("left")}
          activeOpacity={0.7}
        >
          <Text style={styles.dpadArrow}>◀</Text>
        </TouchableOpacity>
        <View style={styles.dpadCenter} />
        <TouchableOpacity
          style={[styles.dpadButton, styles.dpadRight]}
          onPress={() => movePlayer("right")}
          activeOpacity={0.7}
        >
          <Text style={styles.dpadArrow}>▶</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.dpadButton, styles.dpadDown]}
        onPress={() => movePlayer("down")}
        activeOpacity={0.7}
      >
        <Text style={styles.dpadArrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  // PLAYING Screen
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
          <TouchableOpacity style={styles.quitButton} onPress={quitToMenu}>
            <Text style={styles.quitText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mazeWrapper}>{renderMaze()}</View>

        {controlType === "swipe" ? (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>👆 Swipe anywhere to move</Text>
          </View>
        ) : (
          renderDPad()
        )}
      </>
    );

    // Wrap with pan responder only if swipe controls
    if (controlType === "swipe") {
      return (
        <View style={styles.container} {...panResponder.panHandlers}>
          {gameContent}
        </View>
      );
    }

    return <View style={styles.container}>{gameContent}</View>;
  }

  // GAME_OVER Screen
  if (gameState === "GAME_OVER") {
    return (
      <View style={styles.container}>
        <View style={styles.gameOverContent}>
          <Text style={styles.completeTitle}>🎉 Complete!</Text>

          {isNewBest && <Text style={styles.newBestText}>New Best Time!</Text>}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Time</Text>
              <Text style={styles.statItemValue}>{formatTime(time)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Moves</Text>
              <Text style={styles.statItemValue}>{moves}</Text>
            </View>
          </View>

          <View style={styles.gameOverButtons}>
            <TouchableOpacity style={styles.menuButton} onPress={startGame}>
              <Text style={styles.menuButtonText}>New Maze</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButtonSecondary}
              onPress={quitToMenu}
            >
              <Text style={styles.menuButtonSecondaryText}>Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  menuContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 32,
  },
  bestTimeContainer: {
    backgroundColor: "rgba(0,184,148,0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
    alignItems: "center",
  },
  bestTimeLabel: {
    fontSize: 12,
    color: "#00b894",
    marginBottom: 4,
  },
  bestTimeValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#00b894",
  },
  difficultyContainer: {
    width: "100%",
    marginBottom: 32,
  },
  difficultyLabel: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 12,
  },
  difficultyButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  difficultyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#16213e",
    borderWidth: 2,
    borderColor: "#16213e",
  },
  difficultyButtonActive: {
    borderColor: "#00b894",
    backgroundColor: "rgba(0,184,148,0.1)",
  },
  difficultyButtonText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
  },
  difficultyButtonTextActive: {
    color: "#00b894",
  },
  startButton: {
    backgroundColor: "#00b894",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 32,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  instructions: {
    alignItems: "center",
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: MAZE_PADDING,
    paddingTop: 50,
    paddingBottom: 12,
  },
  statBox: {
    alignItems: "center",
    minWidth: 60,
  },
  statLabel: {
    fontSize: 10,
    color: "#888",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  timerBox: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  timerText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  quitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  quitText: {
    fontSize: 18,
    color: COLORS.text,
  },
  mazeWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mazeContainer: {
    backgroundColor: COLORS.mazeBg,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.wall,
    overflow: "hidden",
  },
  mazeGrid: {
    overflow: "hidden",
  },
  mazeRow: {
    flexDirection: "row",
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
  },
  cellIcon: {
    textAlign: "center",
  },
  player: {
    backgroundColor: COLORS.player,
  },
  swipeHint: {
    paddingVertical: 24,
    alignItems: "center",
  },
  swipeHintText: {
    fontSize: 16,
    color: "#888",
  },
  gameOverContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  completeTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "#00b894",
    marginBottom: 16,
  },
  newBestText: {
    fontSize: 18,
    color: "#f1c40f",
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 40,
  },
  statItem: {
    alignItems: "center",
    backgroundColor: "#16213e",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  statItemLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  gameOverButtons: {
    width: "100%",
    gap: 12,
  },
  menuButton: {
    backgroundColor: "#00b894",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  menuButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  menuButtonSecondary: {
    backgroundColor: "#16213e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  menuButtonSecondaryText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
  },
  dpadContainer: {
    alignItems: "center",
    paddingVertical: 16,
    paddingBottom: 32,
  },
  dpadButton: {
    width: 60,
    height: 60,
    backgroundColor: "#16213e",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#00b894",
  },
  dpadUp: {
    marginBottom: 4,
  },
  dpadDown: {
    marginTop: 4,
  },
  dpadLeft: {
    marginRight: 4,
  },
  dpadRight: {
    marginLeft: 4,
  },
  dpadMiddleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dpadCenter: {
    width: 60,
    height: 60,
  },
  dpadArrow: {
    fontSize: 24,
    color: "#00b894",
  },
});

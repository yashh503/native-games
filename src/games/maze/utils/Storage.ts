import AsyncStorage from '@react-native-async-storage/async-storage';

const MAZE_PROGRESS_KEY = 'maze_progress';
const MAZE_BEST_TIMES_KEY = 'maze_best_times';

export interface MazeProgress {
  unlockedLevels: number[];
  bestTimes: { [levelId: number]: number };
  stars: { [levelId: number]: number };
}

const defaultProgress: MazeProgress = {
  unlockedLevels: [1],
  bestTimes: {},
  stars: {},
};

export const getMazeProgress = async (): Promise<MazeProgress> => {
  try {
    const data = await AsyncStorage.getItem(MAZE_PROGRESS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return defaultProgress;
  } catch {
    return defaultProgress;
  }
};

export const saveMazeProgress = async (progress: MazeProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(MAZE_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Silently fail
  }
};

export const unlockLevel = async (levelId: number): Promise<void> => {
  const progress = await getMazeProgress();
  if (!progress.unlockedLevels.includes(levelId)) {
    progress.unlockedLevels.push(levelId);
    await saveMazeProgress(progress);
  }
};

export const saveLevelResult = async (
  levelId: number,
  time: number,
  stars: number
): Promise<{ isNewBest: boolean; previousBest: number | null }> => {
  const progress = await getMazeProgress();
  const previousBest = progress.bestTimes[levelId] || null;
  const isNewBest = previousBest === null || time < previousBest;

  if (isNewBest) {
    progress.bestTimes[levelId] = time;
  }

  if (!progress.stars[levelId] || stars > progress.stars[levelId]) {
    progress.stars[levelId] = stars;
  }

  // Unlock next level
  const nextLevel = levelId + 1;
  if (!progress.unlockedLevels.includes(nextLevel) && nextLevel <= 5) {
    progress.unlockedLevels.push(nextLevel);
  }

  await saveMazeProgress(progress);
  return { isNewBest, previousBest };
};

export const calculateStars = (
  time: number,
  threeStarTime: number,
  twoStarTime: number
): number => {
  if (time <= threeStarTime) return 3;
  if (time <= twoStarTime) return 2;
  return 1;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const resetMazeProgress = async (): Promise<void> => {
  await AsyncStorage.removeItem(MAZE_PROGRESS_KEY);
};

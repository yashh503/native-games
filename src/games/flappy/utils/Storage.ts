import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = 'flappy_high_score';

export const getHighScore = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    return value ? parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
};

export const setHighScore = async (score: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString());
  } catch {
    // Silently fail
  }
};

export const updateHighScoreIfNeeded = async (score: number): Promise<number> => {
  const currentHigh = await getHighScore();
  if (score > currentHigh) {
    await setHighScore(score);
    return score;
  }
  return currentHigh;
};

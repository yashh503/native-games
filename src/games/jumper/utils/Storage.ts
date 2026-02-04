import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = '@jumper_high_score';

export async function getHighScore(): Promise<number> {
  try {
    const score = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    return score ? parseInt(score, 10) : 0;
  } catch {
    return 0;
  }
}

export async function saveHighScore(score: number): Promise<boolean> {
  try {
    const currentHigh = await getHighScore();
    if (score > currentHigh) {
      await AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString());
      return true; // New high score
    }
    return false;
  } catch {
    return false;
  }
}

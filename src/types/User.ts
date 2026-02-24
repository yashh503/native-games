export interface UserState {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // 'YYYY-MM-DD'
  gamesCompletedToday: number;
  streakFreezeAvailable: boolean;
  lastStreakFreezeUsed: string | null; // ISO week 'YYYY-Www'
  totalGamesPlayed: number;
  badges: string[];
}

export type GameId = 'flappy' | 'maze' | 'jumper';

export interface GameCompletePayload {
  gameId: GameId;
  score: number;
  stars?: number;
}

export type UserAction =
  | { type: 'LOAD_STATE'; payload: UserState }
  | { type: 'CHECK_AND_UPDATE_STREAK' }
  | { type: 'COMPLETE_GAME'; payload: GameCompletePayload }
  | { type: 'USE_STREAK_FREEZE' }
  | { type: 'RESET' };

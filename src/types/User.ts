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
  coins: number;                 // virtual currency
  weeklyPlaysRemaining: number;  // 5 at week start, decrements per play
  currentWeekId: string;         // YYYY-Www — resets weeklyPlaysRemaining on new week
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
  | { type: 'ADD_BONUS_POINTS'; payload: { points: number } }
  | { type: 'USE_STREAK_FREEZE' }
  | { type: 'ADD_COINS'; payload: { amount: number } }
  | { type: 'SPEND_COINS'; payload: { amount: number } }
  | { type: 'RESET' };

export type GameType = 'flappy' | 'maze' | 'jumper';

export interface GameResult {
  id: string;
  gameType: GameType;
  score: number;
  duration: number; // in seconds
  completedAt: string; // ISO date string
  metadata?: Record<string, unknown>; // game-specific data
}

export interface CreateGameResultDTO {
  gameType: GameType;
  score: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

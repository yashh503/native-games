import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameResult, CreateGameResultDTO, GameType } from '../types/GameResult';

const STORAGE_KEY = 'game_results';

// Abstract interface for future backend integration
interface IGameResultService {
  save(dto: CreateGameResultDTO): Promise<GameResult>;
  getAll(): Promise<GameResult[]>;
  getByGameType(gameType: GameType): Promise<GameResult[]>;
  getHighScore(gameType: GameType): Promise<number>;
  clear(): Promise<void>;
}

class GameResultService implements IGameResultService {
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async save(dto: CreateGameResultDTO): Promise<GameResult> {
    const result: GameResult = {
      id: this.generateId(),
      gameType: dto.gameType,
      score: dto.score,
      duration: dto.duration,
      completedAt: new Date().toISOString(),
      metadata: dto.metadata,
    };

    const existing = await this.getAll();
    existing.push(result);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    return result;
  }

  async getAll(): Promise<GameResult[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  async getByGameType(gameType: GameType): Promise<GameResult[]> {
    const all = await this.getAll();
    return all.filter((r) => r.gameType === gameType);
  }

  async getHighScore(gameType: GameType): Promise<number> {
    const results = await this.getByGameType(gameType);
    if (results.length === 0) return 0;
    return Math.max(...results.map((r) => r.score));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export const gameResultService = new GameResultService();

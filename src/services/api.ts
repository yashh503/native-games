// In dev: point to your local machine. In production: your deployed backend URL.
const BASE_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://your-production-url.com'; // TODO: replace with real URL before shipping

// --- HTTP helper ---

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit,
  timeoutMs: number = 8000
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });

    if (!response.ok) {
      console.warn(`[API] ${options.method ?? 'GET'} ${url} → ${response.status}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.warn('[API] Network error:', (err as Error).message);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// --- Ad Config types (shared with useAdConfig) ---

export interface AdConfigData {
  version: string;
  globalKillSwitch: boolean;
  banner: {
    adUnitId: string;
    enabled: boolean;
    provider: string;
    size: string;
    position: string;
    refreshIntervalSeconds: number;
  };
  interstitial: {
    adUnitId: string;
    enabled: boolean;
    provider: string;
    frequencyGames: number;
    cooldownSeconds: number;
    suppressOnStreakIncrement: boolean;
  };
  rewarded: {
    adUnitId: string;
    enabled: boolean;
    provider: string;
    rewardMultiplier: number;
    rewardLabel: string;
  };
}

/**
 * Fetch dynamic ad configuration from the backend. No auth needed.
 */
export async function fetchAdConfig(): Promise<{ config: AdConfigData } | null> {
  return fetchWithTimeout<{ config: AdConfigData }>(`${BASE_URL}/ads/config`, {
    method: 'GET',
  });
}

// --- User profile ---

export interface ServerGameProfile {
  coins: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  gamesCompletedToday: number;
  streakFreezeAvailable: boolean;
  lastStreakFreezeUsed: string | null;
  totalGamesPlayed: number;
  badges: string[];
  weeklyPlaysRemaining: number;
  currentWeekId: string;
}

export interface UserProfileResponse {
  user: {
    userId: string;
    email: string;
    displayName: string;
  } & Partial<ServerGameProfile>;
}

/**
 * Fetch the authenticated user's full profile + game stats.
 * Returns null on network failure (caller should fall back to cached state).
 */
export async function fetchUserProfile(
  accessToken: string
): Promise<UserProfileResponse | null> {
  return fetchWithTimeout<UserProfileResponse>(`${BASE_URL}/users/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// --- Game completion ---

export interface GameCompleteResponse {
  ok: boolean;
  pointsEarned: number;
  streakJustIncremented: boolean;
  profile: ServerGameProfile;
}

/**
 * Report a game completion. Server updates streak, points, coins, badges.
 * Returns updated profile so client can sync state.
 */
export async function postGameComplete(
  gameId: string,
  score: number,
  accessToken: string,
  stars?: number
): Promise<GameCompleteResponse | null> {
  return fetchWithTimeout<GameCompleteResponse>(`${BASE_URL}/users/game-complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ gameId, score, stars }),
  });
}

// --- Leaderboard ---

export interface SubmitScoreResponse {
  accepted: boolean;
  isNewBest: boolean;
}

/**
 * Submit a game score to the leaderboard.
 */
export async function submitScore(
  weekId: string,
  gameId: string,
  score: number,
  accessToken: string
): Promise<SubmitScoreResponse | null> {
  return fetchWithTimeout<SubmitScoreResponse>(`${BASE_URL}/leaderboard/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ weekId, gameId, score }),
  });
}

/**
 * Fetch current week's schedule.
 */
export async function fetchSchedule(
  accessToken: string
): Promise<{ weekId: string; slots: { slotIndex: number; gameId: string }[] } | null> {
  return fetchWithTimeout(`${BASE_URL}/schedule/current`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Fetch leaderboard for a given week.
 */
export async function fetchLeaderboard(
  weekId: string,
  accessToken: string
): Promise<{ weekId: string; entries: unknown[] } | null> {
  return fetchWithTimeout(`${BASE_URL}/leaderboard/${weekId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

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

// --- Auth-gated API helpers ---

/**
 * Log a game completion event for analytics. Fire-and-forget.
 */
export function postGameComplete(
  gameId: string,
  score: number,
  accessToken: string,
  stars?: number
): void {
  // No await — analytics only, failures are acceptable
  fetchWithTimeout(`${BASE_URL}/users/game-complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ gameId, score, stars }),
  });
}

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

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { saveRefreshToken, getRefreshToken, clearRefreshToken } from '../services/authStorage';
import { fetchUserProfile, ServerGameProfile } from '../services/api';

const BASE_URL = __DEV__ ? 'http://localhost:3001' : 'https://your-production-url.com';

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  gameProfile: ServerGameProfile | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: (googleId: string, email: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshGameProfile: () => Promise<void>;
  setGameProfile: (profile: ServerGameProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as T;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

async function loadGameProfile(accessToken: string): Promise<ServerGameProfile | null> {
  const res = await fetchUserProfile(accessToken);
  if (!res?.user) return null;
  const { userId: _u, email: _e, displayName: _d, ...profile } = res.user;
  return {
    coins: profile.coins ?? 3,
    totalPoints: profile.totalPoints ?? 0,
    currentStreak: profile.currentStreak ?? 0,
    longestStreak: profile.longestStreak ?? 0,
    lastActiveDate: profile.lastActiveDate ?? null,
    gamesCompletedToday: profile.gamesCompletedToday ?? 0,
    streakFreezeAvailable: profile.streakFreezeAvailable ?? true,
    lastStreakFreezeUsed: profile.lastStreakFreezeUsed ?? null,
    totalGamesPlayed: profile.totalGamesPlayed ?? 0,
    badges: profile.badges ?? [],
    weeklyPlaysRemaining: profile.weeklyPlaysRemaining ?? 5,
    currentWeekId: profile.currentWeekId ?? '',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    gameProfile: null,
    isLoading: true,
  });

  // On mount: try to restore session from stored refresh token
  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await getRefreshToken();
        if (!stored) {
          setState((s) => ({ ...s, isLoading: false }));
          return;
        }
        const data = await apiPost<AuthResponse>('/auth/refresh', { refreshToken: stored });
        await saveRefreshToken(data.refreshToken);
        const gameProfile = await loadGameProfile(data.accessToken);
        setState({ user: data.user, accessToken: data.accessToken, gameProfile, isLoading: false });
      } catch {
        await clearRefreshToken();
        setState({ user: null, accessToken: null, gameProfile: null, isLoading: false });
      }
    }
    restoreSession();
  }, []);

  const storeSession = async (data: AuthResponse) => {
    await saveRefreshToken(data.refreshToken);
    const gameProfile = await loadGameProfile(data.accessToken);
    setState({ user: data.user, accessToken: data.accessToken, gameProfile, isLoading: false });
  };

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<AuthResponse>('/auth/login', { email, password });
    await storeSession(data);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const data = await apiPost<AuthResponse>('/auth/register', { email, password, displayName });
    await storeSession(data);
  }, []);

  const loginWithGoogle = useCallback(async (googleId: string, email: string, displayName: string) => {
    const data = await apiPost<AuthResponse>('/auth/google', { googleId, email, displayName });
    await storeSession(data);
  }, []);

  const logout = useCallback(async () => {
    const stored = await getRefreshToken();
    if (stored) {
      await apiPost('/auth/logout', { refreshToken: stored }).catch(() => {});
    }
    await clearRefreshToken();
    setState({ user: null, accessToken: null, gameProfile: null, isLoading: false });
  }, []);

  const refreshGameProfile = useCallback(async () => {
    setState((s) => {
      if (!s.accessToken) return s;
      loadGameProfile(s.accessToken).then((gameProfile) => {
        if (gameProfile) setState((prev) => ({ ...prev, gameProfile }));
      });
      return s;
    });
  }, []);

  const setGameProfile = useCallback((profile: ServerGameProfile) => {
    setState((s) => ({ ...s, gameProfile: profile }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginWithGoogle, logout, refreshGameProfile, setGameProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

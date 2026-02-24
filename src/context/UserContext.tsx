import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserState, UserAction, GameCompletePayload } from '../types/User';

const STORAGE_KEY = '@user_state_v1';

const DEFAULT_STATE: UserState = {
  totalPoints: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  gamesCompletedToday: 0,
  streakFreezeAvailable: true,
  lastStreakFreezeUsed: null,
  totalGamesPlayed: 0,
  badges: [],
};

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentISOWeek(): string {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function calcPoints(payload: GameCompletePayload, streak: number): number {
  let base = 0;
  if (payload.gameId === 'flappy') {
    base = 50 + payload.score * 2;
  } else if (payload.gameId === 'maze') {
    base = 80 + (payload.stars ?? 1) * 20;
  } else if (payload.gameId === 'jumper') {
    base = 50 + Math.floor(payload.score / 5);
  }
  const multiplier = streak >= 30 ? 1.5 : streak >= 14 ? 1.2 : streak >= 7 ? 1.1 : 1;
  return Math.round(base * multiplier);
}

function addBadgesForStreak(current: string[], streak: number): string[] {
  const milestones: Array<[number, string]> = [
    [7, 'streak_7'],
    [14, 'streak_14'],
    [30, 'streak_30'],
    [50, 'streak_50'],
  ];
  const updated = [...current];
  for (const [threshold, badge] of milestones) {
    if (streak >= threshold && !updated.includes(badge)) {
      updated.push(badge);
    }
  }
  return updated;
}

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...DEFAULT_STATE, ...action.payload };

    case 'CHECK_AND_UPDATE_STREAK': {
      const today = todayString();
      const yesterday = yesterdayString();

      // Already processed today — nothing to do
      if (state.lastActiveDate === today) return state;

      // Guard: if device clock rolled backwards (lastActiveDate is in the future), do nothing
      if (state.lastActiveDate !== null && state.lastActiveDate > today) return state;

      // First ever open
      if (state.lastActiveDate === null) {
        return { ...state, lastActiveDate: today, gamesCompletedToday: 0 };
      }

      // Came back after completing 2 games yesterday — streak already counted, reset daily counter
      if (state.lastActiveDate === yesterday && state.gamesCompletedToday >= 2) {
        return { ...state, gamesCompletedToday: 0, lastActiveDate: today };
      }

      // Came back next day but hadn't finished 2 games
      if (state.lastActiveDate === yesterday && state.gamesCompletedToday < 2) {
        // Check if freeze should be applied automatically
        if (state.streakFreezeAvailable && state.currentStreak > 0) {
          return {
            ...state,
            gamesCompletedToday: 0,
            lastActiveDate: today,
            streakFreezeAvailable: false,
            lastStreakFreezeUsed: currentISOWeek(),
          };
        }
        // No freeze — streak broken
        return {
          ...state,
          currentStreak: 0,
          gamesCompletedToday: 0,
          lastActiveDate: today,
        };
      }

      // More than 1 day gap — streak broken regardless
      return {
        ...state,
        currentStreak: 0,
        gamesCompletedToday: 0,
        lastActiveDate: today,
      };
    }

    case 'COMPLETE_GAME': {
      const today = todayString();
      const points = calcPoints(action.payload, state.currentStreak);
      const newTotal = state.totalPoints + points;
      const newGamesPlayed = state.totalGamesPlayed + 1;

      // Cap at 2 — prevent accidental double-dispatch from counting extra
      const alreadyCountedToday = state.gamesCompletedToday >= 2;
      const newGamesCompletedToday = alreadyCountedToday
        ? state.gamesCompletedToday
        : state.gamesCompletedToday + 1;

      let newStreak = state.currentStreak;
      let newLongestStreak = state.longestStreak;
      let newBadges = state.badges;
      let newLastActiveDate = state.lastActiveDate;

      // Second game of the day — complete the daily goal and increment streak
      // Guard: only increment if lastActiveDate is NOT today (prevents double-increment on same day)
      if (!alreadyCountedToday && newGamesCompletedToday === 2) {
        if (state.lastActiveDate !== today) {
          newStreak = state.currentStreak + 1;
          newLastActiveDate = today;
          newBadges = addBadgesForStreak(state.badges, newStreak);
          if (newStreak > state.longestStreak) {
            newLongestStreak = newStreak;
          }
        } else {
          // Same day, second game — streak already counted, just update date
          newLastActiveDate = today;
        }
      }

      return {
        ...state,
        totalPoints: newTotal,
        totalGamesPlayed: newGamesPlayed,
        gamesCompletedToday: newGamesCompletedToday,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        badges: newBadges,
        lastActiveDate: newLastActiveDate ?? state.lastActiveDate,
      };
    }

    case 'USE_STREAK_FREEZE': {
      const week = currentISOWeek();
      if (state.lastStreakFreezeUsed === week) return state;
      return {
        ...state,
        streakFreezeAvailable: false,
        lastStreakFreezeUsed: week,
      };
    }

    case 'RESET':
      return { ...DEFAULT_STATE };

    default:
      return state;
  }
}

interface UserContextValue {
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, DEFAULT_STATE);
  const initializedRef = useRef(false);

  // Load persisted state on mount
  useEffect(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: UserState = JSON.parse(raw);
          dispatch({ type: 'LOAD_STATE', payload: parsed });
        }
      } catch {
        // Silently fall back to defaults on parse error
      } finally {
        initializedRef.current = true;
      }
    }
    load();
  }, []);

  // Persist state after every change (skip the very first render before load finishes)
  useEffect(() => {
    if (!initializedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  return <UserContext.Provider value={{ state, dispatch }}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}

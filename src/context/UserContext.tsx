import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserState, UserAction, GameCompletePayload } from '../types/User';

const storageKey = (userId: string) => `@user_state_v1:${userId}`;

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
  coins: 3,
  weeklyPlaysRemaining: 5,
  currentWeekId: '',
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
    // Only reward meaningful play: 0 score = died immediately = no points
    if (payload.score <= 0) return 0;
    // 10pts per pipe passed, capped at 500
    base = Math.min(payload.score * 10, 500);
  } else if (payload.gameId === 'maze') {
    // Stars 1-3: completion always earns points (you finished the maze)
    // 1 star = 50, 2 stars = 100, 3 stars = 200
    const stars = payload.stars ?? 1;
    base = stars === 3 ? 200 : stars === 2 ? 100 : 50;
  } else if (payload.gameId === 'jumper') {
    // 0 score = fell before jumping = no points
    if (payload.score <= 0) return 0;
    // 5pts per height unit, capped at 500
    base = Math.min(payload.score * 5, 500);
  }

  const multiplier = streak >= 30 ? 1.5 : streak >= 14 ? 1.2 : streak >= 7 ? 1.1 : 1.0;
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

      // Coin rewards
      const newCoins = state.coins + 1; // +1 per game
      // Streak milestone coin bonus
      const milestoneCoins = [7, 14, 30, 50];
      const earnedMilestoneCoins = milestoneCoins.includes(newStreak) ? 3 : 0;

      // Weekly plays: reset if new week, then decrement
      const thisWeek = currentISOWeek();
      let newWeeklyPlays = state.weeklyPlaysRemaining;
      if (state.currentWeekId !== thisWeek) {
        newWeeklyPlays = 5; // reset
      }
      newWeeklyPlays = Math.max(0, newWeeklyPlays - 1);

      return {
        ...state,
        totalPoints: newTotal,
        totalGamesPlayed: newGamesPlayed,
        gamesCompletedToday: newGamesCompletedToday,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        badges: newBadges,
        lastActiveDate: newLastActiveDate ?? state.lastActiveDate,
        coins: newCoins + earnedMilestoneCoins,
        weeklyPlaysRemaining: newWeeklyPlays,
        currentWeekId: thisWeek,
      };
    }

    case 'ADD_BONUS_POINTS':
      return { ...state, totalPoints: state.totalPoints + action.payload.points };

    case 'USE_STREAK_FREEZE': {
      const week = currentISOWeek();
      if (state.lastStreakFreezeUsed === week) return state;
      return {
        ...state,
        streakFreezeAvailable: false,
        lastStreakFreezeUsed: week,
      };
    }

    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.payload.amount };

    case 'SPEND_COINS': {
      const newCoins = state.coins - action.payload.amount;
      if (newCoins < 0) return state; // guard: don't go negative locally
      return { ...state, coins: newCoins };
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

export function UserProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, DEFAULT_STATE);
  const initializedRef = useRef(false);
  const STORAGE_KEY = storageKey(userId);

  // Load this user's persisted state on mount
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
  }, [STORAGE_KEY]);

  // Persist this user's state to AsyncStorage after every change
  useEffect(() => {
    if (!initializedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, STORAGE_KEY]);

  return <UserContext.Provider value={{ state, dispatch }}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}

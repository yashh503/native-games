import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserState, UserAction, GameCompletePayload } from '../types/User';
import { ServerGameProfile } from '../services/api';

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

function profileToState(profile: ServerGameProfile): UserState {
  return {
    totalPoints: profile.totalPoints,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    lastActiveDate: profile.lastActiveDate,
    gamesCompletedToday: profile.gamesCompletedToday,
    streakFreezeAvailable: profile.streakFreezeAvailable,
    lastStreakFreezeUsed: profile.lastStreakFreezeUsed,
    totalGamesPlayed: profile.totalGamesPlayed,
    badges: profile.badges,
    coins: profile.coins,
    weeklyPlaysRemaining: profile.weeklyPlaysRemaining,
    currentWeekId: profile.currentWeekId,
  };
}

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
    if (payload.score <= 0) return 0;
    base = Math.min(payload.score * 10, 500);
  } else if (payload.gameId === 'maze') {
    const stars = payload.stars ?? 1;
    base = stars === 3 ? 200 : stars === 2 ? 100 : 50;
  } else if (payload.gameId === 'jumper') {
    if (payload.score <= 0) return 0;
    base = Math.min(payload.score * 5, 500);
  }
  const multiplier = streak >= 30 ? 1.5 : streak >= 14 ? 1.2 : streak >= 7 ? 1.1 : 1.0;
  return Math.round(base * multiplier);
}

function addBadgesForStreak(current: string[], streak: number): string[] {
  const milestones: Array<[number, string]> = [
    [7, 'streak_7'], [14, 'streak_14'], [30, 'streak_30'], [50, 'streak_50'],
  ];
  const updated = [...current];
  for (const [threshold, badge] of milestones) {
    if (streak >= threshold && !updated.includes(badge)) updated.push(badge);
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
      if (state.lastActiveDate === today) return state;
      if (state.lastActiveDate !== null && state.lastActiveDate > today) return state;
      if (state.lastActiveDate === null) {
        return { ...state, lastActiveDate: today, gamesCompletedToday: 0 };
      }
      if (state.lastActiveDate === yesterday && state.gamesCompletedToday >= 2) {
        return { ...state, gamesCompletedToday: 0, lastActiveDate: today };
      }
      if (state.lastActiveDate === yesterday && state.gamesCompletedToday < 2) {
        if (state.streakFreezeAvailable && state.currentStreak > 0) {
          return {
            ...state, gamesCompletedToday: 0, lastActiveDate: today,
            streakFreezeAvailable: false, lastStreakFreezeUsed: currentISOWeek(),
          };
        }
        return { ...state, currentStreak: 0, gamesCompletedToday: 0, lastActiveDate: today };
      }
      return { ...state, currentStreak: 0, gamesCompletedToday: 0, lastActiveDate: today };
    }

    // Optimistic local update — server response via LOAD_STATE is the true source
    case 'COMPLETE_GAME': {
      const today = todayString();
      const points = calcPoints(action.payload, state.currentStreak);
      const newTotal = state.totalPoints + points;
      const newGamesPlayed = state.totalGamesPlayed + 1;
      const alreadyCountedToday = state.gamesCompletedToday >= 2;
      const newGamesCompletedToday = alreadyCountedToday ? state.gamesCompletedToday : state.gamesCompletedToday + 1;
      let newStreak = state.currentStreak;
      let newLongestStreak = state.longestStreak;
      let newBadges = state.badges;
      let newLastActiveDate = state.lastActiveDate;
      if (!alreadyCountedToday && newGamesCompletedToday === 2) {
        if (state.lastActiveDate !== today) {
          newStreak = state.currentStreak + 1;
          newLastActiveDate = today;
          newBadges = addBadgesForStreak(state.badges, newStreak);
          if (newStreak > state.longestStreak) newLongestStreak = newStreak;
        } else {
          newLastActiveDate = today;
        }
      }
      const newCoins = state.coins + 1;
      const milestoneCoins = [7, 14, 30, 50];
      const earnedMilestoneCoins = milestoneCoins.includes(newStreak) ? 3 : 0;
      const thisWeek = currentISOWeek();
      let newWeeklyPlays = state.weeklyPlaysRemaining;
      if (state.currentWeekId !== thisWeek) newWeeklyPlays = 5;
      newWeeklyPlays = Math.max(0, newWeeklyPlays - 1);
      return {
        ...state,
        totalPoints: newTotal, totalGamesPlayed: newGamesPlayed,
        gamesCompletedToday: newGamesCompletedToday, currentStreak: newStreak,
        longestStreak: newLongestStreak, badges: newBadges,
        lastActiveDate: newLastActiveDate ?? state.lastActiveDate,
        coins: newCoins + earnedMilestoneCoins,
        weeklyPlaysRemaining: newWeeklyPlays, currentWeekId: thisWeek,
      };
    }

    case 'ADD_BONUS_POINTS':
      return { ...state, totalPoints: state.totalPoints + action.payload.points };

    case 'USE_STREAK_FREEZE': {
      const week = currentISOWeek();
      if (state.lastStreakFreezeUsed === week) return state;
      return { ...state, streakFreezeAvailable: false, lastStreakFreezeUsed: week };
    }

    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.payload.amount };

    case 'SPEND_COINS': {
      const newCoins = state.coins - action.payload.amount;
      if (newCoins < 0) return state;
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

interface UserProviderProps {
  userId: string;
  serverProfile: ServerGameProfile | null;
  children: React.ReactNode;
}

export function UserProvider({ userId, serverProfile, children }: UserProviderProps) {
  // Seed with server profile if available, otherwise use defaults
  const initialState = serverProfile ? profileToState(serverProfile) : DEFAULT_STATE;
  const [state, dispatch] = useReducer(userReducer, initialState);
  const initializedRef = useRef(!!serverProfile); // already initialized if we have server data
  const STORAGE_KEY = storageKey(userId);

  // On mount: if no server profile (offline), load from AsyncStorage cache
  useEffect(() => {
    if (serverProfile) return; // server data takes priority — skip cache
    async function loadCache() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: UserState = JSON.parse(raw);
          dispatch({ type: 'LOAD_STATE', payload: parsed });
        }
      } catch {
        // Fall back to defaults silently
      } finally {
        initializedRef.current = true;
      }
    }
    loadCache();
  }, [STORAGE_KEY]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist state as offline cache after every change
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

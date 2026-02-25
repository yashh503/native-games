import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
  Barlow_800ExtraBold,
} from '@expo-google-fonts/barlow';
import {
  Kanit_500Medium,
  Kanit_600SemiBold,
  Kanit_700Bold,
} from '@expo-google-fonts/kanit';
import { useFonts } from 'expo-font';
import { UserProvider, useUser } from './src/context/UserContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import WheelScreen from './src/screens/WheelScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import FlappyGame from './src/games/FlappyGame';
import MazeGame from './src/games/MazeGame';
import JumperGame from './src/games/JumperGame';
import GameResultScreen from './src/components/GameResultScreen';
import BottomNav, { NavTab } from './src/components/BottomNav';
import { useAd } from './src/hooks/useAd';
import { GameCompletePayload } from './src/types/User';
import { COLORS } from './src/constants/theme';
import { postGameComplete, submitScore } from './src/services/api';

type Screen = 'Home' | 'Flappy' | 'Maze' | 'Jumper' | 'Profile' | 'Wheel' | 'Leaderboard';

interface PendingResult {
  gameId: 'flappy' | 'maze' | 'jumper';
  score: number;
  stars?: number;
  pointsEarned: number;
  isNewBest?: boolean;
}

function calcPointsPreview(gameId: string, score: number, stars?: number, streak: number = 0): number {
  let base = 0;
  if (gameId === 'flappy') {
    if (score <= 0) return 0;
    base = Math.min(score * 10, 500);
  } else if (gameId === 'maze') {
    const s = stars ?? 1;
    base = s === 3 ? 200 : s === 2 ? 100 : 50;
  } else if (gameId === 'jumper') {
    if (score <= 0) return 0;
    base = Math.min(score * 5, 500);
  }
  const multiplier = streak >= 30 ? 1.5 : streak >= 14 ? 1.2 : streak >= 7 ? 1.1 : 1.0;
  return Math.round(base * multiplier);
}

function getCurrentWeekId(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const { dispatch, state } = useUser();
  const { adLoading, showRewardedAd } = useAd();
  const { accessToken } = useAuth();

  useEffect(() => {
    dispatch({ type: 'CHECK_AND_UPDATE_STREAK' });
  }, []);

  const handleGameComplete = async (result: { gameId: string; score: number; stars?: number }) => {
    const pointsEarned = calcPointsPreview(result.gameId, result.score, result.stars, state.currentStreak);

    dispatch({
      type: 'COMPLETE_GAME',
      payload: result as GameCompletePayload,
    });

    // Fire-and-forget analytics ping to backend (only if authenticated)
    if (accessToken) {
      postGameComplete(result.gameId, result.score, accessToken, result.stars);
    }

    // Submit to leaderboard if authenticated
    let isNewBest = false;
    if (accessToken) {
      const weekId = getCurrentWeekId();
      const response = await submitScore(weekId, result.gameId, result.score, accessToken).catch(() => null);
      isNewBest = response?.isNewBest ?? false;
    }

    setPendingResult({
      gameId: result.gameId as 'flappy' | 'maze' | 'jumper',
      score: result.score,
      stars: result.stars,
      pointsEarned,
      isNewBest,
    });
  };

  const handleDoublePoints = (onComplete: () => void) => {
    showRewardedAd(() => {
      if (pendingResult && pendingResult.pointsEarned > 0) {
        dispatch({
          type: 'ADD_BONUS_POINTS',
          payload: { points: pendingResult.pointsEarned },
        });
      }
      onComplete();
    });
  };

  const handleResultDone = () => {
    setPendingResult(null);
    setCurrentScreen('Home');
    setActiveTab('home');
  };

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
    if (screen === 'Home') setActiveTab('home');
    else if (screen === 'Wheel') setActiveTab('play');
    else if (screen === 'Leaderboard') setActiveTab('leaderboard');
    else if (screen === 'Profile') setActiveTab('profile');
  };

  // Game screens — full screen, no BottomNav
  if (pendingResult) {
    return (
      <GameResultScreen
        gameId={pendingResult.gameId}
        score={pendingResult.score}
        stars={pendingResult.stars}
        pointsEarned={pendingResult.pointsEarned}
        onDoublePoints={handleDoublePoints}
        adLoading={adLoading}
        onDone={handleResultDone}
      />
    );
  }

  if (currentScreen === 'Flappy') {
    return (
      <View style={styles.gameContainer}>
        <FlappyGame onGameComplete={handleGameComplete} onGoHome={() => navigate('Home')} />
      </View>
    );
  }

  if (currentScreen === 'Maze') {
    return (
      <View style={styles.gameContainer}>
        <MazeGame onGameComplete={handleGameComplete} onGoHome={() => navigate('Home')} />
      </View>
    );
  }

  if (currentScreen === 'Jumper') {
    return (
      <View style={styles.gameContainer}>
        <JumperGame onGameComplete={handleGameComplete} onGoHome={() => navigate('Home')} />
      </View>
    );
  }

  // Main screens with BottomNav
  const renderMainScreen = () => {
    if (currentScreen === 'Profile') {
      return <ProfileScreen onBack={() => navigate('Home')} />;
    }
    if (currentScreen === 'Leaderboard') {
      return <LeaderboardScreen />;
    }
    if (currentScreen === 'Wheel') {
      const gameIdToScreen: Record<string, Screen> = {
        flappy: 'Flappy',
        maze: 'Maze',
        jumper: 'Jumper',
      };
      return (
        <WheelScreen
          onPlayGame={(gameId) => navigate(gameIdToScreen[gameId] ?? 'Home')}
          weeklyPlaysRemaining={state.weeklyPlaysRemaining}
          coins={state.coins}
        />
      );
    }
    return <HomeScreen onNavigate={navigate} />;
  };

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>{renderMainScreen()}</View>
      <BottomNav active={activeTab} onNavigate={(tab) => {
        const tabToScreen: Record<NavTab, Screen> = {
          home: 'Home',
          play: 'Wheel',
          leaderboard: 'Leaderboard',
          profile: 'Profile',
        };
        navigate(tabToScreen[tab]);
      }} />
    </View>
  );
}

function AuthGate() {
  const { user, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!user) {
    if (authScreen === 'login') {
      return <LoginScreen onNavigateToRegister={() => setAuthScreen('register')} />;
    }
    return <RegisterScreen onNavigateToLogin={() => setAuthScreen('login')} />;
  }

  return (
    <UserProvider key={user.userId} userId={user.userId}>
      <AppNavigator />
    </UserProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    Barlow_800ExtraBold,
    Kanit_500Medium,
    Kanit_600SemiBold,
    Kanit_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex: { flex: 1 },
  gameContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});

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
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FlappyGame from './src/games/FlappyGame';
import MazeGame from './src/games/MazeGame';
import JumperGame from './src/games/JumperGame';
import GameResultScreen from './src/components/GameResultScreen';
import { useAd } from './src/hooks/useAd';
import { GameCompletePayload } from './src/types/User';
import { COLORS } from './src/constants/theme';

type Screen = 'Home' | 'Flappy' | 'Maze' | 'Jumper' | 'Profile';

interface PendingResult {
  gameId: 'flappy' | 'maze' | 'jumper';
  score: number;
  stars?: number;
  pointsEarned: number;
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

function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const { dispatch, state } = useUser();
  const { adLoading, showRewardedAd } = useAd();

  useEffect(() => {
    dispatch({ type: 'CHECK_AND_UPDATE_STREAK' });
  }, []);

  const handleGameComplete = (result: { gameId: string; score: number; stars?: number }) => {
    const pointsEarned = calcPointsPreview(result.gameId, result.score, result.stars, state.currentStreak);

    dispatch({
      type: 'COMPLETE_GAME',
      payload: result as GameCompletePayload,
    });

    setPendingResult({
      gameId: result.gameId as 'flappy' | 'maze' | 'jumper',
      score: result.score,
      stars: result.stars,
      pointsEarned,
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
  };

  const navigate = (screen: Screen) => setCurrentScreen(screen);

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

  if (currentScreen === 'Home') return <HomeScreen onNavigate={navigate} />;
  if (currentScreen === 'Profile') return <ProfileScreen onBack={() => setCurrentScreen('Home')} />;

  if (currentScreen === 'Flappy') {
    return (
      <View style={styles.gameContainer}>
        <FlappyGame onGameComplete={handleGameComplete} onGoHome={() => setCurrentScreen('Home')} />
      </View>
    );
  }

  if (currentScreen === 'Maze') {
    return (
      <View style={styles.gameContainer}>
        <MazeGame onGameComplete={handleGameComplete} onGoHome={() => setCurrentScreen('Home')} />
      </View>
    );
  }

  if (currentScreen === 'Jumper') {
    return (
      <View style={styles.gameContainer}>
        <JumperGame onGameComplete={handleGameComplete} onGoHome={() => setCurrentScreen('Home')} />
      </View>
    );
  }

  return null;
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
      <UserProvider>
        <AppNavigator />
      </UserProvider>
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
  gameContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});

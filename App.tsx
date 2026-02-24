import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { UserProvider, useUser } from './src/context/UserContext';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FlappyGame from './src/games/FlappyGame';
import MazeGame from './src/games/MazeGame';
import JumperGame from './src/games/JumperGame';
import { GameCompletePayload } from './src/types/User';
import { COLORS } from './src/constants/theme';

type Screen = 'Home' | 'Flappy' | 'Maze' | 'Jumper' | 'Profile';

function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');
  const { dispatch } = useUser();

  // Check and update streak on app open
  useEffect(() => {
    dispatch({ type: 'CHECK_AND_UPDATE_STREAK' });
  }, []);

  const handleGameComplete = (result: { gameId: string; score: number; stars?: number }) => {
    dispatch({
      type: 'COMPLETE_GAME',
      payload: result as GameCompletePayload,
    });
    setCurrentScreen('Home');
  };

  const navigate = (screen: Screen) => setCurrentScreen(screen);

  if (currentScreen === 'Home') {
    return <HomeScreen onNavigate={navigate} />;
  }

  if (currentScreen === 'Profile') {
    return <ProfileScreen onBack={() => setCurrentScreen('Home')} />;
  }

  if (currentScreen === 'Flappy') {
    return (
      <View style={styles.gameContainer}>
        <FlappyGame onGameComplete={handleGameComplete} />
      </View>
    );
  }

  if (currentScreen === 'Maze') {
    return (
      <View style={styles.gameContainer}>
        <MazeGame onGameComplete={handleGameComplete} />
      </View>
    );
  }

  if (currentScreen === 'Jumper') {
    return (
      <View style={styles.gameContainer}>
        <JumperGame onGameComplete={handleGameComplete} />
      </View>
    );
  }

  return null;
}

export default function App() {
  return (
    <UserProvider>
      <AppNavigator />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});

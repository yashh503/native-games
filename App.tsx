import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import FlappyGame from './src/games/FlappyGame';
import MazeGame from './src/games/MazeGame';
import JumperGame from './src/games/JumperGame';

type Screen = 'Home' | 'Flappy' | 'Maze' | 'Jumper';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');

  if (currentScreen === 'Flappy') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('Home')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Flappy Game</Text>
        </SafeAreaView>
        <FlappyGame />
      </View>
    );
  }

  if (currentScreen === 'Maze') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('Home')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Maze Game</Text>
        </SafeAreaView>
        <MazeGame />
      </View>
    );
  }

  if (currentScreen === 'Jumper') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('Home')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Jumper Game</Text>
        </SafeAreaView>
        <JumperGame />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.homeContainer}>
        <Text style={styles.title}>Mini Games</Text>
        <Text style={styles.subtitle}>Choose a Game</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('Flappy')}
        >
          <Text style={styles.buttonText}>Flappy Game</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('Maze')}
        >
          <Text style={styles.buttonText}>Maze Game</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentScreen('Jumper')}
        >
          <Text style={styles.buttonText}>Jumper Game</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#1a1a2e',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#16213e',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

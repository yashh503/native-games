import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/Constants';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.score}>{score}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});

export default ScoreDisplay;

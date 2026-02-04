import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SCREEN_WIDTH, GROUND_HEIGHT, GAME_HEIGHT, COLORS } from '../utils/Constants';

const Ground: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.grassTop} />
      <View style={styles.ground} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: GAME_HEIGHT,
    width: SCREEN_WIDTH,
    height: GROUND_HEIGHT,
  },
  grassTop: {
    width: '100%',
    height: 10,
    backgroundColor: COLORS.groundTop,
  },
  ground: {
    width: '100%',
    flex: 1,
    backgroundColor: COLORS.ground,
  },
});

export default Ground;

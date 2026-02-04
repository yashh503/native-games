import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../utils/Constants';

interface PlayerProps {
  row: number;
  col: number;
  cellSize: number;
}

const Player: React.FC<PlayerProps> = ({ row, col, cellSize }) => {
  const playerSize = cellSize * 0.7;
  const offset = (cellSize - playerSize) / 2;

  return (
    <View
      style={[
        styles.player,
        {
          width: playerSize,
          height: playerSize,
          borderRadius: playerSize / 2,
          left: col * cellSize + offset,
          top: row * cellSize + offset,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  player: {
    position: 'absolute',
    backgroundColor: COLORS.player,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default Player;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, CELL_TYPES, MAZE_WIDTH } from '../utils/Constants';

interface MazeGridProps {
  grid: number[][];
  cellSize: number;
}

const MazeGrid: React.FC<MazeGridProps> = ({ grid, cellSize }) => {
  const getCellColor = (cellType: number): string => {
    switch (cellType) {
      case CELL_TYPES.WALL:
        return COLORS.wall;
      case CELL_TYPES.START:
        return COLORS.start;
      case CELL_TYPES.EXIT:
        return COLORS.exit;
      case CELL_TYPES.COIN:
        return COLORS.coin;
      case CELL_TYPES.PATH:
      default:
        return COLORS.path;
    }
  };

  return (
    <View style={[styles.container, { width: MAZE_WIDTH }]}>
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => (
            <View
              key={`${rowIndex}-${colIndex}`}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: getCellColor(cell),
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

export default MazeGrid;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PIPE_WIDTH, COLORS } from '../utils/Constants';

interface PipeProps {
  position: { x: number };
  topHeight: number;
  bottomY: number;
  bottomHeight: number;
}

const Pipe: React.FC<PipeProps> = ({ position, topHeight, bottomY, bottomHeight }) => {
  return (
    <>
      {/* Top pipe */}
      <View
        style={[
          styles.pipe,
          {
            left: position.x,
            top: 0,
            height: topHeight,
          },
        ]}
      />
      {/* Bottom pipe */}
      <View
        style={[
          styles.pipe,
          {
            left: position.x,
            top: bottomY,
            height: bottomHeight,
          },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: COLORS.pipe,
  },
});

export default Pipe;

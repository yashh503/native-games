import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BIRD_WIDTH, BIRD_HEIGHT, COLORS } from '../utils/Constants';

interface BirdProps {
  position: { x: number; y: number };
}

const Bird: React.FC<BirdProps> = ({ position }) => {
  return (
    <View
      style={[
        styles.bird,
        {
          left: position.x,
          top: position.y,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  bird: {
    position: 'absolute',
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
    backgroundColor: COLORS.bird,
    borderRadius: 8,
  },
});

export default Bird;

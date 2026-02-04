import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';

export type Direction = 'up' | 'down' | 'left' | 'right';

interface SwipeAreaProps {
  onSwipe: (direction: Direction) => void;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 20; // Minimum distance for a swipe
const SWIPE_VELOCITY_THRESHOLD = 0.1; // Minimum velocity

const SwipeArea: React.FC<SwipeAreaProps> = ({ onSwipe, children }) => {
  const lastMoveTime = useRef(0);
  const moveThrottle = 100; // ms between moves for continuous swipe

  const handleSwipe = (dx: number, dy: number) => {
    const now = Date.now();
    if (now - lastMoveTime.current < moveThrottle) return;
    lastMoveTime.current = now;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return;

    if (absDx > absDy) {
      // Horizontal swipe
      onSwipe(dx > 0 ? 'right' : 'left');
    } else {
      // Vertical swipe
      onSwipe(dy > 0 ? 'down' : 'up');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        // Continuous movement while dragging
        handleSwipe(gestureState.dx, gestureState.dy);
      },
      onPanResponderRelease: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        // Final swipe on release
        const { dx, dy, vx, vy } = gestureState;

        if (Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD || Math.abs(vy) > SWIPE_VELOCITY_THRESHOLD) {
          if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
            handleSwipe(dx, dy);
          }
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SwipeArea;

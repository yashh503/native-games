import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const CONFETTI_COLORS = ['#f5a623', '#e94560', '#4ade80', '#60a5fa', '#a78bfa', '#fb923c', '#f472b6'];
const DOT_COUNT = 30; // Reduced from 35 for better performance on mid-range devices

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

interface Dot {
  x: number;
  color: string;
  size: number;
  anim: Animated.Value;
  opacity: Animated.Value;
  delay: number;
  rotation: string; // pre-computed to avoid calling random() during render
}

interface ConfettiOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

export default function ConfettiOverlay({ visible, onComplete }: ConfettiOverlayProps) {
  const dotsRef = useRef<Dot[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  if (dotsRef.current.length === 0) {
    dotsRef.current = Array.from({ length: DOT_COUNT }, () => ({
      x: randomBetween(0, W),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: randomBetween(8, 16),
      anim: new Animated.Value(0),
      opacity: new Animated.Value(0),
      delay: randomBetween(0, 500),
      rotation: `${Math.floor(randomBetween(180, 540))}deg`,
    }));
  }

  useEffect(() => {
    if (!visible) return;

    const dots = dotsRef.current;
    dots.forEach((d) => {
      d.anim.setValue(0);
      d.opacity.setValue(0);
    });

    const animations = dots.map((d) =>
      Animated.sequence([
        Animated.delay(d.delay),
        Animated.parallel([
          Animated.timing(d.anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(d.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.delay(1400),
            Animated.timing(d.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
        ]),
      ])
    );

    animationRef.current = Animated.parallel(animations);
    animationRef.current.start(({ finished }) => {
      if (finished) onComplete();
    });

    return () => {
      // Stop all animations when unmounted or visibility changes
      animationRef.current?.stop();
      animationRef.current = null;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {dotsRef.current.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              left: dot.x,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              backgroundColor: dot.color,
              opacity: dot.opacity,
              transform: [
                {
                  translateY: dot.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [H, H * 0.05],
                  }),
                },
                {
                  rotate: dot.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', dot.rotation],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  dot: {
    position: 'absolute',
    bottom: 0,
  },
});

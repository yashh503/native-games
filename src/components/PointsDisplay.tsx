import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface PointsDisplayProps {
  points: number;
  style?: object;
}

export default function PointsDisplay({ points, style }: PointsDisplayProps) {
  const [displayed, setDisplayed] = useState(points);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Tick-up number animation
  useEffect(() => {
    const end = points;
    // Read current displayed value from a ref so we don't need it in deps
    setDisplayed((current) => {
      const start = current;
      if (start === end) return start;

      const diff = end - start;
      const steps = Math.min(Math.abs(diff), 30);
      const stepSize = diff / steps;
      let count = 0;

      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        count++;
        setDisplayed(Math.round(count < steps ? start + stepSize * count : end));
        if (count >= steps) {
          clearInterval(tickRef.current!);
          tickRef.current = null;
        }
      }, 16);

      return start; // don't update immediately; interval will handle it
    });

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [points]);

  // Scale bounce when value changes
  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.15,
        useNativeDriver: true,
        speed: 60,
        bounciness: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 4,
      }),
    ]).start();
  }, [points]);

  return (
    <Animated.Text style={[styles.text, style, { transform: [{ scale: scaleAnim }] }]}>
      🏆 {displayed.toLocaleString()}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.accentGold,
  },
});

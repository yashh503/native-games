import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // 0–1
  color?: string;
  height?: number;
}

export default function ProgressBar({ progress, color = COLORS.primary, height = 8 }: ProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.min(1, Math.max(0, progress)),
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: color,
            width: widthAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.bgCardInner,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {},
});

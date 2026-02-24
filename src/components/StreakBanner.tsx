import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS, FONTS, STREAK_TARGET, MILESTONE_HINTS } from '../constants/theme';

interface StreakBannerProps {
  streak: number;
  gamesCompletedToday: number;
}

export default function StreakBanner({ streak, gamesCompletedToday }: StreakBannerProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const reminderOpacity = useRef(new Animated.Value(0)).current;
  const reminderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  // Pulsing flame — start/stop cleanly
  useEffect(() => {
    if (streak === 0) return;
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseRef.current.start();
    return () => {
      pulseRef.current?.stop();
      pulseRef.current = null;
    };
  }, [streak]);

  // "1 more game" reminder: fade in, then auto-hide after 3s
  useEffect(() => {
    if (gamesCompletedToday !== 1 || streak === 0) {
      reminderOpacity.setValue(0);
      return;
    }
    reminderOpacity.setValue(0);
    Animated.timing(reminderOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    reminderTimer.current = setTimeout(() => {
      Animated.timing(reminderOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 3000);

    return () => {
      if (reminderTimer.current) clearTimeout(reminderTimer.current);
    };
  }, [gamesCompletedToday, streak]);

  // Milestone anticipation hint (5–6 → 7-day, 11–13 → 14-day, etc.)
  const milestoneHint = MILESTONE_HINTS.find((h) => streak >= h.from && streak <= h.to);

  if (streak === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.flame}>🔥</Text>
        <View style={styles.textBlock}>
          <Text style={styles.zeroText}>Start your streak today!</Text>
          <Text style={styles.sub}>Complete 2 games daily to build a streak</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.container}>
        <Animated.Text style={[styles.flame, { transform: [{ scale: scaleAnim }] }]}>🔥</Animated.Text>
        <View style={styles.textBlock}>
          <Text style={styles.streakText}>
            <Text style={styles.streakNum}>{streak}</Text>
            {' '}Day Streak
          </Text>
          <Text style={styles.sub}>
            {streak >= STREAK_TARGET
              ? '🏆 50-Day Legend! Keep going!'
              : milestoneHint
              ? `You're close to your ${milestoneHint.label}!`
              : `${STREAK_TARGET - streak} days to the 50-day reward`}
          </Text>
        </View>
      </View>

      {/* Animated reminder shown only when 1 game completed */}
      {gamesCompletedToday === 1 && (
        <Animated.View style={[styles.reminderRow, { opacity: reminderOpacity }]}>
          <Text style={styles.reminderText}>🔥 Just 1 more game to protect your streak.</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textBlock: {
    flex: 1,
  },
  flame: {
    fontSize: 42,
  },
  streakText: {
    fontSize: 20,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.text,
  },
  streakNum: {
    fontSize: 28,
    fontFamily: FONTS.headingBold,
    color: COLORS.streakOrange,
  },
  zeroText: {
    fontSize: 18,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.text,
  },
  sub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  reminderRow: {
    marginTop: 10,
    backgroundColor: COLORS.streakOrange + '18',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.streakOrange,
  },
  reminderText: {
    color: COLORS.streakOrange,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export type NavTab = 'home' | 'play' | 'leaderboard' | 'profile';

interface Props {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
}

const TABS: { key: NavTab; emoji: string; label: string }[] = [
  { key: 'home', emoji: '🏠', label: 'Home' },
  { key: 'play', emoji: '🎡', label: 'Play' },
  { key: 'leaderboard', emoji: '🏆', label: 'Ranks' },
  { key: 'profile', emoji: '👤', label: 'Profile' },
];

export default function BottomNav({ active, onNavigate }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.emoji, isActive && styles.emojiActive]}>{tab.emoji}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  emoji: { fontSize: 22, opacity: 0.4 },
  emojiActive: { opacity: 1 },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  labelActive: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});

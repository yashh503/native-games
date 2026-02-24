import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { COLORS, STREAK_TARGET, BADGE_LABELS } from '../constants/theme';
import ProgressBar from '../components/ProgressBar';

interface ProfileScreenProps {
  onBack: () => void;
}

// All possible milestone badges in order
const ALL_BADGES: Array<{ key: string; label: string; threshold: number }> = [
  { key: 'streak_7',  label: '7-Day Streak 🔥',   threshold: 7  },
  { key: 'streak_14', label: '14-Day Streak 💪',  threshold: 14 },
  { key: 'streak_30', label: '30-Day Streak 🌟',  threshold: 30 },
  { key: 'streak_50', label: '50-Day Legend 👑',  threshold: 50 },
];

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { state } = useUser();

  const streakProgress = Math.min(state.currentStreak / STREAK_TARGET, 1);

  const earnedBadges = ALL_BADGES.filter((b) => state.badges.includes(b.key));
  const lockedBadges = ALL_BADGES.filter((b) => !state.badges.includes(b.key));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🧠</Text>
          </View>
          <Text style={styles.playerLabel}>Brain Gamer</Text>
          {state.currentStreak >= STREAK_TARGET && (
            <Text style={styles.legendBadge}>👑 50-Day Legend</Text>
          )}
        </View>

        {/* Longest Streak — elevated hero card */}
        <View style={styles.longestStreakCard}>
          <View style={styles.longestStreakLeft}>
            <Text style={styles.longestStreakEmoji}>🌟</Text>
            <View>
              <Text style={styles.longestStreakLabel}>Longest Streak</Text>
              <Text style={styles.longestStreakSub}>Your personal best</Text>
            </View>
          </View>
          <Text style={styles.longestStreakValue}>{state.longestStreak}d</Text>
        </View>

        {/* Stats Grid — other 3 stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Points', value: state.totalPoints.toLocaleString(), emoji: '🏆' },
            { label: 'Current Streak', value: `${state.currentStreak}d`, emoji: '🔥' },
            { label: 'Games Played', value: state.totalGamesPlayed.toLocaleString(), emoji: '🎮' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* 50-Day Target with circular-style progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>50-Day Streak Target</Text>
            <Text style={styles.cardSub}>{state.currentStreak}/{STREAK_TARGET}</Text>
          </View>
          <ProgressBar progress={streakProgress} color={COLORS.streakOrange} height={12} />
          {state.currentStreak >= STREAK_TARGET ? (
            <Text style={styles.achieved}>🏆 Target Achieved! You're a legend.</Text>
          ) : (
            <Text style={styles.daysLeft}>
              {STREAK_TARGET - state.currentStreak} days remaining — keep going!
            </Text>
          )}
        </View>

        {/* Badges — earned */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Badges Earned</Text>
          {earnedBadges.length === 0 ? (
            <Text style={styles.noBadges}>
              No badges yet. Reach a 7-day streak to earn your first! 🔥
            </Text>
          ) : (
            <View style={styles.badgeList}>
              {earnedBadges.map((b) => (
                <View key={b.key} style={styles.badgeChip}>
                  <Text style={styles.badgeText}>{BADGE_LABELS[b.key] ?? b.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Locked badge placeholders */}
        {lockedBadges.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upcoming Badges</Text>
            <View style={styles.badgeList}>
              {lockedBadges.map((b) => (
                <View key={b.key} style={styles.lockedChip}>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <View>
                    <Text style={styles.lockedLabel}>{b.label}</Text>
                    <Text style={styles.lockedReq}>Reach {b.threshold}-day streak</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: COLORS.accentBlue,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.bgCard,
    borderWidth: 3,
    borderColor: COLORS.streakOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: COLORS.streakOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  playerLabel: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  legendBadge: {
    color: COLORS.accentGold,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 4,
  },
  // Elevated "longest streak" hero card
  longestStreakCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.streakOrange + '55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.streakOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  longestStreakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  longestStreakEmoji: {
    fontSize: 32,
  },
  longestStreakLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  longestStreakSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  longestStreakValue: {
    color: COLORS.streakOrange,
    fontSize: 36,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  cardSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  achieved: {
    color: COLORS.accentGold,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  daysLeft: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  noBadges: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  badgeList: {
    gap: 8,
  },
  badgeChip: {
    backgroundColor: COLORS.bgCardInner,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.streakOrange,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  // Locked badge placeholder
  lockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgCardInner,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.textDim,
    opacity: 0.65,
  },
  lockIcon: {
    fontSize: 18,
  },
  lockedLabel: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  lockedReq: {
    color: COLORS.textDim,
    fontSize: 11,
    marginTop: 2,
  },
});

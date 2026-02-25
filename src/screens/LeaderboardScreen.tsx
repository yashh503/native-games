import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS } from '../constants/theme';

const BASE_URL = __DEV__ ? 'http://localhost:3001' : 'https://your-production-url.com';

function getCurrentWeekId(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

interface LeaderboardEntry {
  userId: string;
  weekId: string;
  gameId: string;
  bestScore: number;
  displayName: string;
  rank: number;
}

const RANK_COLORS: Record<number, string> = {
  1: '#D97706',
  2: '#6B7280',
  3: '#92400E',
};

const GAME_LABELS: Record<string, string> = {
  flappy: 'Flappy Bird',
  maze: 'Maze Runner',
  jumper: 'Platform Jumper',
  all: 'All Games',
};

export default function LeaderboardScreen() {
  const { accessToken, user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekId] = useState(getCurrentWeekId());
  const [gameFilter, setGameFilter] = useState<string>('all');

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url =
        gameFilter === 'all'
          ? `${BASE_URL}/leaderboard/${weekId}`
          : `${BASE_URL}/leaderboard/${weekId}?gameId=${gameFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to load leaderboard');
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setError('Could not load leaderboard. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, weekId, gameFilter]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isMe = item.userId === user?.userId;
    const rankColor = RANK_COLORS[item.rank];

    return (
      <View style={[styles.row, isMe && styles.myRow]}>
        <View style={[styles.rankBadge, rankColor ? { backgroundColor: rankColor } : null]}>
          <Text style={[styles.rankText, !rankColor && styles.rankTextDim]}>{item.rank}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.displayName, isMe && styles.displayNameMe]}>
            {item.displayName} {isMe ? '(You)' : ''}
          </Text>
          <Text style={styles.gameLabel}>{GAME_LABELS[item.gameId] ?? item.gameId}</Text>
        </View>
        <Text style={styles.score}>{item.bestScore.toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.weekLabel}>{weekId}</Text>
      </View>

      <View style={styles.filterRow}>
        {['all', 'flappy', 'maze', 'jumper'].map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.filterChip, gameFilter === g && styles.filterChipActive]}
            onPress={() => setGameFilter(g)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, gameFilter === g && styles.filterTextActive]}>
              {GAME_LABELS[g]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadLeaderboard} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No scores yet this week.</Text>
          <Text style={styles.emptyHint}>Be the first to play and set a record!</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => `${item.userId}-${item.gameId}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontFamily: FONTS.headingBold, fontSize: 24, color: COLORS.text },
  weekLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  filterTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  errorText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.accentRed, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  retryText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
  emptyText: { fontFamily: FONTS.headingSemiBold, fontSize: 18, color: COLORS.textSub },
  emptyHint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  myRow: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primaryLight,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCardInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontFamily: FONTS.headingBold, fontSize: 15, color: '#fff' },
  rankTextDim: { color: COLORS.textMuted },
  rowInfo: { flex: 1 },
  displayName: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },
  displayNameMe: { color: COLORS.primary },
  gameLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  score: { fontFamily: FONTS.headingBold, fontSize: 17, color: COLORS.text },
});

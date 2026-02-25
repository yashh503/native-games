import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import WheelSpin from '../components/WheelSpin';
import { COLORS, FONTS } from '../constants/theme';

const BASE_URL = __DEV__ ? 'http://localhost:3001' : 'https://your-production-url.com';

const GAME_META: Record<string, { label: string; emoji: string }> = {
  flappy: { label: 'Flappy Bird', emoji: '🐦' },
  maze: { label: 'Maze Runner', emoji: '🐭' },
  jumper: { label: 'Platform Jumper', emoji: '🕹️' },
};

interface ScheduleSlot {
  slotIndex: number;
  gameId: string;
}

interface Props {
  onPlayGame: (gameId: string) => void;
  weeklyPlaysRemaining: number;
  coins: number;
}

export default function WheelScreen({ onPlayGame, weeklyPlaysRemaining, coins }: Props) {
  const { accessToken } = useAuth();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [weekId, setWeekId] = useState('');

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/schedule/current`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to load schedule');
      const data = await res.json();
      setSlots(data.slots);
      setWeekId(data.weekId);
    } catch {
      setError('Could not load this week\'s games. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const wheelSlots = slots.map((s) => ({
    gameId: s.gameId,
    label: GAME_META[s.gameId]?.label ?? s.gameId,
    emoji: GAME_META[s.gameId]?.emoji ?? '🎮',
  }));

  const canPlay = weeklyPlaysRemaining > 0 || coins >= 3;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Spin to Play</Text>
          <Text style={styles.weekLabel}>Week {weekId}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{weeklyPlaysRemaining}</Text>
            <Text style={styles.statLabel}>Free Plays Left</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{coins}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading this week's games...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadSchedule} style={styles.retryButton}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WheelSpin
            slots={wheelSlots}
            onSpinComplete={(gameId) => setSelectedGameId(gameId)}
          />
        )}

        {selectedGameId && !loading && (
          <View style={styles.playSection}>
            {canPlay ? (
              <>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => onPlayGame(selectedGameId)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.playButtonText}>
                    Play {GAME_META[selectedGameId]?.label ?? selectedGameId}
                    {weeklyPlaysRemaining === 0 ? ' (3 coins)' : ''}
                  </Text>
                </TouchableOpacity>
                {weeklyPlaysRemaining === 0 && (
                  <Text style={styles.retryNote}>
                    No free plays left — this retry costs 3 coins
                  </Text>
                )}
              </>
            ) : (
              <View style={styles.noPlaysBox}>
                <Text style={styles.noPlaysText}>
                  No plays remaining this week and not enough coins for a retry.
                </Text>
                <Text style={styles.noPlaysHint}>
                  Play games to earn coins (+1 per game, +3 on streak milestones).
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.scheduleSection}>
          <Text style={styles.scheduleTitle}>This Week's Games</Text>
          {slots.map((s, i) => (
            <View key={i} style={styles.scheduleRow}>
              <Text style={styles.scheduleEmoji}>{GAME_META[s.gameId]?.emoji ?? '🎮'}</Text>
              <Text style={styles.scheduleName}>{GAME_META[s.gameId]?.label ?? s.gameId}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 20, paddingVertical: 24, gap: 24 },
  header: { alignItems: 'center' },
  title: { fontFamily: FONTS.headingBold, fontSize: 26, color: COLORS.text },
  weekLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  statBadge: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  statValue: { fontFamily: FONTS.headingBold, fontSize: 22, color: COLORS.primary },
  statLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted },
  errorBox: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  errorText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.accentRed, textAlign: 'center' },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  retryText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
  playSection: { alignItems: 'center', gap: 8 },
  playButton: {
    backgroundColor: COLORS.accentGreen,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: COLORS.accentGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  playButtonText: { fontFamily: FONTS.headingBold, fontSize: 16, color: '#fff' },
  retryNote: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted },
  noPlaysBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noPlaysText: { fontFamily: FONTS.medium, fontSize: 14, color: '#92400E', textAlign: 'center' },
  noPlaysHint: { fontFamily: FONTS.regular, fontSize: 13, color: '#92400E', textAlign: 'center' },
  scheduleSection: { gap: 8 },
  scheduleTitle: { fontFamily: FONTS.headingSemiBold, fontSize: 16, color: COLORS.textSub },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scheduleEmoji: { fontSize: 20 },
  scheduleName: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text },
});

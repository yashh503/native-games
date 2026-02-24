import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import { useAd } from '../hooks/useAd';
import { COLORS, STREAK_TARGET, STREAK_MILESTONES } from '../constants/theme';
import StreakBanner from '../components/StreakBanner';
import ProgressBar from '../components/ProgressBar';
import GameCard from '../components/GameCard';
import PointsDisplay from '../components/PointsDisplay';
import ConfettiOverlay from '../components/ConfettiOverlay';
import RewardedAdModal from '../components/RewardedAdModal';
import StreakWarningModal from '../components/StreakWarningModal';

type GameScreen = 'Flappy' | 'Maze' | 'Jumper' | 'Profile';

interface HomeScreenProps {
  onNavigate: (screen: GameScreen) => void;
}

const GAMES = [
  { screen: 'Flappy' as const, title: 'Flappy Bird', emoji: '🐦', hsKey: 'flappy_high_score', color: COLORS.accentBlue },
  { screen: 'Maze' as const, title: 'Maze Runner', emoji: '🐭', hsKey: 'maze_progress', color: COLORS.accentGreen },
  { screen: 'Jumper' as const, title: 'Platform Jumper', emoji: '🕹️', hsKey: '@jumper_high_score', color: '#a78bfa' },
];

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// < 4 hours = urgent
function isUrgent(ms: number): boolean {
  return ms < 4 * 60 * 60 * 1000;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { state, dispatch } = useUser();
  const { adLoading, showRewardedAd } = useAd();

  const [highScores, setHighScores] = useState<Record<string, number | null>>({});
  const [countdown, setCountdown] = useState(msUntilMidnight());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showStreakWarning, setShowStreakWarning] = useState(false);
  const [stateLoaded, setStateLoaded] = useState(false);

  const prevStreakRef = useRef(state.currentStreak);
  const prevPointsRef = useRef(state.totalPoints);

  // Floating +points animation
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;
  const [pointsDelta, setPointsDelta] = useState(0);

  // Urgency pulse for countdown when < 4h
  const urgencyPulse = useRef(new Animated.Value(1)).current;
  const urgencyLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Load high scores
  useEffect(() => {
    async function loadScores() {
      const scores: Record<string, number | null> = {};
      for (const g of GAMES) {
        try {
          const raw = await AsyncStorage.getItem(g.hsKey);
          if (raw && g.hsKey !== 'maze_progress') {
            const val = parseFloat(raw);
            scores[g.hsKey] = isNaN(val) ? null : val;
          } else {
            scores[g.hsKey] = null;
          }
        } catch {
          scores[g.hsKey] = null;
        }
      }
      setHighScores(scores);
    }
    loadScores();
  }, []);

  // Countdown timer + urgency pulse
  useEffect(() => {
    const tick = setInterval(() => {
      const ms = msUntilMidnight();
      setCountdown(ms);

      if (isUrgent(ms) && state.gamesCompletedToday < 2) {
        if (!urgencyLoopRef.current) {
          urgencyLoopRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(urgencyPulse, { toValue: 1.06, duration: 800, useNativeDriver: true }),
              Animated.timing(urgencyPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
          );
          urgencyLoopRef.current.start();
        }
      } else {
        urgencyLoopRef.current?.stop();
        urgencyLoopRef.current = null;
        urgencyPulse.setValue(1);
      }
    }, 1000);
    return () => {
      clearInterval(tick);
      urgencyLoopRef.current?.stop();
    };
  }, [state.gamesCompletedToday]);

  // Streak check on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'CHECK_AND_UPDATE_STREAK' });
      setStateLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Show streak warning on first load
  useEffect(() => {
    if (!stateLoaded) return;
    const today = todayString();
    if (
      state.currentStreak > 0 &&
      state.lastActiveDate !== today &&
      state.gamesCompletedToday < 2
    ) {
      setShowStreakWarning(true);
    }
  }, [stateLoaded]);

  // Confetti on streak milestones
  useEffect(() => {
    const prev = prevStreakRef.current;
    const cur = state.currentStreak;
    if (cur > prev && STREAK_MILESTONES.includes(cur)) {
      setShowConfetti(true);
    }
    prevStreakRef.current = cur;
  }, [state.currentStreak]);

  // Floating +points animation
  useEffect(() => {
    const prev = prevPointsRef.current;
    const cur = state.totalPoints;
    if (cur > prev) {
      const delta = cur - prev;
      setPointsDelta(delta);
      floatAnim.setValue(0);
      floatOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(floatAnim, {
          toValue: -32,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(floatOpacity, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => setPointsDelta(0));
    }
    prevPointsRef.current = cur;
  }, [state.totalPoints]);

  const handleStreakFreeze = useCallback(() => {
    setShowAdModal(true);
  }, []);

  const handleAdComplete = useCallback(() => {
    dispatch({ type: 'USE_STREAK_FREEZE' });
    setShowAdModal(false);
  }, [dispatch]);

  const streakProgress = Math.min(state.currentStreak / STREAK_TARGET, 1);
  const gamesNeeded = Math.max(0, 2 - state.gamesCompletedToday);
  const urgentNow = isUrgent(countdown) && state.gamesCompletedToday < 2;

  return (
    <SafeAreaView style={styles.safe}>
      <ConfettiOverlay visible={showConfetti} onComplete={() => setShowConfetti(false)} />

      <RewardedAdModal
        visible={showAdModal}
        title="Freeze Your Streak!"
        description="Watch a short ad to protect your streak for today — even if you don't finish 2 games."
        adLoading={adLoading}
        onWatch={() => showRewardedAd(handleAdComplete)}
        onClose={() => setShowAdModal(false)}
      />

      <StreakWarningModal
        visible={showStreakWarning}
        streak={state.currentStreak}
        gamesNeeded={gamesNeeded}
        onPlayNow={() => setShowStreakWarning(false)}
        onDismiss={() => setShowStreakWarning(false)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>🧠 Brain Games</Text>
          <View style={styles.pointsWrap}>
            <PointsDisplay points={state.totalPoints} />
            {pointsDelta > 0 && (
              <Animated.Text
                style={[
                  styles.floatingPoints,
                  {
                    opacity: floatOpacity,
                    transform: [{ translateY: floatAnim }],
                  },
                ]}
              >
                +{pointsDelta}
              </Animated.Text>
            )}
          </View>
        </View>

        {/* Streak Card */}
        <View style={styles.card}>
          <StreakBanner
            streak={state.currentStreak}
            gamesCompletedToday={state.gamesCompletedToday}
          />
          <View style={styles.streakProgressRow}>
            <ProgressBar progress={streakProgress} color={COLORS.streakOrange} height={10} />
            <Text style={styles.streakProgressLabel}>
              {state.currentStreak}/{STREAK_TARGET} days
            </Text>
          </View>
          {/* Freeze button — glows when available */}
          {state.streakFreezeAvailable && state.currentStreak > 0 && (
            <TouchableOpacity
              style={[styles.freezeBtn, styles.freezeBtnActive]}
              onPress={handleStreakFreeze}
              activeOpacity={0.8}
            >
              <Text style={styles.freezeText}>🛡️ Protect Streak (Watch Ad)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Today's Progress */}
        <View style={styles.card}>
          <View style={styles.todayHeader}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>
            <Animated.Text
              style={[
                styles.countdown,
                urgentNow && styles.countdownUrgent,
                { transform: [{ scale: urgentNow ? urgencyPulse : 1 }] },
              ]}
            >
              {urgentNow ? '⚠️ ' : '⏱ '}{formatCountdown(countdown)}
            </Animated.Text>
          </View>
          <View style={styles.dotsRow}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  state.gamesCompletedToday > i && styles.dotFilled,
                ]}
              >
                {state.gamesCompletedToday > i && <Text style={styles.dotCheck}>✓</Text>}
              </View>
            ))}
            <Text style={styles.dotLabel}>{state.gamesCompletedToday}/2 games</Text>
          </View>
          {state.gamesCompletedToday >= 2 && (
            <Text style={styles.streakSaved}>🔥 Streak safe for today!</Text>
          )}
        </View>

        {/* Game Cards */}
        <Text style={styles.sectionLabel}>Choose a Game</Text>
        {GAMES.map((g) => (
          <GameCard
            key={g.screen}
            title={g.title}
            emoji={g.emoji}
            highScore={highScores[g.hsKey] ?? null}
            onPress={() => onNavigate(g.screen)}
            accentColor={g.color}
          />
        ))}

        {/* Profile CTA */}
        <TouchableOpacity style={styles.profileCta} onPress={() => onNavigate('Profile')} activeOpacity={0.8}>
          <Text style={styles.profileCtaText}>View Profile & Badges →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  pointsWrap: {
    alignItems: 'flex-end',
  },
  floatingPoints: {
    position: 'absolute',
    top: 0,
    right: 0,
    color: COLORS.accentGreen,
    fontWeight: '800',
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  streakProgressRow: {
    marginTop: 14,
    gap: 6,
  },
  streakProgressLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  freezeBtn: {
    marginTop: 12,
    backgroundColor: COLORS.bgCardInner,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Active glow state when freeze is available
  freezeBtnActive: {
    borderColor: COLORS.freezeGlow,
    shadowColor: COLORS.freezeGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  freezeText: {
    color: COLORS.accentBlue,
    fontWeight: '600',
    fontSize: 14,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
    marginBottom: 4,
  },
  countdown: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontVariant: ['tabular-nums'],
  },
  countdownUrgent: {
    color: COLORS.urgentAmber,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotFilled: {
    backgroundColor: COLORS.accentGreen,
    borderColor: COLORS.accentGreen,
  },
  dotCheck: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
  dotLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginLeft: 4,
  },
  streakSaved: {
    marginTop: 10,
    color: COLORS.streakOrange,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  profileCta: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileCtaText: {
    color: COLORS.accentBlue,
    fontWeight: '700',
    fontSize: 15,
  },
});

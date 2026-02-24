import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface GameResultScreenProps {
  gameId: 'flappy' | 'maze' | 'jumper';
  score: number;
  stars?: number;      // maze only
  pointsEarned: number;
  onDoublePoints: (onComplete: () => void) => void; // calls showRewardedAd internally
  adLoading: boolean;
  onDone: () => void;  // go home
}

const GAME_LABELS: Record<string, string> = {
  flappy: 'Flappy Bird',
  maze: 'Maze Runner',
  jumper: 'Platform Jumper',
};

const GAME_EMOJI: Record<string, string> = {
  flappy: '🐦',
  maze: '🐭',
  jumper: '🕹️',
};

function StarRow({ stars }: { stars: number }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3].map((i) => (
        <Text key={i} style={[starStyles.star, i <= stars && starStyles.starFilled]}>
          ★
        </Text>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 16,
  },
  star: {
    fontSize: 36,
    fontFamily: FONTS.headingBold,
    color: COLORS.border,
  },
  starFilled: {
    color: COLORS.accentGold,
  },
});

export default function GameResultScreen({
  gameId,
  score,
  stars,
  pointsEarned,
  onDoublePoints,
  adLoading,
  onDone,
}: GameResultScreenProps) {
  const [doubled, setDoubled] = useState(false);
  const [adWatched, setAdWatched] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const displayedPoints = doubled ? pointsEarned * 2 : pointsEarned;

  const handleDoublePoints = () => {
    onDoublePoints(() => {
      setDoubled(true);
      setAdWatched(true);
    });
  };

  const scoreLabel =
    gameId === 'flappy'
      ? `${score} pipe${score !== 1 ? 's' : ''} passed`
      : gameId === 'jumper'
      ? `Height: ${score}`
      : null; // maze uses stars

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View
        style={[
          styles.card,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Game Icon + Name */}
        <Text style={styles.emoji}>{GAME_EMOJI[gameId]}</Text>
        <Text style={styles.gameName}>{GAME_LABELS[gameId]}</Text>

        {/* Stars (maze) or Score (flappy/jumper) */}
        {stars !== undefined ? (
          <>
            <StarRow stars={stars} />
            <Text style={styles.scoreLabel}>
              {stars === 3 ? 'Perfect! 🏆' : stars === 2 ? 'Great job! 👏' : 'Completed ✓'}
            </Text>
          </>
        ) : (
          scoreLabel !== null && (
            <Text style={styles.scoreLabel}>{scoreLabel}</Text>
          )
        )}

        {/* Points earned */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Points Earned</Text>
          <Text style={[styles.pointsValue, doubled && styles.pointsValueDoubled]}>
            {displayedPoints > 0 ? `+${displayedPoints}` : '—'}
          </Text>
          {doubled && (
            <Text style={styles.doubledBadge}>2× Doubled! 🎉</Text>
          )}
        </View>

        {/* Double Points Ad Offer */}
        {!adWatched && pointsEarned > 0 && (
          <View style={styles.adOfferBox}>
            <Text style={styles.adOfferTitle}>🎬 Double Your Points!</Text>
            <Text style={styles.adOfferSub}>Watch a short ad to earn {pointsEarned * 2} pts instead</Text>

            {adLoading ? (
              <View style={styles.adLoadingRow}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.adLoadingText}>Ad playing...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.watchAdBtn}
                onPress={handleDoublePoints}
                activeOpacity={0.85}
              >
                <Text style={styles.watchAdText}>Watch Ad →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Go Home */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={onDone}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnText}>← Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.bgCard,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 6,
  },
  gameName: {
    fontSize: 22,
    fontFamily: FONTS.headingBold,
    color: COLORS.text,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  pointsCard: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  pointsLabel: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  pointsValue: {
    fontSize: 52,
    fontFamily: FONTS.headingBold,
    color: COLORS.primary,
  },
  pointsValueDoubled: {
    color: COLORS.accentGreen,
  },
  doubledBadge: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.accentGreen,
    marginTop: 4,
  },
  adOfferBox: {
    width: '100%',
    backgroundColor: COLORS.bgCardInner,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adOfferTitle: {
    fontSize: 16,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  adOfferSub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  watchAdBtn: {
    backgroundColor: COLORS.accentGold,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  watchAdText: {
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  adLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  adLoadingText: {
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  homeBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
  },
  homeBtnText: {
    color: COLORS.textSub,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
  },
});

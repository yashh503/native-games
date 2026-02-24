import React, { memo, useRef } from 'react';
import { View, Text, Animated, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface GameCardProps {
  title: string;
  emoji: string;
  highScore: number | null;
  onPress: () => void;
  accentColor?: string;
}

function GameCard({ title, emoji, highScore, onPress, accentColor = COLORS.primary }: GameCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <TouchableWithoutFeedback onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.hs}>
            {highScore !== null ? `Best: ${highScore}` : 'Not played yet'}
          </Text>
        </View>
        <View style={[styles.playBtn, { backgroundColor: accentColor }]}>
          <Text style={styles.playText}>Play</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.headingSemiBold,
    color: COLORS.text,
  },
  hs: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  playBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  playText: {
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
});

// Only re-render when props actually change
export default memo(GameCard);

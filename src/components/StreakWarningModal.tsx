import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface StreakWarningModalProps {
  visible: boolean;
  streak: number;
  gamesNeeded: number;
  onPlayNow: () => void;
  onDismiss: () => void;
}

export default function StreakWarningModal({
  visible,
  streak,
  gamesNeeded,
  onPlayNow,
  onDismiss,
}: StreakWarningModalProps) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.flame}>🔥</Text>
          <Text style={styles.title}>Don't lose your {streak}-day streak!</Text>
          <Text style={styles.body}>
            You need{' '}
            <Text style={styles.highlight}>{gamesNeeded} more game{gamesNeeded > 1 ? 's' : ''}</Text>{' '}
            today to keep your streak alive.
          </Text>
          <TouchableOpacity style={styles.playBtn} onPress={onPlayNow} activeOpacity={0.85}>
            <Text style={styles.playText}>Play Now 🎮</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterBtn} onPress={onDismiss}>
            <Text style={styles.laterText}>Remind Me Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  flame: {
    fontSize: 52,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  highlight: {
    color: COLORS.streakOrange,
    fontWeight: '700',
  },
  playBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  playText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  laterBtn: {
    paddingVertical: 10,
  },
  laterText: {
    color: COLORS.textDim,
    fontSize: 14,
  },
});

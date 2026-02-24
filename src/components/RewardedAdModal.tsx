import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface RewardedAdModalProps {
  visible: boolean;
  title: string;
  description: string;
  adLoading: boolean;
  onWatch: () => void;
  onClose: () => void;
}

export default function RewardedAdModal({
  visible,
  title,
  description,
  adLoading,
  onWatch,
  onClose,
}: RewardedAdModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.icon}>🎬</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>

          {adLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.loadingText}>Ad playing...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.watchBtn} onPress={onWatch} activeOpacity={0.85}>
              <Text style={styles.watchText}>Watch Ad to Earn</Text>
            </TouchableOpacity>
          )}

          {!adLoading && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>No thanks</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.headingBold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  watchBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  watchText: {
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
    marginTop: 10,
    fontSize: 14,
  },
  closeBtn: {
    paddingVertical: 8,
  },
  closeText: {
    color: COLORS.textDim,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
});

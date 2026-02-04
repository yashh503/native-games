import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/Constants';
import { formatTime } from '../utils/Storage';

interface TimerProps {
  time: number;
}

const Timer: React.FC<TimerProps> = ({ time }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatTime(time)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.timerBg,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  time: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
});

export default Timer;

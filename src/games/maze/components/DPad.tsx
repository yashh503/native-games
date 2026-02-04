import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/Constants';

export type Direction = 'up' | 'down' | 'left' | 'right';

interface DPadProps {
  onPress: (direction: Direction) => void;
  disabled?: boolean;
}

const DPad: React.FC<DPadProps> = ({ onPress, disabled = false }) => {
  const handlePress = (direction: Direction) => {
    if (!disabled) {
      onPress(direction);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={[styles.button, disabled && styles.disabled]}
          onPress={() => handlePress('up')}
          activeOpacity={0.7}
        >
          <Text style={styles.arrow}>▲</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, disabled && styles.disabled]}
          onPress={() => handlePress('left')}
          activeOpacity={0.7}
        >
          <Text style={styles.arrow}>◀</Text>
        </TouchableOpacity>
        <View style={styles.centerSpace} />
        <TouchableOpacity
          style={[styles.button, disabled && styles.disabled]}
          onPress={() => handlePress('right')}
          activeOpacity={0.7}
        >
          <Text style={styles.arrow}>▶</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={[styles.button, disabled && styles.disabled]}
          onPress={() => handlePress('down')}
          activeOpacity={0.7}
        >
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>
    </View>
  );
};

const BUTTON_SIZE = 60;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: COLORS.dpadBg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.text,
  },
  spacer: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    margin: 4,
  },
  centerSpace: {
    width: BUTTON_SIZE * 0.5,
    height: BUTTON_SIZE,
    margin: 4,
  },
});

export default DPad;

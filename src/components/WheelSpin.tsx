import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import { COLORS, FONTS } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const WHEEL_SIZE = Math.min(SCREEN_WIDTH - 64, 300);
const CENTER = WHEEL_SIZE / 2;

const SEGMENT_COLORS = ["#4F46E5", "#7C3AED", "#EC4899", "#EA580C", "#16A34A"];

interface Slot {
  gameId: string;
  label: string;
  emoji: string;
}

interface Props {
  slots: Slot[];
  onSpinComplete: (gameId: string) => void;
}

/* ---------- SVG HELPERS ---------- */

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `
    M ${x} ${y}
    L ${start.x} ${start.y}
    A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}
    Z
  `;
};

/* ---------- COMPONENT ---------- */

export default function WheelSpin({ slots, onSpinComplete }: Props) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const currentDegRef = useRef(0);

  const [spinning, setSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const segmentAngle = 360 / slots.length;

  const handleSpin = () => {
    if (spinning) return;

    const targetIndex = Math.floor(Math.random() * slots.length);

    const landingAngle =
      360 - (targetIndex * segmentAngle + segmentAngle / 2);

    const spins = 6;
    const finalAngle =
      currentDegRef.current + spins * 360 + landingAngle;

    setSpinning(true);
    setSelectedIndex(null);

    Animated.timing(spinValue, {
      toValue: finalAngle,
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      const normalized = finalAngle % 360;
      currentDegRef.current = normalized;

      setSpinning(false);
      setSelectedIndex(targetIndex);
      onSpinComplete(slots[targetIndex].gameId);
    });
  };

  const rotate = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.pointer} />

      <Animated.View
        style={{
          transform: [{ rotate }],
        }}
      >
        <View style={styles.wheel}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
            <G>
              {slots.map((slot, i) => {
                const startAngle = i * segmentAngle;
                const endAngle = startAngle + segmentAngle;

                const path = describeArc(
                  CENTER,
                  CENTER,
                  CENTER,
                  startAngle,
                  endAngle
                );

                const midAngle = startAngle + segmentAngle / 2;
                const labelPos = polarToCartesian(
                  CENTER,
                  CENTER,
                  CENTER * 0.65,
                  midAngle
                );

                return (
                  <G key={i}>
                    <Path
                      d={path}
                      fill={
                        SEGMENT_COLORS[i % SEGMENT_COLORS.length]
                      }
                    />
                    <SvgText
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#fff"
                      fontSize="22"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {slot.emoji}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          </Svg>

          <View style={styles.wheelCenter} />
        </View>
      </Animated.View>

      <TouchableOpacity
        style={[styles.spinButton, spinning && styles.spinButtonDisabled]}
        onPress={handleSpin}
        disabled={spinning}
        activeOpacity={0.8}
      >
        <Text style={styles.spinButtonText}>
          {spinning ? "Spinning..." : "SPIN"}
        </Text>
      </TouchableOpacity>

      {selectedIndex !== null && !spinning && (
        <View style={styles.resultRow}>
          <Text style={styles.resultEmoji}>
            {slots[selectedIndex].emoji}
          </Text>
          <Text style={styles.resultLabel}>
            {slots[selectedIndex].label}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 20 },

  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.primary,
    marginBottom: -12,
    zIndex: 10,
  },

  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgCard,
  },

  wheelCenter: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bgCard,
    borderWidth: 3,
    borderColor: COLORS.primary,
    top: WHEEL_SIZE / 2 - 15,
    left: WHEEL_SIZE / 2 - 15,
  },

  spinButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    elevation: 6,
  },

  spinButtonDisabled: { opacity: 0.6 },

  spinButtonText: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    color: "#fff",
    letterSpacing: 2,
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  resultEmoji: { fontSize: 28 },

  resultLabel: {
    fontFamily: FONTS.headingBold,
    fontSize: 20,
    color: COLORS.text,
  },
});
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT } from '@/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';

export const PERSONAL_SAMPLES = [
  'Did the gym today — legs for 50 minutes',
  'Finished lesson 6 of the AI course',
  'Played badminton for an hour this evening',
  'Went for a 5 km run this morning',
  'Drank 2 litres of water today',
  'Meditated for 10 minutes before bed',
];

export const FINANCIAL_SAMPLES = [
  'Swiggy 220 and Ola 180 yesterday',
  'Amazon 1500 shopping today',
  'Grocery 480 at D-Mart this evening',
  'Petrol 2000 this morning',
  'Netflix 649 subscription',
];

// ─── Dot bounce config ────────────────────────────────────────────────────────
const DOT_UP   = -7;   // translateY when "up"
const DOT_DUR  = 290;  // ms per half-swing
const DOT_REST = 320;  // ms idle before cycling again
const STAGGER  = 200;  // ms between each dot

interface BotTypingRowProps {
  color: string;
  bgColor: string;
  onCancel: () => void;
  onResult: (text: string) => void;
  samples?: string[];
}

/**
 * Inline bot-typing animation row.
 * Mounts inside the form row when the user taps the mic.
 * After ~2.6 s it calls onResult with a sample phrase and disappears.
 */
export function BotTypingRow({
  color,
  bgColor,
  onCancel,
  onResult,
  samples = PERSONAL_SAMPLES,
}: BotTypingRowProps) {
  const { colors } = useTheme();

  // Three dots — useState lazy init avoids useRef().current lint error
  const [d1] = useState(() => new Animated.Value(0));
  const [d2] = useState(() => new Animated.Value(0));
  const [d3] = useState(() => new Animated.Value(0));

  const loops = useRef<Animated.CompositeAnimation[]>([]);

  const stopLoops = useCallback(() => {
    loops.current.forEach((a) => a.stop());
    loops.current = [];
  }, []);

  useEffect(() => {
    const makeDot = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: DOT_DUR, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: DOT_DUR, useNativeDriver: true }),
          Animated.delay(DOT_REST),
        ])
      );

    loops.current = [makeDot(d1, 0), makeDot(d2, STAGGER), makeDot(d3, STAGGER * 2)];
    loops.current.forEach((a) => a.start());

    // "Transcription" arrives after ~2.6 s
    const t = setTimeout(() => {
      stopLoops();
      const text = samples[Math.floor(Math.random() * samples.length)];
      onResult(text);
    }, 2600);

    return () => {
      clearTimeout(t);
      stopLoops();
    };
    // Intentionally omits onResult / samples — they are read once at mount;
    // callers should not change them between mount and the 2.6 s result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d1, d2, d3, stopLoops]);

  const dotStyle = (v: Animated.Value) => ({
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, DOT_UP] }) }],
    opacity: v.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.4, 1, 0.4] }),
  });

  return (
    <View style={styles.botRow}>
      {/* Bot avatar */}
      <View style={[styles.botAvatar, { backgroundColor: bgColor }]}>
        <Text style={styles.botEmoji}>🤖</Text>
      </View>

      {/* Typing bubble */}
      <View style={[styles.bubble, { backgroundColor: bgColor }]}>
        {[d1, d2, d3].map((d, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { backgroundColor: color }, dotStyle(d)]}
          />
        ))}
      </View>

      {/* Cancel × */}
      <Pressable
        onPress={onCancel}
        hitSlop={10}
        style={[styles.cancelBtn, { backgroundColor: colors.surface2 }]}
      >
        <Text style={[styles.cancelX, { color: colors.ink3 }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  botRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  botEmoji: { fontSize: 17, lineHeight: 22 },
  bubble: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dot: { width: 7, height: 7, borderRadius: 99 },
  cancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cancelX: { fontFamily: FONT.figtree700, fontSize: 13 },
});

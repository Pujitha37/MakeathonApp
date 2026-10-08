import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

// Simple progress track + fill, ported from `.bar > span`.
export function ProgressBar({ pct, color, height = 10 }: { pct: number; color: string; height?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.surface2, height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${Math.max(0, Math.min(100, pct * 100))}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

// Multi-segment stacked bar, ported from `.stackbar` (hero spending breakdown).
export function StackBar({ segments, height = 12 }: { segments: { value: number; color: string }[]; height?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <View style={[styles.stack, { height, borderRadius: height / 2 }]}>
      {segments.map((s, i) => (
        <View
          key={i}
          style={{
            width: `${(s.value / total) * 100}%`,
            height: '100%',
            backgroundColor: s.color,
            marginRight: i < segments.length - 1 ? 2 : 0,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  stack: {
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,.15)',
  },
});

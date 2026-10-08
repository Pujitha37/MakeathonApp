// Ported from `.toggle` — a 50x30 pill switch with a sliding 24px thumb.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.track, { backgroundColor: on ? colors.indigo : colors.line }]}>
      <View style={[styles.thumb, { left: on ? 23 : 3 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 999,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    top: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});

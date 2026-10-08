// Ported from `.stepper` in finprofile.html.
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

export function Stepper({ value, onChange, step = 500 }: { value: number; onChange: (v: number) => void; step?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(Math.max(0, value - step))}
        style={[styles.btn, { backgroundColor: colors.surface2 }]}
      >
        <AppText type="titleLg">−</AppText>
      </Pressable>
      <TextInput
        value={String(value)}
        onChangeText={(t) => onChange(+t.replace(/\D/g, '') || 0)}
        keyboardType="numeric"
        style={[styles.input, { color: colors.ink }]}
      />
      <Pressable onPress={() => onChange(value + step)} style={[styles.btn, { backgroundColor: colors.surface2 }]}>
        <AppText type="titleLg">+</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginVertical: 14 },
  btn: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: { width: 150, textAlign: 'center', fontSize: 32, fontWeight: '800' },
});

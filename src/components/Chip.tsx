import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { AppText } from './AppText';

interface ChipProps {
  label: string;
  on?: boolean;
  onPress?: () => void;
}

export function Chip({ label, on, onPress }: ChipProps) {
  const { colors, shadow } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: on ? colors.ink : colors.surface, ...(on ? {} : shadow) },
      ]}
    >
      <AppText type="captionMed" color={on ? colors.paper : colors.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

interface ChipRowProps {
  children: React.ReactNode;
  style?: any;
}

export function ChipRow({ children, style }: ChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    marginRight: 8,
  },
  row: {
    paddingVertical: 2,
  },
});

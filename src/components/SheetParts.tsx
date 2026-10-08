// Shared bottom-sheet building blocks, ported from `.sheet h2` / `.sheet .lead` / `.setrow`.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { Toggle } from './Toggle';

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return (
    <AppText type="titleLg" style={{ marginBottom: 4 }}>
      {children}
    </AppText>
  );
}

export function SheetLead({ children }: { children: React.ReactNode }) {
  return (
    <AppText type="label" muted style={{ marginBottom: 14 }}>
      {children}
    </AppText>
  );
}

interface SettingRowProps {
  title: string;
  desc?: string;
  on: boolean;
  onToggle: () => void;
  divider?: boolean;
}

export function SettingRow({ title, desc, on, onToggle, divider = true }: SettingRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
      <View style={{ flex: 1 }}>
        <AppText type="labelMed">{title}</AppText>
        {desc && (
          <AppText type="captionSm" muted>
            {desc}
          </AppText>
        )}
      </View>
      <Toggle on={on} onPress={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
});

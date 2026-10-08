import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { AppText } from './AppText';
import type { StatusTone } from '@/lib/recurring';

interface StatusChipProps {
  tone: StatusTone;
  label: string;
}

export function StatusChip({ tone, label }: StatusChipProps) {
  const { colors, dark } = useTheme();
  const map: Record<StatusTone, { bg: string; fg: string }> = {
    ok: { bg: colors.sageSoft, fg: colors.sage },
    warn: { bg: colors.marigoldSoft, fg: dark ? colors.marigold : '#9A6200' },
    bad: { bg: colors.coralSoft, fg: colors.coral },
    info: { bg: colors.indigoSoft, fg: colors.indigo },
  };
  const c = map[tone];
  return (
    <View style={[styles.base, { backgroundColor: c.bg }]}>
      <AppText type="micro" color={c.fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});

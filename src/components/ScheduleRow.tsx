// Ported from `tlRow()` in finprofile.html (October schedule timeline row).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fmt } from '@/lib/format';
import { TODAY } from '@/data/seed';
import type { ScheduleItem } from '@/lib/recurring';
import { AppText } from './AppText';
import { StatusChip } from './StatusChip';

export function ScheduleRow({ item, withStatus = true, divider = true }: { item: ScheduleItem; withStatus?: boolean; divider?: boolean }) {
  const { colors } = useTheme();
  const past = item.day < TODAY.getDate();
  return (
    <View style={[styles.row, divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
      <View style={[styles.day, { backgroundColor: colors.surface2, opacity: past ? 0.55 : 1 }]}>
        <AppText type="numMd" style={{ fontSize: 20, lineHeight: 22 }}>
          {item.day}
        </AppText>
        <AppText type="captionSm" muted>
          Oct
        </AppText>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText type="bodyMed" numberOfLines={1}>
          {item.emoji} {item.name}
          {item.emi ? '  ' : ''}
          {item.emi && (
            <AppText type="tag" color={colors.marigold}>
              {' '}
              EMI
            </AppText>
          )}
        </AppText>
        <AppText type="captionSm" muted>
          {item.sub}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <AppText type="bodyMed" num>
          {fmt(item.amt)}
        </AppText>
        {withStatus && <StatusChip tone={item.st.s} label={item.st.l} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  day: { width: 48, alignItems: 'center', paddingVertical: 6, borderRadius: 14 },
});

// Ported from `.budget` block (used on both Home's mini list and the full Plan > Budgets tab).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { CAT, CatId, icoBg } from '@/theme/tokens';
import { fmt } from '@/lib/format';
import type { BudgetStatus } from '@/lib/calc';
import { AppText } from './AppText';
import { ProgressBar } from './Bars';
import { Button } from './Button';

interface BudgetRowProps {
  cat: CatId;
  status: BudgetStatus;
  showFoot?: boolean;
  perDay?: boolean;
  onEdit?: () => void;
  divider?: boolean;
}

export function BudgetRow({ cat, status: s, showFoot, perDay, onEdit, divider = true }: BudgetRowProps) {
  const { colors } = useTheme();
  const c = CAT[cat];
  const col = s.pct >= 1 ? colors.coral : s.pct >= 0.75 ? colors.marigold : colors.sage;

  return (
    <View style={[styles.wrap, divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
      <View style={styles.top}>
        <View style={[styles.ico, { backgroundColor: icoBg(c.color) }]}>
          <AppText style={{ fontSize: 17 }}>{c.emoji}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText type="h3">{c.label}</AppText>
          {showFoot && (
            <AppText type="captionSm" muted num>
              {fmt(s.spent)} of {fmt(s.b)}
            </AppText>
          )}
        </View>
        {onEdit ? (
          <Button label="Edit" sm variant="soft" onPress={onEdit} />
        ) : (
          <AppText type="bodyMed" num>
            {fmt(s.spent)}
            <AppText type="caption" faint>
              {' '}
              / {fmt(s.b)}
            </AppText>
          </AppText>
        )}
      </View>
      <ProgressBar pct={s.pct} color={col} />
      {showFoot && (
        <View style={styles.foot}>
          <AppText type="captionSm" muted num>
            {s.left >= 0 ? `${fmt(s.left)} left` : `${fmt(-s.left)} over`}
          </AppText>
          {perDay && s.left > 0 ? (
            <AppText type="captionSm" muted num>
              about {fmt(s.perDay)}/day for {s.daysLeft} days
            </AppText>
          ) : (
            <AppText type="captionSm" muted>
              {Math.round(s.pct * 100)}% used
            </AppText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  ico: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  foot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
});

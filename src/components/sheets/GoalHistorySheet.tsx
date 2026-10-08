// Ported from `goalHist()` in finprofile.html.
import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { SheetTitle, SheetLead } from '@/components/SheetParts';
import { useTheme } from '@/theme/ThemeProvider';
import { fd, fmt } from '@/lib/format';
import type { Goal } from '@/data/types';

export function GoalHistorySheetContent({ goal }: { goal: Goal }) {
  const { colors } = useTheme();
  return (
    <View>
      <SheetTitle>
        {goal.emoji} {goal.name}
      </SheetTitle>
      <SheetLead>Recorded contributions</SheetLead>
      {goal.contrib
        .slice()
        .reverse()
        .map((c, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 10,
              borderTopWidth: i > 0 ? 1 : 0,
              borderTopColor: colors.line,
            }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' }}>
              <AppText style={{ fontSize: 18 }}>➕</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText type="bodyMed">Contribution</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText type="bodyMed" num>
                {fmt(c[1])}
              </AppText>
              <AppText type="captionSm" faint num>
                {fd(c[0])}
              </AppText>
            </View>
          </View>
        ))}
    </View>
  );
}

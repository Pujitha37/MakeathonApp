// Ported from `barsHTML()` in finprofile.html.
import React from 'react';
import { View } from 'react-native';
import { fmt } from '@/lib/format';
import type { Bar } from '@/lib/ask-engine';
import { AppText } from './AppText';
import { ProgressBar } from './Bars';

export function AnswerBars({ bars }: { bars: Bar[] }) {
  const mx = Math.max(...bars.map((b) => b.value), 1);
  return (
    <View style={{ marginTop: 10, gap: 8 }}>
      {bars.map((b, i) => (
        <View key={i}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText type="captionMed" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
              {b.label}
            </AppText>
            <AppText type="captionMed" num>
              {fmt(b.value)}
            </AppText>
          </View>
          <View style={{ marginTop: 3 }}>
            <ProgressBar pct={b.value / mx} color={b.color} height={8} />
          </View>
        </View>
      ))}
    </View>
  );
}

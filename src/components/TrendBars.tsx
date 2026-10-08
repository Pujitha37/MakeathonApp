// Ported from the "Spending over time" trend chart in `insightsHTML()`.
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { coverageEnd, expenses, monthBounds, sum } from '@/lib/calc';
import { fd, fmt, minD, MON } from '@/lib/format';
import { TODAY } from '@/data/seed';
import { AppText } from './AppText';

interface Bar {
  l: string;
  v: number;
  partial: boolean;
}

export function TrendBars() {
  const { colors } = useTheme();
  const trend = useStore((s) => s.trend);
  const setTrend = useStore((s) => s.setTrend);
  const { tx, stmts, scope } = useStore(useShallow((s) => ({ tx: s.tx, stmts: s.stmts, scope: s.scope })));

  const bars = useMemo<Bar[]>(() => {
    if (trend === 'weekly') {
      const end = minD(coverageEnd(stmts, scope), TODAY);
      const out: Bar[] = [];
      for (let i = 7; i >= 0; i--) {
        const e = new Date(end);
        e.setDate(e.getDate() - i * 7);
        const s = new Date(e);
        s.setDate(s.getDate() - 6);
        out.push({ l: fd(s), v: sum(expenses(tx, scope, s, e)), partial: false });
      }
      return out;
    }
    return [6, 7, 8, 9].map((m) => {
      const b = monthBounds(stmts, scope, 2026, m);
      return { l: MON[m], v: b.has ? sum(expenses(tx, scope, b.start, b.cov)) : 0, partial: b.has && !b.complete };
    });
  }, [trend, tx, stmts, scope]);

  const [shown, setShown] = useState(bars.length - 1);
  // Reset the highlighted bar when the dataset identity changes (switching weekly/monthly or scope).
  const barsKey = bars.map((b) => b.l).join('|');
  const [lastKey, setLastKey] = useState(barsKey);
  if (barsKey !== lastKey) {
    setLastKey(barsKey);
    setShown(bars.length - 1);
  }

  const mx = Math.max(...bars.map((b) => b.v), 1);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText type="h3">Spending over time</AppText>
        <View style={[styles.seg, { backgroundColor: colors.surface2 }]}>
          {(['weekly', 'monthly'] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setTrend(k)}
              style={[styles.segBtn, trend === k && { backgroundColor: colors.surface }]}
            >
              <AppText type="captionMed" color={trend === k ? colors.ink : colors.ink2}>
                {k === 'weekly' ? 'Weekly' : 'Monthly'}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.chart}>
        {bars.map((b, i) => {
          const on = i === shown && !b.partial;
          return (
            <Pressable key={i} onPress={() => setShown(i)} style={styles.col}>
              <AppText type="micro" color={colors.ink} style={{ minHeight: 15 }}>
                {i === shown ? fmt(b.v) : ''}
              </AppText>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(3, (b.v / mx) * 100)}%`,
                    backgroundColor: on ? colors.indigo : colors.indigoSoft,
                  },
                  b.partial && { borderWidth: 1.5, borderColor: colors.indigo, borderStyle: 'dashed', opacity: 0.8 },
                ]}
              />
              <AppText type="micro" muted>
                {b.l}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText type="captionSm" muted style={{ marginTop: 8 }}>
        {trend === 'weekly' ? 'Each bar is 7 days ending on the date shown.' : 'Striped bar = month still in progress.'} Tap a
        bar to see its total.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderRadius: 14, padding: 3, gap: 2 },
  segBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 11 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 150, paddingTop: 20, marginTop: 4 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 6 },
  bar: { width: '100%', borderRadius: 10, minHeight: 4 },
});

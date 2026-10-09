// Ported from `insightsHTML()` in finprofile.html.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Segmented } from '@/components/Segmented';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Donut } from '@/components/Donut';
import { TrendBars } from '@/components/TrendBars';
import { AdviceCard } from '@/components/AdviceCard';
import { SectionTitle } from '@/components/SectionTitle';
import { ProgressBar } from '@/components/Bars';
import { useSheet } from '@/components/Sheet';
import { GroupedTxList } from '@/components/GroupedTxList';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { byCat, coverageEnd, expenses, insightsRange, sum } from '@/lib/calc';
import { adviceList } from '@/lib/advice';
import { fd, fmt } from '@/lib/format';
import { SOURCES } from '@/data/types';
import { CAT, icoBg } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function InsightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const sheet = useSheet();
  const { tx, stmts, scope, budgets, goals, dismissed, insPeriod, selCat } = useStore(useShallow((s) => ({
    tx: s.tx,
    stmts: s.stmts,
    scope: s.scope,
    budgets: s.budgets,
    goals: s.goals,
    dismissed: s.dismissed,
    insPeriod: s.insPeriod,
    selCat: s.selCat,
  })));
  const setInsPeriod = useStore((s) => s.setInsPeriod);
  const setSelCat = useStore((s) => s.setSelCat);

  const r = insightsRange(stmts, scope, insPeriod);
  const adv = adviceList(tx, stmts, scope, budgets, goals, dismissed);

  return (
    <Screen title="Insights" screen="insights">
      <Segmented
        options={[
          { key: 'this', label: 'This month' },
          { key: 'last', label: 'Last month' },
          { key: '3m', label: 'Last 3 months' },
        ]}
        value={insPeriod}
        onChange={setInsPeriod}
      />

      {!r.has ? (
        <EmptyState scope={scope} coverageEndDate={coverageEnd(stmts, scope)} hasStmts={stmts.some((s) => s.source === scope)} />
      ) : (
        (() => {
          const list = expenses(tx, scope, r.start, r.cov);
          const total = sum(list);
          const cats = byCat(list);
          const sel = selCat && cats.some(([c]) => c === selCat) ? selCat : null;

          return (
            <>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0 }}>
                  <AppText type="h3">Where it went</AppText>
                  <AppText type="caption" muted>
                    {fd(r.start)}–{fd(r.cov)}
                  </AppText>
                </View>
                <Donut cats={cats} total={total} selected={selCat} onSelect={setSelCat} />
                {sel ? (
                  <Button
                    label={`View ${list.filter((t) => t.cat === sel).length} transactions`}
                    variant="soft"
                    onPress={() =>
                      sheet.open(
                        <View>
                          <AppText type="titleLg" style={{ marginBottom: 4 }}>
                            {CAT[sel].label}
                          </AppText>
                          <AppText type="label" muted style={{ marginBottom: 14 }}>
                            {r.label}, {fd(r.start)}–{fd(r.cov)}. Source: {SOURCES[scope].label}.
                          </AppText>
                          <GroupedTxList list={list.filter((t) => t.cat === sel)} />
                        </View>,
                        ['70%', '92%'],
                      )
                    }
                  />
                ) : (
                  <AppText type="label" muted>
                    Tap a slice or a category to see its transactions
                  </AppText>
                )}
                <View style={{ marginTop: 8 }}>
                  {cats.map(([c, v], i) => (
                    <Pressable
                      key={c}
                      onPress={() => setSelCat(c)}
                      style={[styles.catrow, sel === c && { backgroundColor: colors.surface2 }]}
                    >
                      <View style={[styles.ico, { backgroundColor: icoBg(CAT[c].color) }]}>
                        <AppText style={{ fontSize: 20 }}>{CAT[c].emoji}</AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                          <AppText type="bodyMed">{CAT[c].label}</AppText>
                          <AppText type="bodyMed" num>
                            {fmt(v)}
                          </AppText>
                        </View>
                        <View style={{ marginTop: 6 }}>
                          <ProgressBar pct={v / cats[0][1]} color={CAT[c].color} height={6} />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </Card>

              <Card>
                <TrendBars />
              </Card>

              <SectionTitle label="What this means" action={adv.length > 1 ? `See all ${adv.length}` : undefined} onAction={() => router.push('/advice')} />
              {adv.length ? (
                adv.slice(0, 2).map((a) => <AdviceCard key={a.id} item={a} />)
              ) : (
                <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <AppText style={{ fontSize: 26 }}>🌤️</AppText>
                  <AppText type="label" muted style={{ flex: 1 }}>
                    Nothing stands out in {SOURCES[scope].label} for this period. Advice appears here when a budget, trend
                    or goal needs a look.
                  </AppText>
                </Card>
              )}
            </>
          );
        })()
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  catrow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14 },
  ico: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

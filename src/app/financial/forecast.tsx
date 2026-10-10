// Pi-backed forecast: GET /forecast?category_id=…
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { StatusChip } from '@/components/StatusChip';
import { useTheme } from '@/theme/ThemeProvider';
import { financialApi, fmtPaise, type ForecastResponse, type PiCategoryId } from '@/lib/financialApi';
import { PI_CATEGORY_LIST, piCatColor, piCatEmoji, piCatLabel } from '@/lib/catMap';

export default function ForecastScreen() {
  const { colors } = useTheme();
  const [cat, setCat] = useState<PiCategoryId | undefined>(undefined); // undefined = all categories
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const f = await financialApi.forecast(cat);
      setData(f);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    } finally {
      setLoading(false);
    }
  }, [cat]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const maxDaily = data?.daily_spending.reduce((m, d) => Math.max(m, d.total_paise), 0) ?? 1;

  return (
    <Screen title="Forecast" screen="forecast" showBack showScopeBar={false}>
      <AppText type="label" muted style={{ marginHorizontal: 4, marginBottom: 10 }}>
        Live projection from the Pi based on this month&apos;s run rate.
      </AppText>

      {/* Category selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
        <Pressable
          onPress={() => setCat(undefined)}
          style={[styles.catChip, { backgroundColor: cat === undefined ? colors.indigo : colors.surface, borderColor: colors.indigo }]}
        >
          <AppText type="captionMed" style={{ color: cat === undefined ? '#fff' : colors.indigo }}>All</AppText>
        </Pressable>
        {PI_CATEGORY_LIST.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCat(c)}
            style={[styles.catChip, { backgroundColor: cat === c ? piCatColor(c) : colors.surface, borderColor: piCatColor(c) }]}
          >
            <AppText type="captionMed" style={{ fontSize: 12, color: cat === c ? '#fff' : colors.ink }}>
              {piCatEmoji(c)} {piCatLabel(c)}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      {loading && (
        <Card style={{ alignItems: 'center', paddingVertical: 32, marginTop: 12 }}>
          <ActivityIndicator color={colors.indigo} />
        </Card>
      )}

      {!loading && error && (
        <Card style={{ backgroundColor: colors.marigoldSoft, marginTop: 12 }}>
          <AppText type="labelMed" color={colors.marigold}>Pi not reachable</AppText>
          <AppText type="caption" muted style={{ marginTop: 4 }}>{error}</AppText>
        </Card>
      )}

      {!loading && !error && data && !data.ok && (
        <Card style={{ marginTop: 12 }}>
          <AppText type="h3">Not enough data</AppText>
          <AppText type="label" muted style={{ marginTop: 4 }}>{data.reason}</AppText>
        </Card>
      )}

      {!loading && !error && data && data.ok && (
        <>
          {/* Projection card */}
          <Card style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <AppText type="h3">
                {cat ? `${piCatEmoji(cat)} ${piCatLabel(cat)}` : 'All categories'}
              </AppText>
              {data.budget_paise != null && (
                <StatusChip
                  tone={data.over_budget ? 'warn' : 'ok'}
                  label={data.over_budget ? 'May exceed budget' : 'Within budget'}
                />
              )}
            </View>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <AppText type="caption" muted>Actual so far</AppText>
                <AppText type="h3" num style={{ fontSize: 22 }}>{fmtPaise(data.actual_paise)}</AppText>
                <AppText type="captionSm" muted>{data.expense_count} txns · {data.elapsed_days} days</AppText>
              </View>
              <View style={styles.stat}>
                <AppText type="caption" muted>Month-end projection</AppText>
                <AppText type="h3" num style={{ fontSize: 22, color: data.over_budget ? colors.marigold : colors.indigo }}>
                  {fmtPaise(data.projected_paise)}
                </AppText>
                {data.budget_paise != null && (
                  <AppText type="captionSm" muted>Budget {fmtPaise(data.budget_paise)}</AppText>
                )}
              </View>
            </View>
            {data.over_budget && data.budget_paise != null && (
              <View style={[styles.overBox, { backgroundColor: colors.marigoldSoft }]}>
                <AppText type="captionMed" color={colors.marigold}>
                  About {fmtPaise(data.projected_paise - data.budget_paise)} over your limit by month-end
                </AppText>
              </View>
            )}
          </Card>

          {/* Calculation */}
          <Card>
            <AppText type="captionMed" muted style={{ letterSpacing: 1 }}>CALCULATION</AppText>
            <AppText type="label" style={{ marginTop: 6, fontVariant: ['tabular-nums'] }}>{data.calculation}</AppText>
          </Card>

          {/* Daily spending bars */}
          {data.daily_spending.length > 0 && (
            <Card>
              <AppText type="h3">Daily spending</AppText>
              <AppText type="caption" muted style={{ marginBottom: 10 }}>Last {data.elapsed_days} days of {data.days_in_month}</AppText>
              <View style={styles.barWrap}>
                {data.daily_spending.map((d) => {
                  const h = Math.max(4, (d.total_paise / maxDaily) * 100);
                  const day = parseInt(d.posted_date.split('-')[2], 10);
                  return (
                    <View key={d.posted_date} style={styles.barCell}>
                      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <View style={{ height: h, borderRadius: 4, backgroundColor: cat ? piCatColor(cat) : colors.indigo }} />
                      </View>
                      <AppText type="caption" muted style={{ fontSize: 9, marginTop: 4 }}>{day}</AppText>
                    </View>
                  );
                })}
              </View>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  catChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1 },
  statRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
  stat: { flex: 1 },
  overBox: { marginTop: 12, padding: 10, borderRadius: 12 },
  barWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 130 },
  barCell: { flex: 1, alignItems: 'center' },
});

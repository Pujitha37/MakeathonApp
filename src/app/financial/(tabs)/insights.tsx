// Pi-backed Insights: /summary + /comparisons.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Segmented } from '@/components/Segmented';
import { Button } from '@/components/Button';
import { SectionTitle } from '@/components/SectionTitle';
import { useTheme } from '@/theme/ThemeProvider';
import {
  financialApi,
  fmtPaise,
  monthStartISO,
  monthEndExclusiveISO,
  todayISO,
  type Advice,
  type ComparisonsResponse,
  type PiCategoryId,
  type SummaryResponse,
} from '@/lib/financialApi';
import { piCatColor, piCatEmoji, piCatLabel } from '@/lib/catMap';

type Period = 'this' | 'last' | '3m';

function rangeFor(p: Period): { start: string; end: string; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  if (p === 'this') {
    return { start: monthStartISO(), end: monthEndExclusiveISO(), label: 'this month to date' };
  }
  if (p === 'last') {
    const start = `${y}-${pad(m)}-01`; // previous month, since getMonth is 0-indexed
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 1);
    const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { start: iso(startDate), end: iso(endDate), label: 'last month' };
  }
  // last 3 months
  const start = new Date(y, m - 2, 1);
  return {
    start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`,
    end: monthEndExclusiveISO(),
    label: 'last 3 months',
  };
}

export default function InsightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [period, setPeriod] = useState<Period>('this');
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [compare, setCompare] = useState<ComparisonsResponse | null>(null);
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [selected, setSelected] = useState<PiCategoryId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const r = useMemo(() => rangeFor(period), [period]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c, a] = await Promise.all([
        financialApi.summary(r.start, r.end),
        period === 'this' ? financialApi.comparisons().catch(() => null) : Promise.resolve(null),
        financialApi.advice().catch(() => []),
      ]);
      setSummary(s);
      setCompare(c);
      setAdvice(a);
      setSelected(null);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    } finally {
      setLoading(false);
    }
  }, [r, period]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const cats = summary?.category_breakdown ?? [];
  const total = summary?.gross_expense_paise ?? 0;
  const selValue = selected ? cats.find((c) => c.category_id === selected)?.gross_expense_paise ?? 0 : total;

  return (
    <Screen title="Insights" screen="insights" showScopeBar={false}>
      <Segmented
        options={[
          { key: 'this', label: 'This month' },
          { key: 'last', label: 'Last month' },
          { key: '3m', label: 'Last 3 months' },
        ]}
        value={period}
        onChange={(v) => setPeriod(v as Period)}
      />

      {loading && (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <ActivityIndicator color={colors.indigo} />
        </View>
      )}

      {!loading && error && (
        <Card style={{ backgroundColor: colors.marigoldSoft }}>
          <AppText type="labelMed" color={colors.marigold}>Pi not reachable</AppText>
          <AppText type="caption" muted style={{ marginTop: 4 }}>{error}</AppText>
        </Card>
      )}

      {!loading && !error && summary && (
        <>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <AppText type="caption" muted>{r.label}</AppText>
                <AppText type="h3" num style={{ fontSize: 26, marginTop: 4 }}>{fmtPaise(selValue)}</AppText>
                <AppText type="caption" muted>
                  {selected
                    ? `${piCatLabel(selected)} · ${Math.round((selValue / total) * 100)}% of spending`
                    : `${summary.expense_count} transactions · ${r.start} to ${r.end}`}
                </AppText>
              </View>
            </View>

            {cats.length > 0 ? (
              <View style={{ marginTop: 16 }}>
                {cats.map((c) => {
                  const pct = total ? (c.gross_expense_paise / total) * 100 : 0;
                  const isSel = selected === c.category_id;
                  const dim = selected && !isSel ? 0.4 : 1;
                  return (
                    <Pressable
                      key={c.category_id}
                      onPress={() => setSelected(isSel ? null : c.category_id)}
                      style={[styles.catRow, isSel && { backgroundColor: colors.surface2 }]}
                    >
                      <View style={[styles.ico, { backgroundColor: piCatColor(c.category_id) + '22', opacity: dim }]}>
                        <AppText style={{ fontSize: 18 }}>{piCatEmoji(c.category_id)}</AppText>
                      </View>
                      <View style={{ flex: 1, opacity: dim }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <AppText type="bodyMed">{piCatLabel(c.category_id)}</AppText>
                          <AppText type="bodyMed" num>{fmtPaise(c.gross_expense_paise)}</AppText>
                        </View>
                        <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.line, marginTop: 4, overflow: 'hidden' }}>
                          <View style={{ height: '100%', width: `${pct}%`, backgroundColor: piCatColor(c.category_id) }} />
                        </View>
                        <AppText type="captionSm" muted style={{ marginTop: 2 }}>
                          {c.count} txn{c.count !== 1 ? 's' : ''} · {Math.round(pct)}%
                        </AppText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <AppText type="label" muted style={{ marginTop: 10 }}>
                No spending in this period yet.
              </AppText>
            )}
          </Card>

          {/* Per-category comparison */}
          {compare && compare.category_comparison && compare.category_comparison.length > 0 && (
            <Card>
              <AppText type="h3">vs same days last month</AppText>
              <AppText type="caption" muted style={{ marginBottom: 10 }}>Per-category delta</AppText>
              {compare.category_comparison.slice(0, 8).map((c) => {
                const up = c.delta_paise > 0;
                return (
                  <View key={c.category_id} style={styles.cmpRow}>
                    <AppText type="captionMed" style={{ flex: 1 }}>
                      {piCatEmoji(c.category_id)} {piCatLabel(c.category_id)}
                    </AppText>
                    <AppText type="captionMed" num style={{ color: up ? colors.marigold : colors.sage }}>
                      {up ? '↑' : '↓'} {fmtPaise(Math.abs(c.delta_paise))} ({c.change_percent ?? '—'}%)
                    </AppText>
                  </View>
                );
              })}
            </Card>
          )}

          {/* Advice */}
          {advice.length > 0 && (
            <>
              <SectionTitle label="What this means" action={`See all ${advice.length}`} onAction={() => router.push('/financial/advice')} />
              {advice.slice(0, 2).map((a) => {
                const tc = a.tone === 'good' ? colors.sage : colors.marigold;
                const ts = a.tone === 'good' ? colors.sageSoft : colors.marigoldSoft;
                return (
                  <Card key={a.id} style={{ borderLeftWidth: 4, borderLeftColor: tc, backgroundColor: ts }}>
                    <AppText type="h3" style={{ fontSize: 15 }}>{a.title}</AppText>
                    <AppText type="label" muted style={{ marginTop: 4 }}>{a.body}</AppText>
                  </Card>
                );
              })}
            </>
          )}

          <Button
            label="Open forecast"
            variant="soft"
            block
            onPress={() => router.push('/financial/forecast')}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 14, marginBottom: 2 },
  ico: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cmpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
});

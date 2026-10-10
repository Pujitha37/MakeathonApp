// Pi-backed Home: /summary, /comparisons, /budgets/status, /recurring, /loans, /advice preview.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { StatusChip } from '@/components/StatusChip';
import { QuickAddCard } from '@/components/QuickAddCard';
import { SectionTitle } from '@/components/SectionTitle';
import { useTheme } from '@/theme/ThemeProvider';
import {
  financialApi,
  fmtPaise,
  monthStartISO,
  monthEndExclusiveISO,
  type Advice,
  type BudgetStatus,
  type ComparisonsResponse,
  type Loan,
  type Recurring,
  type SummaryResponse,
} from '@/lib/financialApi';
import { piCatColor, piCatEmoji, piCatLabel } from '@/lib/catMap';

const ASK_CHIPS: [string, string][] = [
  ['Food this month', 'How much did I spend on food this month?'],
  ['Biggest', 'Biggest expenses this month'],
  ['vs last month', 'Compare spending with last month'],
  ['EMIs', 'How much do I pay in EMIs?'],
];

function HomeAskCard({ router }: { router: ReturnType<typeof useRouter> }) {
  const { colors, shadow } = useTheme();
  const [text, setText] = useState('');
  const go = (q: string) => {
    if (!q.trim()) return;
    router.push({ pathname: '/financial/ask', params: { q } });
  };
  return (
    <Card style={{ padding: 12 }}>
      <View style={[askStyles.inputRow, { backgroundColor: colors.surface2 }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => go(text)}
          placeholder="Ask the Pi about your spending"
          placeholderTextColor={colors.ink3}
          style={[askStyles.input, { color: colors.ink }]}
          returnKeyType="send"
        />
        <Pressable onPress={() => go(text)} style={[askStyles.sendBtn, { backgroundColor: colors.indigo }]}>
          <Icon name="send" size={20} color="#fff" />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {ASK_CHIPS.map(([label, query]) => (
          <Pressable key={label} onPress={() => go(query)} style={[askStyles.chip, { backgroundColor: colors.surface, ...shadow }]}>
            <AppText type="captionMed">{label}</AppText>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [comparisons, setComparisons] = useState<ComparisonsResponse | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, c, b, r, l, a] = await Promise.all([
        financialApi.summary(monthStartISO(), monthEndExclusiveISO()),
        financialApi.comparisons().catch(() => null),
        financialApi.budgetsStatus().catch(() => []),
        financialApi.recurring().catch(() => []),
        financialApi.loans().catch(() => []),
        financialApi.advice().catch(() => []),
      ]);
      setSummary(s);
      setComparisons(c);
      setBudgetStatus(b);
      setRecurring(r);
      setLoans(l.filter((x) => !x.done && !x.archived));
      setAdvice(a);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const activeLoans = loans;
  const monthlyEmi = activeLoans.reduce((a, l) => a + l.emi_paise, 0);
  const monthlyRecurring = recurring.reduce((a, r) => a + r.amount_paise, 0);
  const committedTotal = monthlyEmi + monthlyRecurring;
  const now = new Date();
  const monthLabel = now.toLocaleString('en', { month: 'long', year: 'numeric' });

  return (
    <Screen title="Money" subtitle={`${monthLabel} · live from Pi`} screen="home" showScopeBar={false}>
      {/* Hero: live summary */}
      <Card style={{ backgroundColor: colors.heroBg, paddingVertical: 28, paddingHorizontal: 24 }}>
        <AppText type="captionMed" style={{ color: colors.onIndigo, opacity: 0.75, letterSpacing: 1.2, fontSize: 11 }}>
          THIS MONTH TO DATE
        </AppText>
        {loading && !summary ? (
          <View style={{ paddingVertical: 28, alignItems: 'flex-start' }}>
            <ActivityIndicator color={colors.onIndigo} />
          </View>
        ) : error ? (
          <View style={{ marginTop: 14 }}>
            <AppText type="h3" style={{ color: colors.onIndigo }}>Pi not reachable</AppText>
            <AppText type="caption" style={{ color: colors.onIndigo, opacity: 0.8, marginTop: 6 }}>{error}</AppText>
            <Pressable
              onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }}
              style={{ marginTop: 16, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.onIndigo, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 16 }}
            >
              <AppText type="captionMed" style={{ color: colors.onIndigo }}>Try again</AppText>
            </Pressable>
          </View>
        ) : summary && (
          <View style={{ marginTop: 10 }}>
            <AppText style={{ color: colors.onIndigo, fontSize: 44, fontWeight: '800', lineHeight: 52, fontVariant: ['tabular-nums'] }}>
              {fmtPaise(summary.net_spending_paise)}
            </AppText>
            <AppText type="caption" style={{ color: colors.onIndigo, opacity: 0.8, marginTop: 6, lineHeight: 18 }}>
              {summary.expense_count} expenses · {summary.start_date} to {summary.end_date_exclusive}
            </AppText>
            {comparisons && comparisons.delta_net_paise !== undefined && (
              <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 99 }}>
                  <AppText type="captionMed" style={{ color: colors.onIndigo }}>
                    {comparisons.delta_net_paise >= 0 ? '↑' : '↓'} {fmtPaise(Math.abs(comparisons.delta_net_paise))} vs same days last month
                  </AppText>
                </View>
              </View>
            )}
          </View>
        )}
      </Card>

      {/* Quick Add — Pi-powered parse */}
      <QuickAddCard />

      {/* Ask shortcut */}
      <HomeAskCard router={router} />

      {/* Pending reviews callout */}
      {summary && summary.review_count > 0 && (
        <Card style={{ backgroundColor: colors.marigoldSoft, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <AppText style={{ fontSize: 26 }}>⚠️</AppText>
          <View style={{ flex: 1 }}>
            <AppText type="h3" style={{ fontSize: 15 }}>{summary.review_count} transactions need review</AppText>
            <AppText type="caption" muted>Pi flagged uncertain categories</AppText>
          </View>
          <Pressable onPress={() => router.push('/financial/activity')}>
            <AppText type="captionMed" color={colors.marigold}>Review</AppText>
          </Pressable>
        </Card>
      )}

      {/* Advice preview */}
      {advice.length > 0 && (
        <>
          <SectionTitle label="For you" action={`See all ${advice.length}`} onAction={() => router.push('/financial/advice')} />
          {advice.slice(0, 2).map((a) => {
            const toneColor = a.tone === 'good' ? colors.sage : colors.marigold;
            const toneSoft = a.tone === 'good' ? colors.sageSoft : colors.marigoldSoft;
            return (
              <Card key={a.id} style={{ borderLeftWidth: 4, borderLeftColor: toneColor, backgroundColor: toneSoft }}>
                <AppText type="h3" style={{ fontSize: 15 }}>{a.title}</AppText>
                <AppText type="label" muted style={{ marginTop: 4 }}>{a.body}</AppText>
              </Card>
            );
          })}
        </>
      )}

      {/* Category breakdown */}
      {summary && summary.category_breakdown.length > 0 && (
        <>
          <SectionTitle label="Where it's going" action="Details" onAction={() => router.push('/financial/insights')} />
          <Card>
            {summary.category_breakdown.slice(0, 5).map((cb, i) => {
              const pct = summary.gross_expense_paise ? (cb.gross_expense_paise / summary.gross_expense_paise) * 100 : 0;
              return (
                <View key={cb.category_id} style={{ marginBottom: i < 4 ? 10 : 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <AppText type="captionMed">{piCatEmoji(cb.category_id)} {piCatLabel(cb.category_id)}</AppText>
                    <AppText type="captionMed" num>{fmtPaise(cb.gross_expense_paise)}</AppText>
                  </View>
                  <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.line, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: piCatColor(cb.category_id) }} />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}

      {/* Budgets status */}
      {budgetStatus.length > 0 && (
        <>
          <SectionTitle label="Budget status" action="Manage" onAction={() => router.push('/financial/plan')} />
          <Card>
            {budgetStatus.map((b, i) => {
              const pct = parseFloat(b.usage_percent);
              const over = pct > 100;
              return (
                <View key={b.category_id} style={{ marginBottom: i < budgetStatus.length - 1 ? 12 : 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <AppText type="captionMed">{piCatEmoji(b.category_id)} {piCatLabel(b.category_id)}</AppText>
                    <AppText type="captionMed" num style={{ color: over ? colors.marigold : colors.ink }}>
                      {fmtPaise(b.spent_paise)} / {fmtPaise(b.budget_paise)}
                    </AppText>
                  </View>
                  <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.line, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: over ? colors.marigold : piCatColor(b.category_id) }} />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}

      {/* Recurring & EMIs */}
      <SectionTitle label="Recurring & EMIs" action="See all" onAction={() => router.push('/financial/loans')} />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View>
            <AppText type="caption" muted>Committed each month</AppText>
            <AppText type="h3" num style={{ fontSize: 24 }}>{fmtPaise(committedTotal)}</AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <StatusChip tone="warn" label={`${activeLoans.length} EMI${activeLoans.length !== 1 ? 's' : ''}`} />
            <AppText type="caption" muted style={{ marginTop: 4 }}>{recurring.length} recurring</AppText>
          </View>
        </View>
        {recurring.slice(0, 3).map((r, i) => (
          <View key={i} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: piCatColor(r.category_id) + '22' }]}>
              <AppText style={{ fontSize: 18 }}>{piCatEmoji(r.category_id)}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText type="bodyMed">{r.merchant}</AppText>
              <AppText type="captionSm" muted>~day {r.typical_day}</AppText>
            </View>
            <AppText type="bodyMed" num>{fmtPaise(r.amount_paise)}</AppText>
          </View>
        ))}
      </Card>

      {/* Imports entry */}
      <SectionTitle label="Statement imports" action="Import" onAction={() => router.push('/financial/import')} />
      <Card onPress={() => router.push('/financial/import')} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.indigoSoft, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontSize: 20 }}>🗂️</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText type="h3" style={{ fontSize: 15 }}>Upload a statement</AppText>
          <AppText type="caption" muted>CSV or PDF · review before commit</AppText>
        </View>
        <AppText type="h3" muted>›</AppText>
      </Card>

      {/* Scam Guard — bot-first UI */}
      <SectionTitle label="Call protection" action="Open" onAction={() => router.push('/financial/scam-bot')} />
      <Card onPress={() => router.push('/financial/scam-bot')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: colors.indigoSoft, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontSize: 24 }}>🤖</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText type="h3">Scam Guard bot</AppText>
          <AppText type="caption" muted>Tap the bot — it listens and warns live</AppText>
        </View>
        <AppText type="h3" muted>›</AppText>
      </Card>

      <AppText type="caption" faint style={{ textAlign: 'center', marginTop: 18 }}>
        Live from your Pi at :8002. All numbers come from the API, never the model.
      </AppText>
    </Screen>
  );
}

const askStyles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, paddingLeft: 14, paddingVertical: 6, paddingRight: 6 },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  sendBtn: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

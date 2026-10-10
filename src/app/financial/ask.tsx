// Pi-backed Ask: POST /questions.
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { Mascot } from '@/components/Mascot';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { financialApi, fmtPaise, type AskAnswer } from '@/lib/financialApi';
import { piCatColor, piCatEmoji, piCatLabel } from '@/lib/catMap';

type ChatMsg = { u: string } | { typing: true } | { a: AskAnswer; q: string };

const CAPS: [string, string, string][] = [
  ['🧮', 'Totals', 'How much did I spend on food this month?'],
  ['🏪', 'A shop or app', 'How much did I spend on Swiggy this month?'],
  ['⚖️', 'Compare', 'Compare transport with last month'],
  ['🏆', 'Biggest', 'Biggest expenses in September'],
  ['🗂️', 'Breakdown', 'Where did I spend the most last month?'],
  ['📅', 'Averages', 'Average daily dining spend this month'],
  ['🔁', 'EMIs & recurring', 'How much do I pay in EMIs?'],
  ['🤔', 'What if', 'If I spend ₹2,000 on headphones, would I exceed my Shopping budget?'],
];

const SUGG = [
  'How much did I spend on food last month?',
  'Swiggy this month?',
  'Compare food with last month',
  'Biggest expenses in September',
  'How much do I pay in EMIs?',
  'What are my subscriptions?',
  'How much can I still spend on dining?',
  'Where did my money go?',
];

export default function AskScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ q?: string }>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const initialAsked = useRef(false);

  const ask = async (q: string) => {
    const query = q.trim();
    if (!query) return;
    setChat((c) => [...c, { u: query }, { typing: true }]);
    setInput('');
    try {
      const a = await financialApi.ask(query);
      setChat((c) => [...c.slice(0, -1), { a, q: query }]);
    } catch (e: any) {
      const a: AskAnswer = {
        status: 'needs_clarification',
        operation: 'error',
        clarification: e.message ?? 'Could not reach the Pi.',
      };
      setChat((c) => [...c.slice(0, -1), { a, q: query }]);
    }
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  useEffect(() => {
    if (params.q && !initialAsked.current) {
      initialAsked.current = true;
      ask(params.q);
    }
  }, [params.q]);

  const footer = (
    <View style={[styles.askbar, { backgroundColor: colors.paper, paddingBottom: Math.max(10, insets.bottom) }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {SUGG.map((s) => (
              <Chip key={s} label={s} onPress={() => ask(s)} />
            ))}
          </View>
        </ScrollView>
        <View style={[styles.inputRow, { backgroundColor: colors.surface }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => ask(input)}
            placeholder="Ask anything about your spending"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { color: colors.ink }]}
            returnKeyType="send"
          />
          <Pressable onPress={() => ask(input)} style={[styles.sendBtn, { backgroundColor: colors.indigo }]}>
            <Icon name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <Screen title="Ask" screen="ask" showBack showScopeBar={false} scrollRef={scrollRef} footer={footer}>
      {chat.length === 0 && (
        <Card style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <Mascot size={58} />
            <View style={{ flex: 1 }}>
              <AppText type="h3" style={{ fontSize: 18 }}>
                Ask in your own words
              </AppText>
              <AppText type="label" muted>
                The Pi reads your records and answers from live SQL. The LLM only picks what to ask — never the numbers.
              </AppText>
            </View>
          </View>
          <View style={styles.capGrid}>
            {CAPS.map(([e, label, q]) => (
              <Pressable key={q} onPress={() => ask(q)} style={[styles.capCell, { backgroundColor: colors.surface2 }]}>
                <AppText style={{ fontSize: 22 }}>{e}</AppText>
                <AppText type="h3" style={{ fontSize: 14 }}>{label}</AppText>
                <AppText type="captionSm" muted numberOfLines={3}>&ldquo;{q}&rdquo;</AppText>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      {chat.map((m, i) => {
        if ('u' in m) {
          return (
            <View key={i} style={[styles.msgU, { backgroundColor: colors.indigo }]}>
              <AppText type="body" color={colors.onIndigo}>{m.u}</AppText>
            </View>
          );
        }
        if ('typing' in m) {
          return (
            <View key={i} style={[styles.msgA, { backgroundColor: colors.surface }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Mascot size={44} />
                <AppText type="labelMed" muted>Asking the Pi…</AppText>
              </View>
            </View>
          );
        }
        return <AnswerCard key={i} a={m.a} />;
      })}

      <View style={{ height: 8 }} />
    </Screen>
  );
}

function AnswerCard({ a }: { a: AskAnswer }) {
  const { colors } = useTheme();

  if (a.status === 'needs_clarification') {
    return (
      <View style={[styles.msgA, { backgroundColor: colors.surface }]}>
        <AppText type="h3" style={{ fontSize: 16 }}>Hmm, I'm not sure</AppText>
        <AppText type="label" muted style={{ marginTop: 6 }}>{a.clarification}</AppText>
      </View>
    );
  }

  return (
    <View style={[styles.msgA, { backgroundColor: colors.surface }]}>
      <View style={[styles.badgeOp, { backgroundColor: colors.indigoSoft }]}>
        <AppText type="caption" style={{ fontSize: 10, color: colors.indigo }}>{a.operation.replace(/_/g, ' ')}</AppText>
      </View>
      <AppText type="h3" style={{ marginTop: 4 }}>{a.answer}</AppText>

      {a.period && (
        <AppText type="caption" muted style={{ marginTop: 6 }}>
          {a.period.label ?? ''} · {a.period.start_date} to {a.period.end_date_exclusive}
        </AppText>
      )}

      {/* total_spending structured display */}
      {a.operation === 'total_spending' && a.net_spending_paise !== undefined && (
        <View style={styles.numRow}>
          <Num label="Spent" value={fmtPaise(a.gross_expense_paise)} />
          {!!a.refund_paise && <Num label="Refund" value={fmtPaise(a.refund_paise)} />}
          <Num label="Net" value={fmtPaise(a.net_spending_paise)} highlight />
          {a.expense_count != null && <Num label="Count" value={String(a.expense_count)} />}
        </View>
      )}

      {/* breakdown (category or merchant) */}
      {a.breakdown && a.breakdown.length > 0 && (
        <View style={{ marginTop: 10 }}>
          {a.breakdown.slice(0, 8).map((b, i) => {
            const pct = a.gross_expense_paise ? (b.gross_expense_paise / a.gross_expense_paise) * 100 : 0;
            const label = b.category_id ? `${piCatEmoji(b.category_id)} ${piCatLabel(b.category_id)}` : (b.merchant ?? '—');
            const color = b.category_id ? piCatColor(b.category_id) : colors.indigo;
            return (
              <View key={i} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <AppText type="captionMed" numberOfLines={1} style={{ flex: 1 }}>{label}</AppText>
                  <AppText type="captionMed" num>{fmtPaise(b.gross_expense_paise)}</AppText>
                </View>
                <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.line, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* biggest_expenses / list_transactions items */}
      {a.items && a.items.length > 0 && (
        <View style={{ marginTop: 10 }}>
          {a.items.slice(0, 10).map((t) => (
            <View key={t.id} style={styles.txRow}>
              <View style={[styles.ico, { backgroundColor: piCatColor(t.category_id) + '22' }]}>
                <AppText style={{ fontSize: 18 }}>{piCatEmoji(t.category_id)}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText type="bodyMed" numberOfLines={1}>{t.merchant ?? '—'}</AppText>
                <AppText type="captionSm" muted>{t.posted_date}</AppText>
              </View>
              <AppText type="bodyMed" num>{fmtPaise(t.amount_paise)}</AppText>
            </View>
          ))}
          {a.total_count && a.total_count > (a.items?.length ?? 0) && (
            <AppText type="caption" muted style={{ marginTop: 4 }}>
              Showing {a.items.length} of {a.total_count}
            </AppText>
          )}
        </View>
      )}

      {/* busiest_day */}
      {a.day && (
        <View style={styles.numRow}>
          <Num label="Date" value={a.day.posted_date} />
          <Num label="Total" value={fmtPaise(a.day.gross_expense_paise)} highlight />
          <Num label="Txns" value={String(a.day.count)} />
        </View>
      )}

      {/* transaction_count */}
      {a.operation === 'transaction_count' && a.count !== undefined && (
        <View style={styles.numRow}>
          <Num label="Count" value={String(a.count)} highlight />
          {a.gross_expense_paise !== undefined && <Num label="Total" value={fmtPaise(a.gross_expense_paise)} />}
        </View>
      )}

      {/* average_spending */}
      {a.operation === 'average_spending' && a.average_paise !== undefined && (
        <View style={styles.numRow}>
          <Num label={a.average_unit === 'daily' ? 'Per day' : 'Per month'} value={fmtPaise(a.average_paise)} highlight />
        </View>
      )}

      {/* compare_periods */}
      {a.operation === 'compare_periods' && a.current_period && a.previous_period && (
        <View style={styles.numRow}>
          <Num label={a.current_period.label ?? 'Current'} value={fmtPaise(a.current_period.net_spending_paise)} />
          <Num label={a.previous_period.label ?? 'Previous'} value={fmtPaise(a.previous_period.net_spending_paise)} />
          <Num
            label="Change"
            value={`${(a.delta_net_paise ?? 0) >= 0 ? '+' : ''}${fmtPaise(a.delta_net_paise)}`}
            highlight
            color={(a.delta_net_paise ?? 0) >= 0 ? colors.marigold : colors.sage}
          />
        </View>
      )}

      {/* budget_remaining */}
      {a.operation === 'budget_remaining' && a.budget_paise !== undefined && (
        <View style={styles.numRow}>
          <Num label="Budget" value={fmtPaise(a.budget_paise)} />
          <Num label="Spent" value={fmtPaise(a.spent_paise)} />
          <Num label="Left" value={fmtPaise(a.left_paise)} highlight color={colors.sage} />
          {a.per_day_paise !== undefined && <Num label="Per day" value={fmtPaise(a.per_day_paise)} />}
        </View>
      )}

      {/* emi_info */}
      {a.loans && a.loans.length > 0 && (
        <View style={{ marginTop: 10 }}>
          {a.loans.map((l, i) => (
            <View key={i} style={styles.txRow}>
              <View style={[styles.ico, { backgroundColor: colors.marigoldSoft }]}>
                <AppText style={{ fontSize: 18 }}>🏷️</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText type="bodyMed">{l.name}</AppText>
                <AppText type="captionSm" muted>{l.lender} · {l.paid} of {l.total}</AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText type="bodyMed" num>{fmtPaise(l.emi_paise)}</AppText>
                <AppText type="captionSm" faint num>{fmtPaise(l.remaining_paise)} left</AppText>
              </View>
            </View>
          ))}
          {a.total_emi_paise !== undefined && (
            <View style={[styles.numRow, { marginTop: 6 }]}>
              <Num label="Total EMI" value={fmtPaise(a.total_emi_paise)} />
              <Num label="Remaining" value={fmtPaise(a.total_remaining_paise)} highlight />
            </View>
          )}
        </View>
      )}

      {/* recurring_info */}
      {a.recurring && a.recurring.length > 0 && (
        <View style={{ marginTop: 10 }}>
          {a.recurring.map((r, i) => (
            <View key={i} style={styles.txRow}>
              <View style={[styles.ico, { backgroundColor: piCatColor(r.category_id) + '22' }]}>
                <AppText style={{ fontSize: 18 }}>{piCatEmoji(r.category_id)}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText type="bodyMed">{r.merchant}</AppText>
                <AppText type="captionSm" muted>~day {r.typical_day} · {r.months_present}/3 months</AppText>
              </View>
              <AppText type="bodyMed" num>{fmtPaise(r.amount_paise)}</AppText>
            </View>
          ))}
          {a.grand_total_paise !== undefined && (
            <View style={[styles.numRow, { marginTop: 6 }]}>
              <Num label="Recurring" value={fmtPaise(a.recurring_total_paise)} />
              <Num label="EMIs" value={fmtPaise(a.emi_total_paise)} />
              <Num label="Total" value={fmtPaise(a.grand_total_paise)} highlight />
            </View>
          )}
        </View>
      )}

      {/* hypothetical_spend */}
      {a.operation === 'hypothetical_spend' && a.hypothetical_paise !== undefined && (
        <>
          <View style={[styles.badgeOp, { backgroundColor: colors.marigoldSoft, marginTop: 10 }]}>
            <AppText type="caption" style={{ fontSize: 10, color: colors.marigold }}>Hypothetical</AppText>
          </View>
          <View style={styles.numRow}>
            <Num label="Budget" value={fmtPaise(a.budget_paise)} />
            <Num label="Now" value={fmtPaise(a.current_spent_paise)} />
            <Num label="After" value={fmtPaise(a.after_paise)} highlight color={a.over_budget ? colors.marigold : colors.sage} />
            {a.over_budget && a.over_by_paise && (
              <Num label="Over by" value={fmtPaise(a.over_by_paise)} color={colors.marigold} />
            )}
          </View>
        </>
      )}
    </View>
  );
}

function Num({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.numCell}>
      <AppText type="caption" muted style={{ fontSize: 10 }}>{label}</AppText>
      <AppText type={highlight ? 'h3' : 'bodyMed'} num style={{ color: color ?? colors.ink, fontSize: highlight ? 18 : 14 }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  askbar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 10 },
  capGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  capCell: { width: '48%', borderRadius: 18, padding: 12, gap: 2 },
  msgU: { alignSelf: 'flex-end', maxWidth: '82%', padding: 12, borderRadius: 18, borderBottomRightRadius: 4, marginBottom: 10 },
  msgA: { alignSelf: 'flex-start', maxWidth: '96%', padding: 14, borderRadius: 18, borderBottomLeftRadius: 4, marginBottom: 10, minWidth: '70%' },
  badgeOp: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 7 },
  numRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  numCell: { minWidth: 70 },
  txRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 },
  ico: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, paddingLeft: 14, paddingVertical: 6, paddingRight: 6 },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  sendBtn: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

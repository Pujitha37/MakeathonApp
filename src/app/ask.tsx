// Ported from `askHTML()` / `ask()` / `answer()` wiring in finprofile.html.
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Mascot } from '@/components/Mascot';
import { Icon } from '@/components/Icon';
import { AnswerBars } from '@/components/AnswerBars';
import { GroupedTxList } from '@/components/GroupedTxList';
import { TxRow } from '@/components/TxRow';
import { StatusChip } from '@/components/StatusChip';
import { useSheet } from '@/components/Sheet';
import { BudgetSheetContent } from '@/components/sheets/BudgetSheet';
import { useStore } from '@/store/useStore';
import { answer, type AskAnswer } from '@/lib/ask-engine';
import { SOURCES } from '@/data/types';
import type { Source } from '@/data/types';
import { fmt } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

type ChatMsg = { u: string } | { typing: true } | { a: AskAnswer };

const CAPS: [string, string, string][] = [
  ['🧮', 'Totals', 'How much did I spend on food last month?'],
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
  'How much money do I have?',
];

export default function AskScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheet = useSheet();
  const scrollRef = useRef<ScrollView>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');

  const { tx, stmts, scope, budgets, loans } = useStore((s) => ({
    tx: s.tx,
    stmts: s.stmts,
    scope: s.scope,
    budgets: s.budgets,
    loans: s.loans,
  }));
  const setScope = useStore((s) => s.setScope);
  const setActTab = useStore((s) => s.setActTab);

  const ask = (q: string, overrideScope?: Source) => {
    if (!q.trim()) return;
    setChat((c) => [...c, { u: q }, { typing: true }]);
    setInput('');
    setTimeout(() => {
      const a = answer(q, { tx, stmts, scope: overrideScope ?? scope, budgets, loans });
      setChat((c) => [...c.slice(0, -1), { a }]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }, 650);
  };

  const runAct = (act: NonNullable<AskAnswer['act']>) => {
    if (act.action === 'goRecurring') {
      setActTab('recurring');
      router.push('/activity');
    } else if (act.action === 'editBudget' && act.cat) {
      sheet.open(<BudgetSheetContent cat={act.cat} />, ['55%', '90%']);
    }
  };

  const showEvidence = (a: AskAnswer) => {
    if (!a.ev) return;
    sheet.open(
      <View>
        <AppText type="titleLg" style={{ marginBottom: 4 }}>
          {a.evTitle ?? 'Transactions'}
        </AppText>
        <AppText type="label" muted style={{ marginBottom: 14 }}>
          {a.ev.length} transactions totalling {fmt(a.ev.reduce((s, t) => s + t.amount, 0))}. Source: {SOURCES[scope].label}.
        </AppText>
        <GroupedTxList list={a.ev.slice().sort((x, y) => y.date.localeCompare(x.date))} />
      </View>,
      ['70%', '92%'],
    );
  };

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
                I work everything out from your records on this phone, and show the figures behind each answer.
              </AppText>
            </View>
          </View>
          <View style={styles.capGrid}>
            {CAPS.map(([e, label, q]) => (
              <Pressable key={q} onPress={() => ask(q)} style={[styles.capCell, { backgroundColor: colors.surface2 }]}>
                <AppText style={{ fontSize: 22 }}>{e}</AppText>
                <AppText type="h3" style={{ fontSize: 14 }}>
                  {label}
                </AppText>
                <AppText type="captionSm" muted numberOfLines={3}>
                  "{q}"
                </AppText>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      {chat.map((m, i) => {
        if ('u' in m) {
          return (
            <View key={i} style={[styles.msgU, { backgroundColor: colors.indigo }]}>
              <AppText type="body" color={colors.onIndigo}>
                {m.u}
              </AppText>
            </View>
          );
        }
        if ('typing' in m) {
          return (
            <View key={i} style={[styles.msgA, { backgroundColor: colors.surface }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Mascot size={44} />
                <AppText type="labelMed" muted>
                  Working it out…
                </AppText>
              </View>
            </View>
          );
        }
        const a = m.a;
        const isLast = i === chat.length - 1;
        return (
          <View key={i} style={[styles.msgA, { backgroundColor: colors.surface }]}>
            {a.kind === 'hyp' && (
              <View style={[styles.badgeH, { backgroundColor: colors.marigoldSoft }]}>
                <AppText type="tag" color="#9A6200">
                  Hypothetical
                </AppText>
              </View>
            )}
            <AppText type={a.kind === 'info' ? 'h3' : 'displayMd'} style={a.kind === 'info' ? { fontSize: 17 } : undefined}>
              {a.head}
              {a.headSuffix && (
                <AppText type="h3" muted style={{ fontSize: 16 }}>
                  {' '}
                  {a.headSuffix}
                </AppText>
              )}
            </AppText>
            <AppText type="label" style={{ marginTop: 4 }}>
              {a.txt}
            </AppText>
            {a.bars && <AnswerBars bars={a.bars} />}
            {a.items && (
              <View style={{ marginTop: 8 }}>
                {a.items.map((t) => (
                  <TxRow key={t.id} t={t} />
                ))}
              </View>
            )}
            {a.loanRows && (
              <View style={{ marginTop: 8 }}>
                {a.loanRows.map(({ loan, info }) => (
                  <View key={loan.id} style={styles.loanRow}>
                    <View style={[styles.ico, { backgroundColor: colors.marigoldSoft }]}>
                      <AppText style={{ fontSize: 20 }}>{loan.emoji}</AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText type="bodyMed">{loan.name}</AppText>
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <AppText type="captionSm" muted>
                          {info.paid} of {loan.months} paid,
                        </AppText>
                        <StatusChip tone={info.st.s} label={info.st.l} />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <AppText type="bodyMed" num>
                        {fmt(loan.emi)}
                      </AppText>
                      <AppText type="captionSm" faint num>
                        {fmt(info.remaining)} left
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
            )}
            {a.rows && (
              <View style={[styles.basis, { borderTopColor: colors.line }]}>
                {a.rows.map((r, j) => (
                  <View key={j} style={{ flexDirection: 'row', gap: 10 }}>
                    <AppText type="captionSm" faint style={{ width: 90 }}>
                      {r[0]}
                    </AppText>
                    <AppText type="captionSm" muted style={{ flex: 1 }}>
                      {r[1]}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {a.ev && a.ev.length > 0 && (
                <Button label={`View ${a.ev.length} transaction${a.ev.length > 1 ? 's' : ''}`} sm variant="soft" onPress={() => showEvidence(a)} />
              )}
              {a.switchTo && (
                <Button label={`Use ${SOURCES[a.switchTo].label}`} sm variant="soft" onPress={() => {
                  setScope(a.switchTo!);
                  const lastUser = [...chat].reverse().find((x) => 'u' in x) as { u: string } | undefined;
                  if (lastUser) ask(lastUser.u, a.switchTo);
                }} />
              )}
              {a.act && <Button label={a.act.label} sm variant="soft" onPress={() => runAct(a.act!)} />}
            </View>
            {a.follow && isLast && (
              <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: 6, alignItems: 'flex-start' }}>
                {a.follow.map((s) => (
                  <Pressable key={s} onPress={() => ask(s)} style={[styles.followChip, { backgroundColor: colors.indigoSoft }]}>
                    <AppText type="captionMed" color={colors.indigo}>
                      {s}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <View style={{ height: 8 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  askbar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingTop: 10 },
  capGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  capCell: { width: '48%', borderRadius: 18, padding: 12, gap: 2 },
  msgU: { alignSelf: 'flex-end', maxWidth: '82%', padding: 12, borderRadius: 18, borderBottomRightRadius: 4, marginBottom: 10 },
  msgA: { alignSelf: 'flex-start', maxWidth: '96%', padding: 14, borderRadius: 18, borderBottomLeftRadius: 4, marginBottom: 10 },
  badgeH: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 7, marginBottom: 6 },
  loanRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 },
  ico: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  basis: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 4 },
  followChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, paddingLeft: 14, paddingVertical: 6, paddingRight: 6 },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  sendBtn: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

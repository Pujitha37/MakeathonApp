// Ported from `quickAddCard()` / `runHomeQuickAdd()` / `savedBlock()` / `savedCard()`.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { parseExpenses } from '@/lib/parse';
import { fd, fmt, iso } from '@/lib/format';
import { TODAY } from '@/data/seed';
import { CAT, CatId } from '@/theme/tokens';
import { Card } from './Card';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { BotTypingRow, FINANCIAL_SAMPLES } from './MicRecorder';
import { Mascot } from './Mascot';
import { useSheet } from './Sheet';
import { useToast } from './Toast';
import { CategorySheetContent } from './sheets/CategorySheet';
import type { Tx } from '@/data/types';

const EXAMPLES = ['Swiggy 220 and Ola 180 yesterday', 'Zepto 540, metro 40', 'Netflix 649', 'Chai 40 today'];

export function QuickAddCard() {
  const { colors, shadow } = useTheme();
  const addExpense = useStore((s) => s.addExpense);
  const undoTx = useStore((s) => s.undoTx);
  const setTxCat = useStore((s) => s.setTxCat);
  const focusSignal = useStore((s) => s.focusQuickAddSignal);
  const sheet = useSheet();
  const toast = useToast();
  const inputRef = useRef<TextInput>(null);

  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [saved, setSaved] = useState<Tx[]>([]);
  const [bad, setBad] = useState<string[]>([]);
  const [suggested, setSuggested] = useState<Record<number, CatId>>({});

  useEffect(() => {
    if (focusSignal > 0) inputRef.current?.focus();
  }, [focusSignal]);

  const run = (value: string) => {
    if (!value.trim()) return;
    setThinking(true);
    setSaved([]);
    setBad([]);
    setText('');
    setTimeout(() => {
      const { ok, bad: errs } = parseExpenses(value);
      setThinking(false);
      const rows = ok.map((o) => addExpense(o.amount, o.merchant, o.cat, o.date));
      const sug: Record<number, CatId> = {};
      rows.forEach((r, i) => (sug[r.id] = ok[i].cat));
      setSuggested(sug);
      setSaved(rows);
      setBad(errs);
      if (rows.length) toast.show(`Saved ${rows.length} expense${rows.length > 1 ? 's' : ''}`);
    }, 760);
  };

  return (
    <Card style={{ borderWidth: 1.5, borderColor: colors.indigoSoft, padding: 16 }}>
      <View style={styles.head}>
        <AppText type="h3" style={{ fontSize: 16, fontWeight: '800' }}>
          ✍️ Add an expense
        </AppText>
        {!recording && (
          <Pressable
            onPress={() => setRecording(true)}
            style={[styles.micLink, { backgroundColor: colors.indigoSoft }]}
          >
            <Icon name="mic" size={16} color={colors.indigo} />
            <AppText type="labelMed" style={{ color: colors.indigo }}>Speak</AppText>
          </Pressable>
        )}
      </View>
      <View style={[styles.inputRow, { backgroundColor: colors.surface2 }]}>
        {recording ? (
          <BotTypingRow
            color={colors.indigo}
            bgColor={colors.indigoSoft}
            samples={FINANCIAL_SAMPLES}
            onCancel={() => setRecording(false)}
            onResult={(t) => { setRecording(false); setText(t); setTimeout(() => run(t), 80); }}
          />
        ) : (
          <>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => run(text)}
              placeholder="e.g. Swiggy 220 and Ola 180 yesterday"
              placeholderTextColor={colors.ink3}
              style={[styles.input, { color: colors.ink }]}
              returnKeyType="done"
            />
            <Pressable onPress={() => run(text)} style={[styles.sendBtn, { backgroundColor: colors.indigo }]}>
              <Icon name="send" size={20} color="#fff" />
            </Pressable>
          </>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {EXAMPLES.map((q) => (
          <Pressable key={q} onPress={() => run(q)} style={[styles.chip, { backgroundColor: colors.surface, ...shadow }]}>
            <AppText type="captionMed">{q}</AppText>
          </Pressable>
        ))}
      </ScrollView>

      {thinking && (
        <View style={styles.thinkRow}>
          <Mascot size={44} />
          <AppText type="labelMed" muted>
            Hearing you out…
          </AppText>
        </View>
      )}

      {!thinking && (saved.length > 0 || bad.length > 0) && (
        <View style={styles.savedWrap}>
          <View style={styles.savedHead}>
            <AppText type="captionMed" color={colors.sage}>
              ✓ Added {saved.length} expense{saved.length !== 1 ? 's' : ''}
            </AppText>
            <Pressable onPress={() => { setSaved([]); setBad([]); }}>
              <AppText type="captionMed" color={colors.indigo}>
                Clear
              </AppText>
            </Pressable>
          </View>
          {saved.map((t) => {
            const c = CAT[t.cat];
            return (
              <View key={t.id} style={[styles.savedCard, { backgroundColor: colors.surface2 }]}>
                <View style={[styles.ico, { backgroundColor: c.color + '22' }]}>
                  <AppText style={{ fontSize: 20 }}>{c.emoji}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText type="h3">{t.merchant}</AppText>
                  <Pressable
                    onPress={() =>
                      sheet.open(
                        <CategorySheetContent
                          merchant={t.merchant}
                          amount={t.amount}
                          current={t.cat}
                          suggested={suggested[t.id] ?? t.cat}
                          onPick={(cat) => {
                            setTxCat(t.id, cat);
                            sheet.close();
                          }}
                        />,
                        ['70%'],
                      )
                    }
                  >
                    <AppText type="captionMed" color={colors.indigo}>
                      {c.label} · change
                    </AppText>
                  </Pressable>
                  <AppText type="captionMed" color={colors.sage}>
                    ✓ Saved, {t.date === iso(TODAY) ? 'today' : fd(t.date)}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText type="h3" num>
                    {fmt(t.amount)}
                  </AppText>
                  <Pressable onPress={() => undoTx(t.id)}>
                    <AppText type="captionMed" muted>
                      Undo
                    </AppText>
                  </Pressable>
                </View>
              </View>
            );
          })}
          {bad.map((b, i) => (
            <View key={i} style={[styles.errBox, { backgroundColor: colors.marigoldSoft }]}>
              <AppText type="label">{b}</AppText>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  micLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    paddingLeft: 14,
    paddingVertical: 6,
    paddingRight: 6,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  sendBtn: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  thinkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  savedWrap: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  savedHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  savedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, marginTop: 8 },
  ico: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  errBox: { marginTop: 10, padding: 12, borderRadius: 14 },
});

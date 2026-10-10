// Live Pi-backed Quick Add: POST /entries/parse → POST /transactions.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { Card } from './Card';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { BotTypingRow, FINANCIAL_SAMPLES } from './MicRecorder';
import { Mascot } from './Mascot';
import { useToast } from './Toast';
import { financialApi, fmtPaise, todayISO, type EntryDraft, type Transaction } from '@/lib/financialApi';
import { piCatColor, piCatEmoji, piCatLabel, PI_CATEGORY_LIST } from '@/lib/catMap';

const EXAMPLES = ['Swiggy 220 and Ola 180 yesterday', 'Zepto 540, metro 40', 'Netflix 649', 'Chai 40 today'];

export function QuickAddCard() {
  const { colors, shadow } = useTheme();
  const focusSignal = useStore((s) => s.focusQuickAddSignal);
  const toast = useToast();
  const inputRef = useRef<TextInput>(null);

  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [drafts, setDrafts] = useState<EntryDraft[]>([]);
  const [draftSource, setDraftSource] = useState<'typed' | 'voice'>('typed');
  const [saved, setSaved] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<string | null>(null); // draft_id

  useEffect(() => {
    if (focusSignal > 0) inputRef.current?.focus();
  }, [focusSignal]);

  const run = async (value: string, src: 'typed' | 'voice' = 'typed') => {
    if (!value.trim()) return;
    setThinking(true);
    setError(null);
    setDrafts([]);
    setSaved([]);
    setDraftSource(src);
    setText('');
    try {
      const { drafts } = await financialApi.parseEntries(value, src);
      setDrafts(drafts);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    } finally {
      setThinking(false);
    }
  };

  const updateDraft = (id: string, patch: Partial<EntryDraft>) =>
    setDrafts((prev) => prev.map((d) => (d.draft_id === id ? { ...d, ...patch } : d)));

  const confirmDraft = async (d: EntryDraft) => {
    if (d.status === 'needs_input' || d.missing_fields.length > 0) {
      toast.show('Fill in the missing fields first');
      return;
    }
    try {
      const tx = await financialApi.createTransaction({
        merchant: d.merchant ?? undefined,
        amount_paise: d.amount_paise ?? undefined,
        posted_date: d.posted_date ?? todayISO(),
        type: d.type,
        category_id: d.type === 'expense' || d.type === 'refund' ? d.category_id : null,
        source: draftSource,
        remember_category: true,
      });
      setSaved((prev) => [...prev, tx]);
      setDrafts((prev) => prev.filter((x) => x.draft_id !== d.draft_id));
      toast.show('Saved to Pi');
    } catch (e: any) {
      toast.show(e.message ?? 'Could not save');
    }
  };

  const confirmAll = async () => {
    for (const d of drafts) {
      if (d.status === 'ready') await confirmDraft(d);
    }
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
            onResult={(t) => { setRecording(false); setText(t); setTimeout(() => run(t, 'voice'), 80); }}
          />
        ) : (
          <>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => run(text, 'typed')}
              placeholder="e.g. Swiggy 220 and Ola 180 yesterday"
              placeholderTextColor={colors.ink3}
              style={[styles.input, { color: colors.ink }]}
              returnKeyType="done"
              editable={!thinking}
            />
            <Pressable onPress={() => run(text, 'typed')} disabled={thinking} style={[styles.sendBtn, { backgroundColor: colors.indigo, opacity: thinking ? 0.6 : 1 }]}>
              {thinking ? <ActivityIndicator color="#fff" /> : <Icon name="send" size={20} color="#fff" />}
            </Pressable>
          </>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {EXAMPLES.map((q) => (
          <Pressable key={q} onPress={() => run(q, 'typed')} style={[styles.chip, { backgroundColor: colors.surface, ...shadow }]}>
            <AppText type="captionMed">{q}</AppText>
          </Pressable>
        ))}
      </ScrollView>

      {thinking && (
        <View style={styles.thinkRow}>
          <Mascot size={44} />
          <AppText type="labelMed" muted>Pi is parsing…</AppText>
        </View>
      )}

      {error && (
        <View style={[styles.errBox, { backgroundColor: colors.marigoldSoft }]}>
          <AppText type="captionMed" color={colors.marigold}>⚠ Pi unavailable</AppText>
          <AppText type="caption" muted style={{ marginTop: 2 }}>{error}</AppText>
        </View>
      )}

      {drafts.length > 0 && (
        <View style={styles.savedWrap}>
          <View style={styles.savedHead}>
            <AppText type="captionMed" color={colors.indigo}>{drafts.length} draft{drafts.length !== 1 ? 's' : ''} from Pi</AppText>
            <Pressable onPress={confirmAll}>
              <AppText type="captionMed" color={colors.sage}>Save all ready</AppText>
            </Pressable>
          </View>
          {drafts.map((d) => {
            const color = piCatColor(d.category_id);
            const needsFix = d.status === 'needs_input' || d.missing_fields.length > 0;
            return (
              <View key={d.draft_id} style={[styles.savedCard, { backgroundColor: colors.surface2 }]}>
                <View style={[styles.ico, { backgroundColor: color + '22' }]}>
                  <AppText style={{ fontSize: 20 }}>{piCatEmoji(d.category_id)}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText type="h3">{d.merchant ?? 'Unknown merchant'}</AppText>
                  <Pressable onPress={() => setPicker(picker === d.draft_id ? null : d.draft_id)}>
                    <AppText type="captionMed" color={colors.indigo}>
                      {piCatLabel(d.category_id)} · change
                    </AppText>
                  </Pressable>
                  {d.needs_review && (
                    <AppText type="caption" style={{ color: colors.marigold, marginTop: 2 }}>
                      ⚠ Category uncertain
                    </AppText>
                  )}
                  {needsFix && (
                    <AppText type="caption" style={{ color: colors.marigold, marginTop: 2 }}>
                      Missing: {d.missing_fields.join(', ')}
                    </AppText>
                  )}
                  {picker === d.draft_id && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }} contentContainerStyle={{ gap: 6 }}>
                      {PI_CATEGORY_LIST.map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => { updateDraft(d.draft_id, { category_id: c, needs_review: false }); setPicker(null); }}
                          style={[styles.catChip, { backgroundColor: d.category_id === c ? piCatColor(c) + '55' : colors.surface, borderColor: piCatColor(c) }]}
                        >
                          <AppText type="captionMed" style={{ fontSize: 11 }}>{piCatEmoji(c)} {piCatLabel(c)}</AppText>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <AppText type="h3" num>{fmtPaise(d.amount_paise)}</AppText>
                  {!needsFix ? (
                    <Pressable onPress={() => confirmDraft(d)} style={[styles.saveBtn, { backgroundColor: colors.indigo }]}>
                      <AppText type="captionMed" style={{ color: '#fff' }}>Save</AppText>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => setDrafts((p) => p.filter((x) => x.draft_id !== d.draft_id))}>
                      <AppText type="captionMed" muted>Skip</AppText>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {saved.length > 0 && (
        <View style={styles.savedWrap}>
          <View style={styles.savedHead}>
            <AppText type="captionMed" color={colors.sage}>✓ Saved {saved.length} to Pi</AppText>
            <Pressable onPress={() => setSaved([])}>
              <AppText type="captionMed" color={colors.indigo}>Clear</AppText>
            </Pressable>
          </View>
          {saved.map((t) => (
            <View key={t.id} style={[styles.savedCard, { backgroundColor: colors.surface2 }]}>
              <View style={[styles.ico, { backgroundColor: piCatColor(t.category_id) + '22' }]}>
                <AppText style={{ fontSize: 20 }}>{piCatEmoji(t.category_id)}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText type="h3">{t.merchant}</AppText>
                <AppText type="captionMed" color={colors.sage}>✓ {t.posted_date}</AppText>
              </View>
              <AppText type="h3" num>{fmtPaise(t.amount_paise)}</AppText>
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
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, paddingLeft: 14, paddingVertical: 6, paddingRight: 6 },
  input: { flex: 1, fontSize: 16, paddingVertical: 10 },
  sendBtn: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  thinkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  savedWrap: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  savedHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  savedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, marginTop: 8 },
  ico: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 99, borderWidth: 1 },
  saveBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  errBox: { marginTop: 10, padding: 12, borderRadius: 14 },
});

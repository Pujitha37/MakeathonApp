import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { FONT } from '@/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/tokens';

function makeStyles(C: Palette, shadow: object) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.paper },

    pageIntro: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 22, marginTop: 4, marginBottom: 14 },
    pageTitle: { fontFamily: FONT.bricolage800, fontSize: 29, letterSpacing: -1.6, lineHeight: 32, color: C.ink, marginTop: 5 },
    eyebrow: { fontFamily: FONT.figtree700, fontSize: 10, letterSpacing: 1.3, color: C.ink2, textTransform: 'uppercase' },
    pageRight: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, marginBottom: 2 },

    cardStatic: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 19, padding: 16, marginHorizontal: 22, marginBottom: 12, ...shadow },
    cardHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    cardHeadText: { flex: 1, minWidth: 0 },
    cardTitle: { fontFamily: FONT.figtree700, fontSize: 13, letterSpacing: -0.3, color: C.ink },
    cardSubtitle: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 14.5, marginTop: 3 },
    tile: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

    examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
    exChip: { borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 9, backgroundColor: C.surface2 },
    exChipText: { fontFamily: FONT.figtree700, fontSize: 10, color: C.sage },

    msgList: { flexGrow: 1, paddingHorizontal: 22, gap: 10 },
    emptyState: { alignItems: 'center', paddingTop: 28, paddingHorizontal: 24 },
    emptyEmoji: { fontSize: 32, marginBottom: 10 },
    emptyTitle: { fontFamily: FONT.bricolage800, fontSize: 17, letterSpacing: -0.6, color: C.ink, marginBottom: 6 },
    emptyBody: { fontFamily: FONT.figtree400, fontSize: 12, color: C.ink2, lineHeight: 18, textAlign: 'center' },

    userBubble: { alignSelf: 'flex-end', maxWidth: '80%', backgroundColor: C.sage, borderRadius: 15, borderBottomRightRadius: 4, paddingVertical: 10, paddingHorizontal: 13 },
    userText: { fontFamily: FONT.figtree400, fontSize: 12, color: '#fff', lineHeight: 18 },

    answer: { padding: 13, borderWidth: 1, borderColor: C.line, borderRadius: 13, backgroundColor: C.sageSoft },
    answerLabel: { fontFamily: FONT.figtree700, fontSize: 10, color: C.sage, letterSpacing: 0.6, textTransform: 'uppercase' },
    answerMain: { fontFamily: FONT.bricolage800, fontSize: 17, letterSpacing: -0.6, color: C.ink, marginTop: 5, marginBottom: 4 },
    answerCopy: { fontFamily: FONT.figtree400, fontSize: 11, color: C.ink2, lineHeight: 17 },

    inputBar: { paddingHorizontal: 22, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, backgroundColor: C.paper },
    form: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6, borderWidth: 1, borderColor: C.line, borderRadius: 13, backgroundColor: C.surface2 },
    formInput: { flex: 1, minWidth: 0, fontFamily: FONT.figtree400, fontSize: 12, color: C.ink, paddingVertical: 6, paddingHorizontal: 7, maxHeight: 90 },
    submitBtn: { height: 32, paddingHorizontal: 11, borderRadius: 9, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    submitBtnDisabled: { backgroundColor: C.line },
    submitText: { fontFamily: FONT.figtree700, fontSize: 11, color: '#fff' },
    submitTextDisabled: { color: C.ink3 },
    hint: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink3, lineHeight: 15, marginTop: 8, textAlign: 'center' },
  });
}

type Answer = { label: string; main: string; copy: string };
const ANSWERS: Record<string, Answer> = {
  track: {
    label: 'This week · gym goal',
    main: '2 of 3 gym sessions logged.',
    copy: 'You completed chest on Tuesday and legs on Thursday. One more session is planned for Sunday. Source: your two sample gym logs.',
  },
  yesterday: {
    label: 'Friday · October 8',
    main: 'You logged a gym session at 6:30 PM.',
    copy: 'That activity is in your Friday log. Your most recent AI lesson was lesson 5 on Thursday, October 7.',
  },
  next: {
    label: 'Upcoming steps',
    main: 'Lesson 6 today; gym session 3 on Sunday.',
    copy: 'AI course lesson 6 is planned for tonight at 7:00 PM. Your third gym session is planned for Sunday 9:00 AM. Source: your approved sample plan.',
  },
};

const EXAMPLES = [
  { key: 'track', q: 'Am I on track?' },
  { key: 'yesterday', q: 'What did I do yesterday?' },
  { key: 'next', q: "What's next?" },
];

type Message = { id: string; role: 'user' | 'assistant'; text: string; answer?: Answer };

function resolveAnswer(q: string): Answer {
  const lower = q.toLowerCase();
  if (/yesterday|friday|badminton/.test(lower)) return ANSWERS.yesterday;
  if (/next|when|upcoming|plan/.test(lower)) return ANSWERS.next;
  return ANSWERS.track;
}

export default function PersonalAskScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadow } = useTheme();
  const S = useMemo(() => makeStyles(colors, shadow), [colors, shadow]);
  const params = useLocalSearchParams<{ q?: string }>();

  const initial: Message[] = params.q
    ? [
        { id: '0u', role: 'user', text: params.q },
        { id: '0a', role: 'assistant', text: '', answer: resolveAnswer(params.q) },
      ]
    : [];

  const [messages, setMessages] = useState<Message[]>(initial);
  const [input, setInput] = useState('');

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const answer = resolveAnswer(trimmed);
    setMessages((prev) => [
      ...prev,
      { id: String(prev.length * 2), role: 'user', text: trimmed },
      { id: String(prev.length * 2 + 1), role: 'assistant', text: '', answer },
    ]);
    setInput('');
  };

  const isEmpty = messages.length === 0;
  const canSend = input.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={S.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={S.pageIntro}>
        <View>
          <Text style={S.eyebrow}>LOOK BACK</Text>
          <Text style={S.pageTitle}>Ask about progress</Text>
        </View>
        <Text style={S.pageRight}>Answers from your logs</Text>
      </View>

      <View style={S.cardStatic}>
        <View style={S.cardHead}>
          <View style={[S.tile, { backgroundColor: colors.indigoSoft }]}>
            <Icon name="chat" size={18} color={colors.indigo} />
          </View>
          <View style={S.cardHeadText}>
            <Text style={S.cardTitle}>Recall and reflect</Text>
            <Text style={S.cardSubtitle}>{"Ask about a goal, a workout, or what's next"}</Text>
          </View>
        </View>
        <View style={S.examples}>
          {EXAMPLES.map((ex) => (
            <TouchableOpacity key={ex.key} style={S.exChip} onPress={() => send(ex.q)} activeOpacity={0.75}>
              <Text style={S.exChipText}>{ex.q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[S.msgList, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {isEmpty && (
          <View style={S.emptyState}>
            <Text style={S.emptyEmoji}>🔍</Text>
            <Text style={S.emptyTitle}>Try a question above</Text>
            <Text style={S.emptyBody}>
              I know your goals, streaks, and weekly plan. Answers come from your logged activity.
            </Text>
          </View>
        )}

        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <View key={msg.id} style={S.userBubble}>
                <Text style={S.userText}>{msg.text}</Text>
              </View>
            );
          }
          const ans = msg.answer;
          if (!ans) return null;
          return (
            <View key={msg.id} style={S.answer}>
              <Text style={S.answerLabel}>{ans.label}</Text>
              <Text style={S.answerMain}>{ans.main}</Text>
              <Text style={S.answerCopy}>{ans.copy}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={[S.inputBar, { paddingBottom: insets.bottom + 10 }]}>
        <View style={S.form}>
          <TextInput
            style={S.formInput}
            placeholder="Am I on track with my gym goal?"
            placeholderTextColor={colors.ink3}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[S.submitBtn, !canSend && S.submitBtnDisabled]}
            onPress={() => send(input)}
            disabled={!canSend}
          >
            <Text style={[S.submitText, !canSend && S.submitTextDisabled]}>Ask</Text>
          </TouchableOpacity>
        </View>
        <Text style={S.hint}>
          🔒 This preview has sample answers. Live answers will come from your Pi.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

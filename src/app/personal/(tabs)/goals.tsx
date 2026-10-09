import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { BotTypingRow, PERSONAL_SAMPLES } from '@/components/MicRecorder';
import { FONT } from '@/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/tokens';

function makeStyles(C: Palette, shadow: object) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.paper },
    content: { paddingHorizontal: 22, paddingTop: 0 },

    intro: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4, marginBottom: 17 },
    pageTitle: { fontFamily: FONT.bricolage800, fontSize: 29, letterSpacing: -1.6, lineHeight: 32, color: C.ink, marginTop: 5 },
    eyebrow: { fontFamily: FONT.figtree700, fontSize: 10, letterSpacing: 1.3, color: C.ink2, textTransform: 'uppercase' },
    newBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.sage, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 13 },
    newBtnText: { fontFamily: FONT.figtree700, fontSize: 11, color: '#fff' },

    groupLabel: { fontFamily: FONT.figtree700, fontSize: 10, letterSpacing: 1.2, color: C.ink2, textTransform: 'uppercase', marginBottom: 10 },
    sectionH2: { fontFamily: FONT.bricolage800, fontSize: 17, letterSpacing: -0.6, color: C.ink, marginTop: 5 },

    goalCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 19, padding: 16, marginBottom: 12, ...shadow },
    goalTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    goalSymbol: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    goalEmoji: { fontSize: 16 },
    goalMeta: { flex: 1, minWidth: 0 },
    goalTitle: { fontFamily: FONT.figtree700, fontSize: 12, letterSpacing: -0.25, color: C.ink },
    goalSubtitle: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, marginTop: 3 },
    goalValue: { fontFamily: FONT.figtree700, fontSize: 11, color: C.sage, flexShrink: 0 },
    track: { height: 6, borderRadius: 99, backgroundColor: C.line, overflow: 'hidden', marginTop: 11, marginBottom: 7 },
    trackFill: { height: '100%', borderRadius: 99 },
    goalNext: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 14.5 },
    goalFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    streakText: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2 },
    logBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 9, backgroundColor: C.surface2 },
    logBtnText: { fontFamily: FONT.figtree700, fontSize: 10, color: C.sage },

    form: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, padding: 6, borderWidth: 1, borderColor: C.line, borderRadius: 13, backgroundColor: C.surface2 },
    formInput: { flex: 1, minWidth: 0, fontFamily: FONT.figtree400, fontSize: 12, color: C.ink, paddingVertical: 6, paddingHorizontal: 7 },
    iconBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: C.sageSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    submitBtn: { height: 32, paddingHorizontal: 11, borderRadius: 9, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    submitText: { fontFamily: FONT.figtree700, fontSize: 11, color: '#fff' },
    hint: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink3, lineHeight: 15, marginTop: 10 },

    modal: { flex: 1, backgroundColor: C.paper, paddingHorizontal: 22 },
    modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    modalTitle: { fontFamily: FONT.bricolage800, fontSize: 22, letterSpacing: -0.6, color: C.ink },
    modalClose: { fontFamily: FONT.figtree700, fontSize: 13, color: C.sage },
    fieldLabel: { fontFamily: FONT.figtree700, fontSize: 10, letterSpacing: 1.2, color: C.ink2, textTransform: 'uppercase', marginBottom: 6 },
    fieldRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
    fieldInput: { fontFamily: FONT.figtree400, fontSize: 14, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: C.surface },

    empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },

    privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: C.sageSoft, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, marginTop: 10 },
    privacyTitle: { fontFamily: FONT.figtree700, fontSize: 11, color: C.sage, marginBottom: 3 },
    privacyBody: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 14.5 },
  });
}

type Goal = { id: string; emoji: string; title: string; sub: string; current: number; target: number; variant: 'teal' | 'violet'; next: string; streak: number };

const SEED: Goal[] = [
  { id: 'gym', emoji: '✳', title: 'Gym 3 times a week', sub: 'Weekly routine · 8-week goal', current: 2, target: 3, variant: 'teal', next: 'Next step · Sunday session at 9:00 AM', streak: 3 },
  { id: 'ai', emoji: '◇', title: 'Finish an AI course', sub: '8 lessons · by October 31', current: 5, target: 8, variant: 'violet', next: 'Next step · Lesson 6 today at 7:00 PM', streak: 5 },
  { id: 'water', emoji: '◈', title: 'Drink 2 L of water daily', sub: 'Daily habit', current: 1, target: 2, variant: 'teal', next: 'Next step · top up before dinner', streak: 12 },
];

function GoalCard({ goal, onLog, S, colors }: { goal: Goal; onLog: (id: string) => void; S: ReturnType<typeof makeStyles>; colors: Palette }) {
  const pct = Math.min(goal.current / goal.target, 1);
  const isViolet = goal.variant === 'violet';
  const trackColor = isViolet ? colors.indigo : colors.sage;
  const symBg = isViolet ? colors.indigoSoft : colors.sageSoft;
  const valueColor = isViolet ? colors.indigo : colors.sage;

  return (
    <View style={S.goalCard}>
      <View style={S.goalTop}>
        <View style={[S.goalSymbol, { backgroundColor: symBg }]}>
          <Text style={S.goalEmoji}>{goal.emoji}</Text>
        </View>
        <View style={S.goalMeta}>
          <Text style={S.goalTitle}>{goal.title}</Text>
          <Text style={S.goalSubtitle}>{goal.sub}</Text>
        </View>
        <Text style={[S.goalValue, { color: valueColor }]}>
          {goal.current} of {goal.target}
        </Text>
      </View>
      <View style={S.track}>
        <View style={[S.trackFill, { width: `${pct * 100}%` as any, backgroundColor: trackColor }]} />
      </View>
      <Text style={S.goalNext}>{goal.next}</Text>
      <View style={S.goalFoot}>
        <Text style={S.streakText}>🔥 {goal.streak} day streak</Text>
        <TouchableOpacity style={S.logBtn} onPress={() => onLog(goal.id)} activeOpacity={0.75}>
          <Icon name="plus" size={13} color={colors.sage} />
          <Text style={S.logBtnText}>Log progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddGoalModal({ visible, onClose, S, colors }: { visible: boolean; onClose: () => void; S: ReturnType<typeof makeStyles>; colors: Palette }) {
  const insets = useSafeAreaInsets();
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [recording, setRecording] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[S.modal, { paddingTop: insets.top + 16 }]}>
        <View style={S.modalHead}>
          <Text style={S.modalTitle}>New goal</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={S.modalClose}>Cancel</Text>
          </Pressable>
        </View>
        <Text style={S.fieldLabel}>WHAT DO YOU WANT TO DO?</Text>
        <View style={S.form}>
          {recording ? (
            <BotTypingRow
              color={colors.sage}
              bgColor={colors.sageSoft}
              samples={PERSONAL_SAMPLES}
              onCancel={() => setRecording(false)}
              onResult={(t) => { setLabel(t); setRecording(false); }}
            />
          ) : (
            <>
              <TextInput
                style={S.formInput}
                placeholder="e.g. Go to the gym 3 times a week for 8 weeks"
                placeholderTextColor={colors.ink3}
                value={label}
                onChangeText={setLabel}
                multiline
              />
              <Pressable style={S.iconBtn} onPress={() => setRecording(true)} hitSlop={6}>
                <Icon name="mic" size={17} color={colors.sage} />
              </Pressable>
              <TouchableOpacity
                style={[S.submitBtn, !label.trim() && { backgroundColor: colors.line }]}
                onPress={() => { if (label.trim()) { onClose(); setLabel(''); setTarget(''); setUnit(''); } }}
              >
                <Text style={[S.submitText, !label.trim() && { color: colors.ink3 }]}>Plan it</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={S.fieldRow}>
          <View style={{ flex: 1 }}>
            <Text style={S.fieldLabel}>TARGET</Text>
            <TextInput style={S.fieldInput} placeholder="3" placeholderTextColor={colors.ink3} keyboardType="numeric" value={target} onChangeText={setTarget} />
          </View>
          <View style={{ flex: 2 }}>
            <Text style={S.fieldLabel}>UNIT</Text>
            <TextInput style={S.fieldInput} placeholder="sessions, lessons, km…" placeholderTextColor={colors.ink3} value={unit} onChangeText={setUnit} />
          </View>
        </View>
        <Text style={S.hint}>The assistant suggests milestones and reminders. You review the plan before it starts.</Text>
      </View>
    </Modal>
  );
}

export default function PersonalGoalsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadow } = useTheme();
  const S = useMemo(() => makeStyles(colors, shadow), [colors, shadow]);
  const [goals, setGoals] = useState(SEED);
  const [showAdd, setShowAdd] = useState(false);

  const handleLog = (id: string) => {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, current: Math.min(g.current + 1, g.target) } : g));
  };

  const active = goals.filter((g) => g.current < g.target);
  const done = goals.filter((g) => g.current >= g.target);

  return (
    <View style={S.screen}>
      <ScrollView
        contentContainerStyle={[S.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.intro}>
          <View>
            <Text style={S.eyebrow}>WHAT MATTERS TO YOU</Text>
            <Text style={S.pageTitle}>Your goals</Text>
          </View>
          <TouchableOpacity style={S.newBtn} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
            <Icon name="plus" size={14} color="#fff" />
            <Text style={S.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {active.length > 0 && (
          <>
            <Text style={S.groupLabel}>{active.length} in progress</Text>
            {active.map((g) => <GoalCard key={g.id} goal={g} onLog={handleLog} S={S} colors={colors} />)}
          </>
        )}

        {done.length > 0 && (
          <>
            <Text style={[S.groupLabel, { marginTop: 18 }]}>Completed this period</Text>
            {done.map((g) => <GoalCard key={g.id} goal={g} onLog={handleLog} S={S} colors={colors} />)}
          </>
        )}

        {goals.length === 0 && (
          <View style={S.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🎯</Text>
            <Text style={S.sectionH2}>No goals yet</Text>
            <Text style={S.hint}>Add your first goal and start building better habits.</Text>
          </View>
        )}

        <View style={S.privacy}>
          <Icon name="check" size={18} color={colors.sage} />
          <View style={{ flex: 1 }}>
            <Text style={S.privacyTitle}>Your goals stay yours</Text>
            <Text style={S.privacyBody}>Plans and progress stay on the Pi. The phone is your view.</Text>
          </View>
        </View>
      </ScrollView>

      <AddGoalModal visible={showAdd} onClose={() => setShowAdd(false)} S={S} colors={colors} />
    </View>
  );
}

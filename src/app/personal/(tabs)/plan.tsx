import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT } from '@/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/tokens';

function makeStyles(C: Palette, shadow: object) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.paper },

    chipBarWrap: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
    chipBar: { paddingHorizontal: 22, paddingVertical: 12, gap: 8 },
    dayChip: { width: 50, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 11, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, gap: 2 },
    dayChipDay: { fontFamily: FONT.figtree700, fontSize: 10, color: C.ink3, letterSpacing: 0.5 },
    dayChipDate: { fontFamily: FONT.bricolage800, fontSize: 14, color: C.ink },

    content: { paddingHorizontal: 22, paddingTop: 4 },
    dayHeader: { marginTop: 16, marginBottom: 14 },
    eyebrow: { fontFamily: FONT.figtree700, fontSize: 10, letterSpacing: 1.3, color: C.ink2, textTransform: 'uppercase' },
    sectionH2: { fontFamily: FONT.bricolage800, fontSize: 17, letterSpacing: -0.6, color: C.ink, marginTop: 5 },
    sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 20, marginBottom: 11 },
    sectionSmall: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, marginBottom: 1 },

    planRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
    planDate: { width: 41, minHeight: 40, paddingVertical: 5, paddingHorizontal: 3, borderRadius: 10, backgroundColor: C.sageSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    planDatePurple: { backgroundColor: C.indigoSoft },
    planDateDone: { backgroundColor: C.surface2 },
    planDateDay: { fontFamily: FONT.figtree700, fontSize: 9, color: C.sage, textAlign: 'center', letterSpacing: 0.3 },
    planDateNum: { fontFamily: FONT.bricolage800, fontSize: 14, color: C.sage, textAlign: 'center', lineHeight: 17 },
    planInfo: { flex: 1 },
    planTitle: { fontFamily: FONT.figtree700, fontSize: 11, color: C.ink },
    planTitleDone: { textDecorationLine: 'line-through', color: C.ink3 },
    planSubtitle: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 15, marginTop: 3 },
    checkmark: { fontFamily: FONT.figtree700, fontSize: 12, color: C.sage, flexShrink: 0 },

    emptyDay: { alignItems: 'center', paddingTop: 40 },
    hint: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink3, lineHeight: 15, marginTop: 6 },

    card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 19, padding: 16, marginBottom: 12, ...shadow },
    cardHead: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 14 },
    cardHeadText: { flex: 1, minWidth: 0 },
    cardTitle: { fontFamily: FONT.figtree700, fontSize: 13, letterSpacing: -0.3, color: C.ink },
    cardSubtitle: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 14.5, marginTop: 3 },
    tile: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    goalSymbol: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    goalEmoji: { fontSize: 16 },
    summaryMeta: { flex: 1, minWidth: 0 },
    summaryTitle: { fontFamily: FONT.figtree700, fontSize: 11, color: C.ink },
    summaryNote: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, marginTop: 2 },
    summaryPct: { fontFamily: FONT.figtree700, fontSize: 11, color: C.sage, flexShrink: 0 },
    track: { height: 6, borderRadius: 99, backgroundColor: C.line, overflow: 'hidden', marginTop: 8, marginBottom: 4 },
    trackFill: { height: '100%', borderRadius: 99 },
    sheetNote: { marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: C.sageSoft },
    sheetNoteText: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 15 },
  });
}

type DayPlan = { day: string; date: number; month: string; isToday: boolean; items: PlanItem[] };
type PlanItem = { id: string; title: string; sub: string; variant: 'teal' | 'violet'; done?: boolean };

const WEEK: DayPlan[] = [
  {
    day: 'MON', date: 6, month: 'OCT', isToday: false,
    items: [
      { id: 'm1', title: 'Gym session 1 of 3', sub: 'Chest · 45 min · completed', variant: 'teal', done: true },
      { id: 'm2', title: 'Lesson 4 — Attention', sub: 'AI course · completed', variant: 'violet', done: true },
    ],
  },
  {
    day: 'TUE', date: 7, month: 'OCT', isToday: false,
    items: [
      { id: 't1', title: 'Gym session 2 of 3', sub: 'Legs · 50 min · completed', variant: 'teal', done: true },
      { id: 't2', title: 'Lesson 5 — Fine-tuning', sub: 'AI course · completed', variant: 'violet', done: true },
    ],
  },
  {
    day: 'WED', date: 8, month: 'OCT', isToday: false,
    items: [{ id: 'w1', title: 'Badminton, 60 min', sub: 'Activity log · completed', variant: 'teal', done: true }],
  },
  {
    day: 'THU', date: 9, month: 'OCT', isToday: true,
    items: [{ id: 'th1', title: 'Finish lesson 6', sub: 'AI course · planned for 7:00 PM today', variant: 'violet' }],
  },
  {
    day: 'FRI', date: 10, month: 'OCT', isToday: false,
    items: [{ id: 'f1', title: 'Lesson 7 — RAG systems', sub: 'AI course · planned for 7:00 PM', variant: 'violet' }],
  },
  {
    day: 'SAT', date: 11, month: 'OCT', isToday: false,
    items: [{ id: 'sa1', title: 'Lesson 8 — Evaluation', sub: 'AI course · planned for 3:00 PM', variant: 'violet' }],
  },
  {
    day: 'SUN', date: 12, month: 'OCT', isToday: false,
    items: [{ id: 'su1', title: 'Gym session 3 of 3', sub: 'Weekly gym goal · planned for 9:00 AM', variant: 'teal' }],
  },
];

export default function PersonalPlanScreen() {
  const insets = useSafeAreaInsets();
  const { colors, shadow } = useTheme();
  const S = useMemo(() => makeStyles(colors, shadow), [colors, shadow]);

  const todayIdx = WEEK.findIndex((d) => d.isToday);
  const [selectedIdx, setSelectedIdx] = useState(todayIdx >= 0 ? todayIdx : 0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  const selected = WEEK[selectedIdx];

  return (
    <View style={S.screen}>
      {/* Day chip bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.chipBar}
        style={S.chipBarWrap}
      >
        {WEEK.map((day, idx) => {
          const active = selectedIdx === idx;
          return (
            <TouchableOpacity
              key={day.day}
              onPress={() => setSelectedIdx(idx)}
              style={[
                S.dayChip,
                active && { backgroundColor: colors.sage, borderColor: colors.sage },
                !active && day.isToday && { borderColor: colors.sage, backgroundColor: colors.sageSoft },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[S.dayChipDay, active && { color: '#fff' }, !active && day.isToday && { color: colors.sage }]}>
                {day.day}
              </Text>
              <Text style={[S.dayChipDate, active && { color: '#fff' }, !active && day.isToday && { color: colors.sage }]}>
                {day.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[S.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.dayHeader}>
          <Text style={S.eyebrow}>
            {selected.day} · {selected.month} {selected.date}{selected.isToday ? '  · TODAY' : ''}
          </Text>
          <Text style={S.sectionH2}>
            {selected.items.length} step{selected.items.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {selected.items.map((item) => {
          const isDone = item.done || checked[item.id];
          const isViolet = item.variant === 'violet';
          return (
            <View key={item.id} style={S.planRow}>
              <TouchableOpacity
                onPress={() => !item.done && toggle(item.id)}
                style={[
                  S.planDate,
                  isViolet ? S.planDatePurple : null,
                  isDone ? S.planDateDone : null,
                ]}
              >
                <Text style={[
                  S.planDateDay,
                  isViolet && !isDone && { color: colors.indigo },
                  isDone && { color: colors.ink3 },
                ]}>
                  {selected.day}
                </Text>
                <Text style={[
                  S.planDateNum,
                  isViolet && !isDone && { color: colors.indigo },
                  isDone && { color: colors.ink3 },
                ]}>
                  {selected.date}
                </Text>
              </TouchableOpacity>
              <View style={S.planInfo}>
                <Text style={[S.planTitle, isDone && S.planTitleDone]}>{item.title}</Text>
                <Text style={S.planSubtitle}>{item.sub}</Text>
              </View>
              {isDone && <Text style={S.checkmark}>✓</Text>}
            </View>
          );
        })}

        {selected.items.length === 0 && (
          <View style={S.emptyDay}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🌿</Text>
            <Text style={S.hint}>Rest day — nothing planned.</Text>
          </View>
        )}

        {/* Week summary */}
        <View style={S.sectionHead}>
          <View>
            <Text style={S.eyebrow}>THIS WEEK</Text>
            <Text style={S.sectionH2}>Week at a glance</Text>
          </View>
          <Text style={S.sectionSmall}>Oct 6 – 12</Text>
        </View>
        <View style={S.card}>
          <View style={S.cardHead}>
            <View style={[S.tile, { backgroundColor: colors.indigoSoft }]}>
              <Text style={{ fontSize: 18 }}>◈</Text>
            </View>
            <View style={S.cardHeadText}>
              <Text style={S.cardTitle}>Plans can change</Text>
              <Text style={S.cardSubtitle}>Report progress or move a step — the assistant proposes a new schedule for your approval.</Text>
            </View>
          </View>

          <View style={S.summaryRow}>
            <View style={[S.goalSymbol, { backgroundColor: colors.sageSoft }]}>
              <Text style={S.goalEmoji}>✳</Text>
            </View>
            <View style={S.summaryMeta}>
              <Text style={S.summaryTitle}>Gym 3× each week</Text>
              <Text style={S.summaryNote}>2 sessions logged · 1 planned Sunday 9 AM</Text>
            </View>
            <Text style={S.summaryPct}>67%</Text>
          </View>
          <View style={S.track}>
            <View style={[S.trackFill, { width: '67%', backgroundColor: colors.sage }]} />
          </View>

          <View style={[S.summaryRow, { marginTop: 12 }]}>
            <View style={[S.goalSymbol, { backgroundColor: colors.indigoSoft }]}>
              <Text style={S.goalEmoji}>◇</Text>
            </View>
            <View style={S.summaryMeta}>
              <Text style={S.summaryTitle}>AI course · 8 lessons</Text>
              <Text style={S.summaryNote}>5 done · lessons 6-8 planned Fri–Sun</Text>
            </View>
            <Text style={[S.summaryPct, { color: colors.indigo }]}>62%</Text>
          </View>
          <View style={S.track}>
            <View style={[S.trackFill, { width: '62%', backgroundColor: colors.indigo }]} />
          </View>

          <View style={S.sheetNote}>
            <Text style={S.sheetNoteText}>
              The nudge comes from an approved time on your plan. You can change or pause it.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
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
    avatar: { width: 37, height: 37, borderRadius: 13, backgroundColor: C.marigoldSoft, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: FONT.figtree700, fontSize: 12, color: C.marigold },
    pageTitle: { fontFamily: FONT.bricolage800, fontSize: 29, letterSpacing: -1.6, lineHeight: 32, color: C.ink, marginTop: 5 },
    eyebrow: { fontFamily: FONT.figtree700, fontSize: 10, letterSpacing: 1.3, color: C.ink2, textTransform: 'uppercase' },

    hero: { position: 'relative', overflow: 'hidden', padding: 19, borderRadius: 22, backgroundColor: C.heroBg, marginBottom: 24, shadowColor: C.heroBg, shadowOffset: { width: 0, height: 13 }, shadowOpacity: 0.22, shadowRadius: 30, elevation: 8 },
    heroCircle1: { position: 'absolute', right: -94, top: -104, width: 215, height: 215, borderRadius: 108, borderWidth: 1, borderColor: 'rgba(180,190,255,0.2)' },
    heroCircle2: { position: 'absolute', right: -129, top: -64, width: 215, height: 215, borderRadius: 108, borderWidth: 1, borderColor: 'rgba(180,190,255,0.15)' },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    heroEyebrowText: { fontFamily: FONT.figtree700, fontSize: 10, letterSpacing: 1.2, color: '#bec8ff', textTransform: 'uppercase' },
    heroTag: { borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.14)', paddingVertical: 6, paddingHorizontal: 9 },
    heroTagText: { fontFamily: FONT.figtree700, fontSize: 10, color: '#eef0ff' },
    heroH2: { fontFamily: FONT.bricolage800, fontSize: 23, letterSpacing: -1.15, lineHeight: 26, color: '#fff', maxWidth: 268, marginBottom: 8 },
    heroBody: { fontFamily: FONT.figtree400, fontSize: 11, color: '#bdc6ff', lineHeight: 17 },
    heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.paper, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginTop: 16, alignSelf: 'flex-start' },
    heroBtnText: { fontFamily: FONT.figtree700, fontSize: 11, color: C.heroBg },

    sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 20, marginBottom: 11 },
    sectionH2: { fontFamily: FONT.bricolage800, fontSize: 17, letterSpacing: -0.6, color: C.ink, marginTop: 5 },
    sectionSmall: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, marginBottom: 1 },

    card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 19, padding: 16, marginBottom: 12, ...shadow },
    cardHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    cardHeadText: { flex: 1, minWidth: 0 },
    cardTitle: { fontFamily: FONT.figtree700, fontSize: 13, letterSpacing: -0.3, color: C.ink },
    cardSubtitle: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 14.5, marginTop: 3 },
    tile: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

    form: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, padding: 6, borderWidth: 1, borderColor: C.line, borderRadius: 13, backgroundColor: C.surface2 },
    formInput: { flex: 1, minWidth: 0, fontFamily: FONT.figtree400, fontSize: 12, color: C.ink, paddingVertical: 6, paddingHorizontal: 7 },
    iconBtn: { width: 32, height: 32, borderRadius: 9, backgroundColor: C.sageSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    submitBtn: { height: 32, paddingHorizontal: 11, borderRadius: 9, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    submitText: { fontFamily: FONT.figtree700, fontSize: 11, color: '#fff' },

    examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
    exChip: { borderWidth: 1, borderColor: C.line, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 9, backgroundColor: C.surface2 },
    exChipText: { fontFamily: FONT.figtree700, fontSize: 10, color: C.sage },

    hint: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink3, lineHeight: 15, marginTop: 10 },
    hintBold: { fontFamily: FONT.figtree700, color: C.ink2 },

    goal: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
    goalLast: { borderBottomWidth: 0, paddingBottom: 4 },
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

    featureLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
    featureLinkText: { fontFamily: FONT.figtree700, fontSize: 11, color: C.sage },
    featureLinkArrow: { fontFamily: FONT.figtree700, fontSize: 16, color: C.sage, lineHeight: 18 },

    planRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
    planDate: { width: 41, minHeight: 40, paddingVertical: 5, paddingHorizontal: 3, borderRadius: 10, backgroundColor: C.sageSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    planDatePurple: { backgroundColor: C.indigoSoft },
    planDateText: { fontFamily: FONT.figtree700, fontSize: 10, color: C.sage, textAlign: 'center', lineHeight: 13 },
    planInfo: { flex: 1 },
    planTitle: { fontFamily: FONT.figtree700, fontSize: 11, color: C.ink },
    planSubtitle: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 15, marginTop: 3 },

    answer: { marginTop: 12, padding: 12, borderWidth: 1, borderColor: C.line, borderRadius: 12, backgroundColor: C.sageSoft },
    answerLabel: { fontFamily: FONT.figtree700, fontSize: 10, color: C.sage, letterSpacing: 0.5, textTransform: 'uppercase' },
    answerMain: { fontFamily: FONT.figtree700, fontSize: 12, color: C.ink, lineHeight: 18, marginTop: 5 },
    answerCopy: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 15.5, marginTop: 5 },

    nudge: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 13, backgroundColor: C.marigoldSoft, marginTop: 14, marginBottom: 10 },
    nudgeText: { flex: 1 },
    nudgeStrong: { fontFamily: FONT.figtree700, fontSize: 11, color: C.ink },
    nudgeBody: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 15, marginTop: 3 },
    nudgeActions: { flexDirection: 'row', gap: 8 },
    nudgeBtnWarm: { flex: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: C.marigoldSoft, borderWidth: 1, borderColor: C.line, alignItems: 'center' },
    nudgeBtnWarmText: { fontFamily: FONT.figtree700, fontSize: 11, color: C.marigold },
    nudgeBtnGreen: { flex: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, backgroundColor: C.sageSoft, alignItems: 'center' },
    nudgeBtnGreenText: { fontFamily: FONT.figtree700, fontSize: 11, color: C.sage },
    tagAmber: { borderRadius: 99, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: C.marigoldSoft, flexShrink: 0 },
    tagAmberText: { fontFamily: FONT.figtree700, fontSize: 10, color: C.marigold },

    privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: C.sageSoft, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, marginBottom: 4 },
    privacyText: { flex: 1 },
    privacyTitle: { fontFamily: FONT.figtree700, fontSize: 11, color: C.sage, marginBottom: 3 },
    privacyBody: { fontFamily: FONT.figtree400, fontSize: 10, color: C.ink2, lineHeight: 14.5 },
  });
}

const ANSWERS = {
  track: {
    label: 'This week · gym goal',
    main: '2 of 3 gym sessions logged.',
    copy: 'You completed chest on Tuesday and legs on Thursday. One more session is planned for Sunday.',
  },
  yesterday: {
    label: 'Friday · October 8',
    main: 'You logged a gym session at 6:30 PM.',
    copy: 'That activity is in your Friday log. Your most recent AI lesson was lesson 5 on Thursday, October 7.',
  },
  next: {
    label: 'Upcoming steps',
    main: 'Lesson 6 today; gym session 3 on Sunday.',
    copy: 'AI course lesson 6 is planned for tonight at 7:00 PM. Your third gym session is planned for Sunday 9:00 AM.',
  },
} as const;

export default function PersonalTodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, shadow } = useTheme();
  const S = useMemo(() => makeStyles(colors, shadow), [colors, shadow]);

  const [goalText, setGoalText] = useState('');
  const [logText, setLogText] = useState('');
  const [recordGoal, setRecordGoal] = useState(false);
  const [recordLog, setRecordLog] = useState(false);
  const [askText, setAskText] = useState('');
  const [answer, setAnswer] = useState<{ label: string; main: string; copy: string } | null>(null);
  const [nudgeDone, setNudgeDone] = useState(false);

  const showAnswer = (key: keyof typeof ANSWERS, q: string) => {
    setAnswer(ANSWERS[key]);
    setAskText(q);
  };

  const handleAskSubmit = () => {
    const q = askText.toLowerCase();
    if (/yesterday|friday/.test(q)) showAnswer('yesterday', askText);
    else if (/next|when|upcoming|plan/.test(q)) showAnswer('next', askText);
    else showAnswer('track', askText);
  };

  return (
    <ScrollView
      style={S.screen}
      contentContainerStyle={[S.content, { paddingBottom: insets.bottom + 110 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Intro */}
      <View style={S.intro}>
        <View>
          <Text style={S.eyebrow}>FRIDAY · OCT 9</Text>
          <Text style={S.pageTitle}>Personal space</Text>
        </View>
        <View style={S.avatar}>
          <Text style={S.avatarText}>ME</Text>
        </View>
      </View>

      {/* Hero */}
      <View style={S.hero}>
        <View style={S.heroCircle1} />
        <View style={S.heroCircle2} />
        <View style={S.heroTop}>
          <Text style={S.heroEyebrowText}>{"Today's next step"}</Text>
          <View style={S.heroTag}>
            <Text style={S.heroTagText}>2 active goals</Text>
          </View>
        </View>
        <Text style={S.heroH2}>A plan you can actually follow.</Text>
        <Text style={S.heroBody}>
          Finish lesson 6 today. Your third gym session is planned for Sunday.
        </Text>
        <TouchableOpacity
          style={S.heroBtn}
          onPress={() => router.push('/personal/plan' as any)}
          activeOpacity={0.8}
        >
          <Text style={S.heroBtnText}>{"See today's plan"}</Text>
          <Icon name="calendar" size={14} color={colors.heroBg} />
        </TouchableOpacity>
      </View>

      {/* Add a goal */}
      <View style={S.sectionHead}>
        <View>
          <Text style={S.eyebrow}>START HERE</Text>
          <Text style={S.sectionH2}>What do you want to do?</Text>
        </View>
        <Text style={S.sectionSmall}>Any personal goal</Text>
      </View>
      <View style={S.card}>
        <View style={S.cardHead}>
          <View style={[S.tile, { backgroundColor: colors.sageSoft }]}>
            <Icon name="target" size={18} color={colors.sage} />
          </View>
          <View style={S.cardHeadText}>
            <Text style={S.cardTitle}>Add a goal</Text>
            <Text style={S.cardSubtitle}>Describe it naturally, then approve the proposed plan</Text>
          </View>
        </View>
        <View style={S.form}>
          {recordGoal ? (
            <BotTypingRow
              color={colors.sage}
              bgColor={colors.sageSoft}
              samples={PERSONAL_SAMPLES}
              onCancel={() => setRecordGoal(false)}
              onResult={(t) => { setGoalText(t); setRecordGoal(false); }}
            />
          ) : (
            <>
              <TextInput
                style={S.formInput}
                placeholder="I want to go to the gym 3 times a week"
                placeholderTextColor={colors.ink3}
                value={goalText}
                onChangeText={setGoalText}
              />
              <Pressable style={S.iconBtn} onPress={() => setRecordGoal(true)} hitSlop={6}>
                <Icon name="mic" size={17} color={colors.sage} />
              </Pressable>
              <TouchableOpacity style={S.submitBtn}>
                <Text style={S.submitText}>Plan it</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={S.examples}>
          <TouchableOpacity style={S.exChip}>
            <Text style={S.exChipText}>Try a fitness goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.exChip}>
            <Text style={S.exChipText}>Try a learning goal</Text>
          </TouchableOpacity>
        </View>
        <Text style={S.hint}>
          The assistant suggests milestones and reminders. You review the plan before it starts.
        </Text>
      </View>

      {/* Your goals */}
      <View style={S.sectionHead}>
        <View>
          <Text style={S.eyebrow}>WHAT MATTERS TO YOU</Text>
          <Text style={S.sectionH2}>Your goals</Text>
        </View>
        <Text style={S.sectionSmall}>2 in progress</Text>
      </View>
      <View style={S.card}>
        <View style={S.goal}>
          <View style={S.goalTop}>
            <View style={[S.goalSymbol, { backgroundColor: colors.sageSoft }]}>
              <Text style={S.goalEmoji}>✳</Text>
            </View>
            <View style={S.goalMeta}>
              <Text style={S.goalTitle}>Gym 3 times a week</Text>
              <Text style={S.goalSubtitle}>Weekly routine · 8-week goal</Text>
            </View>
            <Text style={S.goalValue}>2 of 3</Text>
          </View>
          <View style={S.track}>
            <View style={[S.trackFill, { width: '66.7%', backgroundColor: colors.sage }]} />
          </View>
          <Text style={S.goalNext}>Next step · Sunday session at 9:00 AM</Text>
        </View>

        <View style={[S.goal, S.goalLast]}>
          <View style={S.goalTop}>
            <View style={[S.goalSymbol, { backgroundColor: colors.indigoSoft }]}>
              <Text style={S.goalEmoji}>◇</Text>
            </View>
            <View style={S.goalMeta}>
              <Text style={S.goalTitle}>Finish an AI course</Text>
              <Text style={S.goalSubtitle}>8 lessons · by October 31</Text>
            </View>
            <Text style={[S.goalValue, { color: colors.indigo }]}>5 of 8</Text>
          </View>
          <View style={S.track}>
            <View style={[S.trackFill, { width: '62.5%', backgroundColor: colors.indigo }]} />
          </View>
          <Text style={S.goalNext}>Next step · Lesson 6 today at 7:00 PM</Text>
        </View>

        <TouchableOpacity
          style={S.featureLink}
          onPress={() => router.push('/personal/goals' as any)}
          activeOpacity={0.75}
        >
          <Text style={S.featureLinkText}>See goal plans and milestones</Text>
          <Text style={S.featureLinkArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Today's plan */}
      <View style={S.sectionHead}>
        <View>
          <Text style={S.eyebrow}>SMALL STEPS</Text>
          <Text style={S.sectionH2}>{"Today's plan"}</Text>
        </View>
        <Text style={S.sectionSmall}>Suggested from your goals</Text>
      </View>
      <View style={S.card}>
        <View style={S.cardHead}>
          <View style={[S.tile, { backgroundColor: colors.indigoSoft }]}>
            <Icon name="calendar" size={18} color={colors.indigo} />
          </View>
          <View style={S.cardHeadText}>
            <Text style={S.cardTitle}>Upcoming actions</Text>
            <Text style={S.cardSubtitle}>Move a step if your day changes</Text>
          </View>
        </View>

        <View style={S.planRow}>
          <View style={[S.planDate, S.planDatePurple]}>
            <Text style={[S.planDateText, { color: colors.indigo }]}>{'THU\n9'}</Text>
          </View>
          <View style={S.planInfo}>
            <Text style={S.planTitle}>Finish lesson 6</Text>
            <Text style={S.planSubtitle}>AI course · planned for 7:00 PM today</Text>
          </View>
        </View>

        <View style={[S.planRow, { borderBottomWidth: 0 }]}>
          <View style={S.planDate}>
            <Text style={S.planDateText}>{'SUN\n12'}</Text>
          </View>
          <View style={S.planInfo}>
            <Text style={S.planTitle}>Gym session 3 of 3</Text>
            <Text style={S.planSubtitle}>Weekly gym goal · planned for 9:00 AM</Text>
          </View>
        </View>

        <TouchableOpacity
          style={S.featureLink}
          onPress={() => router.push('/personal/plan' as any)}
          activeOpacity={0.75}
        >
          <Text style={S.featureLinkText}>{"View the week's plan"}</Text>
          <Text style={S.featureLinkArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Log progress */}
      <View style={S.sectionHead}>
        <View>
          <Text style={S.eyebrow}>TELL YOUR ASSISTANT</Text>
          <Text style={S.sectionH2}>Log progress</Text>
        </View>
        <Text style={S.sectionSmall}>Voice or app</Text>
      </View>
      <View style={S.card}>
        <View style={S.cardHead}>
          <View style={[S.tile, { backgroundColor: colors.sageSoft }]}>
            <Icon name="check" size={18} color={colors.sage} />
          </View>
          <View style={S.cardHeadText}>
            <Text style={S.cardTitle}>A simple progress update</Text>
            <Text style={S.cardSubtitle}>Linked to the right goal for your review</Text>
          </View>
        </View>
        <View style={S.form}>
          {recordLog ? (
            <BotTypingRow
              color={colors.sage}
              bgColor={colors.sageSoft}
              samples={PERSONAL_SAMPLES}
              onCancel={() => setRecordLog(false)}
              onResult={(t) => { setLogText(t); setRecordLog(false); }}
            />
          ) : (
            <>
              <TextInput
                style={S.formInput}
                placeholder="Gym today, legs for 50 minutes"
                placeholderTextColor={colors.ink3}
                value={logText}
                onChangeText={setLogText}
              />
              <Pressable style={S.iconBtn} onPress={() => setRecordLog(true)} hitSlop={6}>
                <Icon name="mic" size={17} color={colors.sage} />
              </Pressable>
              <TouchableOpacity style={S.submitBtn} onPress={() => setLogText('')}>
                <Text style={S.submitText}>Log</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={S.hint}>
          {'Also try '}
          <Text style={S.hintBold}>Finished lesson 6</Text>
          {' or '}
          <Text style={S.hintBold}>Played badminton for an hour</Text>
          {'.'}
        </Text>
      </View>

      {/* Ask about progress */}
      <View style={S.sectionHead}>
        <View>
          <Text style={S.eyebrow}>LOOK BACK</Text>
          <Text style={S.sectionH2}>Ask about progress</Text>
        </View>
        <Text style={S.sectionSmall}>Answers from your logs</Text>
      </View>
      <View style={S.card}>
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
          <TouchableOpacity style={S.exChip} onPress={() => showAnswer('track', 'Am I on track?')}>
            <Text style={S.exChipText}>Am I on track?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.exChip} onPress={() => showAnswer('yesterday', 'What did I do yesterday?')}>
            <Text style={S.exChipText}>What did I do yesterday?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.exChip} onPress={() => showAnswer('next', "What's next?")}>
            <Text style={S.exChipText}>{"What's next?"}</Text>
          </TouchableOpacity>
        </View>
        <View style={S.form}>
          <TextInput
            style={S.formInput}
            placeholder="Am I on track with my gym goal?"
            placeholderTextColor={colors.ink3}
            value={askText}
            onChangeText={setAskText}
            onSubmitEditing={handleAskSubmit}
            returnKeyType="send"
          />
          <TouchableOpacity style={S.submitBtn} onPress={handleAskSubmit}>
            <Text style={S.submitText}>Ask</Text>
          </TouchableOpacity>
        </View>
        {answer && (
          <View style={S.answer}>
            <Text style={S.answerLabel}>{answer.label}</Text>
            <Text style={S.answerMain}>{answer.main}</Text>
            <Text style={S.answerCopy}>{answer.copy}</Text>
          </View>
        )}
      </View>

      {/* Timely nudge */}
      <View style={S.sectionHead}>
        <View>
          <Text style={S.eyebrow}>KEEP MOVING</Text>
          <Text style={S.sectionH2}>A timely nudge</Text>
        </View>
        <Text style={S.sectionSmall}>You control reminders</Text>
      </View>
      <View style={S.card}>
        <View style={S.cardHead}>
          <View style={[S.tile, { backgroundColor: colors.marigoldSoft }]}>
            <Icon name="bell" size={18} color={colors.marigold} />
          </View>
          <View style={S.cardHeadText}>
            <Text style={S.cardTitle}>One gym session left</Text>
            <Text style={S.cardSubtitle}>Based on the plan you approved</Text>
          </View>
          <View style={S.tagAmber}>
            <Text style={S.tagAmberText}>Suggested</Text>
          </View>
        </View>
        <View style={S.nudge}>
          <Icon name="target" size={17} color={colors.marigold} />
          <View style={S.nudgeText}>
            <Text style={S.nudgeStrong}>Sunday at 9:00 AM</Text>
            <Text style={S.nudgeBody}>{"You've logged two of three sessions this week. Keep the reminder or move it to a better time."}</Text>
          </View>
        </View>
        {nudgeDone ? (
          <Text style={S.hint}>Reminder preference saved · you can change it anytime.</Text>
        ) : (
          <View style={S.nudgeActions}>
            <TouchableOpacity style={S.nudgeBtnWarm} onPress={() => setNudgeDone(true)} activeOpacity={0.8}>
              <Text style={S.nudgeBtnWarmText}>Keep reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.nudgeBtnGreen} onPress={() => router.push('/personal/plan' as any)} activeOpacity={0.8}>
              <Text style={S.nudgeBtnGreenText}>Move this step</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Privacy */}
      <View style={S.privacy}>
        <Icon name="check" size={18} color={colors.sage} />
        <View style={S.privacyText}>
          <Text style={S.privacyTitle}>Your goals stay yours</Text>
          <Text style={S.privacyBody}>
            In the finished app, the Pi stores your plans and progress and runs the reasoning locally. The phone shows your progress.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

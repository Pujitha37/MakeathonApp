// Ported from `homeHTML()` in finprofile.html.
import React from 'react';
import { Pressable, ScrollView, StyleSheet as SS, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Hero } from '@/components/Hero';
import { QuickAddCard } from '@/components/QuickAddCard';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { AdviceCard } from '@/components/AdviceCard';
import { BudgetRow } from '@/components/BudgetRow';
import { ScheduleRow } from '@/components/ScheduleRow';
import { SparkLine } from '@/components/SparkLine';
import { StatusChip } from '@/components/StatusChip';
import { TxRow } from '@/components/TxRow';
import { Icon } from '@/components/Icon';
import { SectionTitle } from '@/components/SectionTitle';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '@/theme/ThemeProvider';
import { budgetStatus, byCat, coverageEnd, expenses, monthBounds, sum } from '@/lib/calc';
import { forecast } from '@/lib/forecast';
import { adviceList } from '@/lib/advice';
import { activeLoans, detectRecurring, isRec, scheduleItems } from '@/lib/recurring';
import { fd, fmt, MON, MONL } from '@/lib/format';
import { SHORT } from '@/data/types';
import { TODAY } from '@/data/seed';
import { CAT, CatId } from '@/theme/tokens';

const ASK_CHIPS: [string, string][] = [
  ['Food last month', 'How much did I spend on food last month?'],
  ['Biggest this month', 'Biggest expenses this month'],
  ['vs last month', 'Compare spending with last month'],
  ['My EMIs', 'How much do I pay in EMIs?'],
];

const askStyles = SS.create({
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
});

function HomeAskCard({ router }: { router: ReturnType<typeof useRouter> }) {
  const { colors, shadow } = useTheme();
  const [text, setText] = React.useState('');

  const go = (q: string) => {
    if (!q.trim()) return;
    router.push({ pathname: '/ask', params: { q } });
  };

  return (
    <Card style={{ padding: 12 }}>
      <View style={[askStyles.inputRow, { backgroundColor: colors.surface2 }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => go(text)}
          placeholder="Ask a question about your spending"
          placeholderTextColor={colors.ink3}
          style={[askStyles.input, { color: colors.ink }]}
          returnKeyType="send"
        />
        <Pressable onPress={() => go(text)} style={[askStyles.sendBtn, { backgroundColor: colors.indigo }]}>
          <Icon name="send" size={20} color="#fff" />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {ASK_CHIPS.map(([label, query]) => (
            <Pressable
              key={label}
              onPress={() => router.push({ pathname: '/ask', params: { q: query } })}
              style={[askStyles.chip, { backgroundColor: colors.surface, ...shadow }]}
            >
              <AppText type="captionMed">{label}</AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { tx, stmts, loans, budgets, goals, dismissed, scope, month, fcCat } = useStore(
    useShallow((s) => ({
      tx: s.tx,
      stmts: s.stmts,
      loans: s.loans,
      budgets: s.budgets,
      goals: s.goals,
      dismissed: s.dismissed,
      scope: s.scope,
      month: s.month,
      fcCat: s.fcCat,
    }))
  );
  const setMonth = useStore((s) => s.setMonth);

  const { y, m } = month;
  const mb = monthBounds(stmts, scope, y, m);
  const canPrev = !(y === 2026 && m === 6);
  const canNext = !(y === 2026 && m === 9);
  const isCur = y === 2026 && m === 9;

  let heroProps: any = {
    monthLabel: isCur ? 'October so far' : `${MONL[m]} ${y}`,
    canPrev,
    canNext,
    onPrev: () => setMonth(-1),
    onNext: () => setMonth(1),
    hasData: mb.has,
  };

  if (!mb.has) {
    heroProps.noDataReason = `No ${SHORT[scope].toLowerCase()} records cover this month.`;
  } else {
    const list = expenses(tx, scope, mb.start, mb.cov);
    const total = sum(list);
    const cats = byCat(list);
    heroProps = {
      ...heroProps,
      total,
      count: list.length,
      rangeLabel: `${fd(mb.start)}–${fd(mb.cov)}`,
      complete: mb.complete,
      cats,
    };
    if (isCur) {
      const d = mb.cov.getDate();
      const pE = new Date(y, m - 1, d);
      if (+coverageEnd(stmts, scope) >= +pE) {
        const prev = sum(expenses(tx, scope, new Date(y, m - 1, 1), pE));
        const diff = total - prev;
        heroProps.deltaText = `${fmt(Math.abs(diff))} ${diff >= 0 ? 'more' : 'less'} than 1–${d} ${MON[m - 1]}`;
        heroProps.deltaUp = diff >= 0;
      }
    }
  }

  const recur = detectRecurring(tx);
  const adv = adviceList(tx, stmts, scope, budgets, goals, dismissed);
  const budgetCats = Object.keys(budgets) as CatId[];
  const curMb = monthBounds(stmts, scope, 2026, 9);
  const f = forecast(tx, stmts, scope, budgets, fcCat);
  const loansActive = activeLoans(tx, stmts, loans);
  const committedTotal = loansActive.reduce((a, x) => a + x.L.emi, 0) + recur.reduce((a, r) => a + r.amount, 0);
  const schedule = scheduleItems(tx, stmts, loans, recur).filter((x) => x.day >= TODAY.getDate()).slice(0, 3);
  const recent = tx
    .filter((t) => t.type === 'expense' && t.source === scope)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, 5);

  return (
    <Screen title="Money" subtitle="Good evening, Thursday 8 Oct" screen="home">
      <Hero {...heroProps} />

      {!mb.has && scope !== 'manual' && (
        <EmptyState scope={scope} coverageEndDate={coverageEnd(stmts, scope)} hasStmts={stmts.some((s) => s.source === scope)} />
      )}

      <QuickAddCard />

      <HomeAskCard router={router} />

      {adv.length > 0 && (
        <>
          <SectionTitle label="For you" action={`See all ${adv.length}`} onAction={() => router.push('/advice')} />
          <AdviceCard item={adv[0]} preview />
        </>
      )}

      {budgetCats.length > 0 && curMb.has && (
        <>
          <SectionTitle label="October budgets" action="Manage" onAction={() => router.push('/plan')} />
          <Card>
            {budgetCats.map((cat, i) => (
              <BudgetRow key={cat} cat={cat} status={budgetStatus(tx, stmts, scope, budgets, cat)} divider={i > 0} />
            ))}
          </Card>
        </>
      )}

      <SectionTitle label="Recurring & EMIs" action="See all" onAction={() => router.push('/activity')} />
      <Card onPress={() => router.push('/activity')}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <View>
            <AppText type="caption" muted>
              Committed every month
            </AppText>
            <AppText type="numLg" num style={{ fontSize: 28 }}>
              {fmt(committedTotal)}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <StatusChip tone="warn" label={`${loansActive.length} EMIs`} />
            <AppText type="caption" muted style={{ marginTop: 4 }}>
              {recur.length} recurring
            </AppText>
          </View>
        </View>
        <AppText type="caption" muted style={{ marginTop: 6 }}>
          Coming up
        </AppText>
        {schedule.map((x, i) => (
          <ScheduleRow key={i} item={x} divider={i > 0} />
        ))}
      </Card>

      <SectionTitle label="Month-end estimate" action="Details" onAction={() => router.push('/forecast')} />
      {f.ok ? (
        <Card onPress={() => router.push('/forecast')}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <AppText type="h3">
              {CAT[fcCat].emoji} {CAT[fcCat].label}
            </AppText>
            <StatusChip tone={f.budget && f.projected > f.budget ? 'warn' : 'ok'} label={f.budget && f.projected > f.budget ? 'May exceed' : 'Within budget'} />
          </View>
          <AppText type="caption" muted>
            About <AppText type="captionMed" num>{fmt(f.projected)}</AppText> by 31 Oct if the current pace continues
            {f.budget ? ` (budget ${fmt(f.budget)})` : ''}. Estimate only.
          </AppText>
          <SparkLine f={f} mini />
        </Card>
      ) : (
        <Card>
          <AppText type="h3">Not enough data yet</AppText>
          <AppText type="caption" muted>
            {f.reason}
          </AppText>
        </Card>
      )}

      <SectionTitle label="Recent" action="All activity" onAction={() => router.push('/activity')} />
      <Card>
        {recent.length ? (
          recent.map((t, i) => <TxRow key={t.id} t={t} recurring={isRec(recur, t)} divider={i > 0} />)
        ) : (
          <AppText type="label" muted>
            Nothing yet.
          </AppText>
        )}
      </Card>

      <AppText type="caption" faint style={{ textAlign: 'center', marginTop: 18 }}>
        Calculated on this phone. Wording by the Pi, on your local network.
      </AppText>
    </Screen>
  );
}

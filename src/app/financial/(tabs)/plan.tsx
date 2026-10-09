// Ported from `planHTML()` in finprofile.html.
import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Segmented } from '@/components/Segmented';
import { Button } from '@/components/Button';
import { Toggle } from '@/components/Toggle';
import { StatusChip } from '@/components/StatusChip';
import { Ring } from '@/components/Ring';
import { EmptyState } from '@/components/EmptyState';
import { BudgetRow } from '@/components/BudgetRow';
import { useSheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { BudgetSheetContent } from '@/components/sheets/BudgetSheet';
import { ContributionSheetContent } from '@/components/sheets/ContributionSheet';
import { GoalHistorySheetContent } from '@/components/sheets/GoalHistorySheet';
import { NewGoalSheetContent } from '@/components/sheets/NewGoalSheet';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { budgetStatus, coverageEnd, curMonth, goalStatus, suggestFor } from '@/lib/calc';
import { fd, fmt } from '@/lib/format';
import { CATS, CatId } from '@/theme/tokens';

export default function PlanScreen() {
  const sheet = useSheet();
  const toast = useToast();
  const { tx, stmts, goals, budgets, scope, planTab, perDay } = useStore(useShallow((s) => ({
    tx: s.tx,
    stmts: s.stmts,
    goals: s.goals,
    budgets: s.budgets,
    scope: s.scope,
    planTab: s.planTab,
    perDay: s.perDay,
  })));
  const setPlanTab = useStore((s) => s.setPlanTab);
  const togglePerDay = useStore((s) => s.togglePerDay);
  const setBudget = useStore((s) => s.setBudget);
  const removeBudget = useStore((s) => s.removeBudget);

  const mb = curMonth(stmts, scope);
  const budgetCats = Object.keys(budgets) as CatId[];
  const suggestions = CATS.filter((c) => !budgets[c.id])
    .map((c) => ({ c, s: suggestFor(tx, stmts, scope, c.id) }))
    .filter((x) => x.s && x.s.avg >= 300)
    .slice(0, 3);

  return (
    <Screen title="Budgets & goals" screen="plan">
      <Segmented
        options={[
          { key: 'budgets', label: 'Budgets' },
          { key: 'goals', label: 'Goals' },
        ]}
        value={planTab}
        onChange={setPlanTab}
      />

      {planTab === 'budgets' ? (
        <>
          {!mb.has && <EmptyState scope={scope} coverageEndDate={coverageEnd(stmts, scope)} hasStmts={stmts.some((s) => s.source === scope)} />}

          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <AppText type="h3">October limits</AppText>
                <AppText type="caption" muted>
                  Spent from {scope === 'manual' ? 'Quick Add' : scope === 'bank' ? 'Bank statement' : 'Credit card statement'}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppText type="captionSm" muted>
                  Per day
                </AppText>
                <Toggle on={perDay} onPress={togglePerDay} />
              </View>
            </View>
            {budgetCats.map((cat, i) => (
              <BudgetRow
                key={cat}
                cat={cat}
                status={budgetStatus(tx, stmts, scope, budgets, cat)}
                showFoot
                perDay={perDay}
                onEdit={() => sheet.open(<BudgetSheetContent cat={cat} />, ['55%', '90%'])}
              />
            ))}
          </Card>

          <AppText type="sectionTitle" style={{ marginTop: 18, marginHorizontal: 4, marginBottom: 10 }}>
            Suggested starting limits
          </AppText>
          {!suggestions.length ? (
            <Card>
              <AppText type="label" muted>
                Not enough complete months from this source to suggest a limit. Suggestions need at least two full
                months of records.
              </AppText>
            </Card>
          ) : (
            suggestions.map(({ c, s }) => (
              <Card key={c.id}>
                <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                  <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: c.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <AppText style={{ fontSize: 20 }}>{c.emoji}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText type="h3">{c.label}</AppText>
                    <AppText type="label" muted>
                      You spent around <AppText type="labelMed">{fmt(s!.avg)}</AppText> a month over {s!.months.join(', ')} (
                      {s!.totals.map(fmt).join(', ')}).
                    </AppText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Button
                    label={`Use ${fmt(s!.avg)}`}
                    sm
                    variant="primary"
                    onPress={() => {
                      setBudget(c.id, s!.avg);
                      toast.show(`${c.label} budget set to ${fmt(s!.avg)}`, { label: 'Undo', onPress: () => removeBudget(c.id) });
                    }}
                  />
                  <Button label="Choose my own" sm variant="soft" onPress={() => sheet.open(<BudgetSheetContent cat={c.id} preset={s!.avg} />, ['55%', '90%'])} />
                </View>
              </Card>
            ))
          )}
          <AppText type="caption" muted style={{ marginHorizontal: 4 }}>
            Suggestions come from your recorded spending only. Nothing changes unless you choose it.
          </AppText>
        </>
      ) : (
        <>
          {goals.map((g) => {
            const s = goalStatus(g);
            return (
              <Card key={g.id}>
                <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                  <Ring pct={s.pct} emoji={g.emoji} on={s.on} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <AppText type="h3">{g.name}</AppText>
                      <StatusChip tone={s.on ? 'ok' : 'warn'} label={s.on ? 'On track' : 'Behind'} />
                    </View>
                    <AppText type="label" muted num>
                      <AppText type="labelMed">{fmt(s.saved)}</AppText> of {fmt(g.target)} by {fd(g.due)} {g.due.split('-')[0]}
                    </AppText>
                    <AppText type="label" muted num>
                      {s.saved >= g.target ? 'Goal reached 🎉' : `About ${fmt(s.need)}/month for ${s.monthsLeft} more month${s.monthsLeft > 1 ? 's' : ''}`}
                    </AppText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Button
                    label="Add contribution"
                    sm
                    variant="primary"
                    onPress={() => sheet.open(<ContributionSheetContent goalId={g.id} goalName={g.name} emoji={g.emoji} />, ['50%'])}
                  />
                  <Button label="History" sm variant="soft" onPress={() => sheet.open(<GoalHistorySheetContent goal={g} />, ['60%', '90%'])} />
                </View>
              </Card>
            );
          })}
          <Button label="New goal" variant="soft" block onPress={() => sheet.open(<NewGoalSheetContent />, ['60%'])} />
          <AppText type="caption" muted style={{ marginTop: 10, marginHorizontal: 4 }}>
            Progress counts only contributions you record. The app doesn't guess your savings.
          </AppText>
        </>
      )}
    </Screen>
  );
}

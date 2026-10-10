// Pi-backed Plan: budgets via /budgets/status + PUT/DELETE; goals via /goals + contributions.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Segmented } from '@/components/Segmented';
import { Button } from '@/components/Button';
import { StatusChip } from '@/components/StatusChip';
import { useTheme } from '@/theme/ThemeProvider';
import {
  financialApi,
  fmtPaise,
  todayISO,
  rupeesToPaise,
  type BudgetStatus,
  type Goal,
  type PiCategoryId,
} from '@/lib/financialApi';
import { PI_CATEGORY_LIST, piCatColor, piCatEmoji, piCatLabel } from '@/lib/catMap';

type Tab = 'budgets' | 'goals';

export default function PlanScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('budgets');

  return (
    <Screen title="Budgets & goals" screen="plan" showScopeBar={false}>
      <Segmented
        options={[
          { key: 'budgets', label: 'Budgets' },
          { key: 'goals', label: 'Goals' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />
      {tab === 'budgets' ? <BudgetsTab /> : <GoalsTab />}
    </Screen>
  );
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

function BudgetsTab() {
  const { colors } = useTheme();
  const [items, setItems] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PiCategoryId | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addingCat, setAddingCat] = useState<PiCategoryId | null>(null);
  const [addValue, setAddValue] = useState('');
  const [showAddPicker, setShowAddPicker] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const b = await financialApi.budgetsStatus();
      setItems(b);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const budgeted = new Set(items.map((i) => i.category_id));
  const notBudgeted = PI_CATEGORY_LIST.filter((c) => !budgeted.has(c));

  const saveBudget = async (cat: PiCategoryId, value: string) => {
    const r = parseInt(value, 10);
    if (!r || r <= 0) return;
    try {
      await financialApi.putBudget(cat, rupeesToPaise(r));
      setEditing(null);
      setAddingCat(null);
      setAddValue('');
      setEditValue('');
      await load();
    } catch { /* ignore */ }
  };

  const deleteBudget = async (cat: PiCategoryId) => {
    try {
      await financialApi.deleteBudget(cat);
      await load();
    } catch { /* ignore */ }
  };

  if (loading) {
    return <View style={{ paddingVertical: 32, alignItems: 'center' }}><ActivityIndicator color={colors.indigo} /></View>;
  }
  if (error) {
    return (
      <Card style={{ backgroundColor: colors.marigoldSoft }}>
        <AppText type="labelMed" color={colors.marigold}>Pi not reachable</AppText>
        <AppText type="caption" muted style={{ marginTop: 4 }}>{error}</AppText>
      </Card>
    );
  }

  return (
    <>
      {items.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <AppText style={{ fontSize: 36 }}>🎯</AppText>
          <AppText type="h3" style={{ marginTop: 6 }}>No budgets yet</AppText>
          <AppText type="label" muted style={{ textAlign: 'center', marginTop: 4 }}>Add one below.</AppText>
        </Card>
      ) : (
        <Card>
          {items.map((b, i) => {
            const pct = parseFloat(b.usage_percent);
            const over = pct > 100;
            const isEdit = editing === b.category_id;
            return (
              <View key={b.category_id} style={{ paddingVertical: 10, borderTopWidth: i > 0 ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.ico, { backgroundColor: piCatColor(b.category_id) + '22' }]}>
                    <AppText style={{ fontSize: 20 }}>{piCatEmoji(b.category_id)}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText type="bodyMed">{piCatLabel(b.category_id)}</AppText>
                    <AppText type="captionSm" muted>
                      {fmtPaise(b.spent_paise)} of {fmtPaise(b.budget_paise)} · {b.usage_percent}%
                    </AppText>
                  </View>
                  {!isEdit && (
                    <Pressable onPress={() => { setEditing(b.category_id); setEditValue(String(Math.round(b.budget_paise / 100))); }}>
                      <AppText type="captionMed" color={colors.indigo}>Edit</AppText>
                    </Pressable>
                  )}
                </View>
                <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.line, marginTop: 8, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: over ? colors.marigold : piCatColor(b.category_id) }} />
                </View>
                {!isEdit && (
                  <AppText type="captionSm" muted style={{ marginTop: 4 }}>
                    {fmtPaise(b.left_paise)} left · {fmtPaise(b.per_day_paise)}/day
                  </AppText>
                )}
                {isEdit && (
                  <View style={styles.editRow}>
                    <TextInput
                      value={editValue}
                      onChangeText={setEditValue}
                      keyboardType="numeric"
                      placeholder="Rupees"
                      placeholderTextColor={colors.ink3}
                      style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2 }]}
                    />
                    <Pressable onPress={() => saveBudget(b.category_id, editValue)} style={[styles.smallBtn, { backgroundColor: colors.indigo }]}>
                      <AppText type="captionMed" style={{ color: '#fff' }}>Save</AppText>
                    </Pressable>
                    <Pressable onPress={() => deleteBudget(b.category_id)} style={[styles.smallBtn, { backgroundColor: colors.coralSoft }]}>
                      <AppText type="captionMed" color={colors.coral}>Delete</AppText>
                    </Pressable>
                    <Pressable onPress={() => setEditing(null)} style={[styles.smallBtn, { backgroundColor: colors.surface2 }]}>
                      <AppText type="captionMed" muted>Cancel</AppText>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      )}

      {/* Add new budget */}
      <Card>
        <AppText type="h3">Add a budget</AppText>
        {!showAddPicker ? (
          <Pressable onPress={() => setShowAddPicker(true)} style={{ marginTop: 10 }}>
            <AppText type="captionMed" color={colors.indigo}>Choose a category →</AppText>
          </Pressable>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 10 }}>
              {notBudgeted.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setAddingCat(c)}
                  style={[styles.catChip, { backgroundColor: addingCat === c ? piCatColor(c) : colors.surface2, borderColor: piCatColor(c) }]}
                >
                  <AppText type="captionMed" style={{ fontSize: 12, color: addingCat === c ? '#fff' : colors.ink }}>
                    {piCatEmoji(c)} {piCatLabel(c)}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
            {addingCat && (
              <View style={styles.editRow}>
                <TextInput
                  value={addValue}
                  onChangeText={setAddValue}
                  keyboardType="numeric"
                  placeholder="Monthly limit (₹)"
                  placeholderTextColor={colors.ink3}
                  style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2 }]}
                />
                <Pressable onPress={() => saveBudget(addingCat, addValue)} style={[styles.smallBtn, { backgroundColor: colors.indigo }]}>
                  <AppText type="captionMed" style={{ color: '#fff' }}>Add</AppText>
                </Pressable>
              </View>
            )}
          </>
        )}
      </Card>
    </>
  );
}

// ─── Goals ────────────────────────────────────────────────────────────────────

function GoalsTab() {
  const { colors } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addAmt, setAddAmt] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDue, setNewDue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const g = await financialApi.goals();
      setGoals(g.filter((x) => !x.archived));
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const addContribution = async (goalId: string, amt: string) => {
    const r = parseInt(amt, 10);
    if (!r || r <= 0) return;
    try {
      await financialApi.addContribution(goalId, {
        amount_paise: rupeesToPaise(r),
        contributed_date: todayISO(),
      });
      setAddingTo(null);
      setAddAmt('');
      await load();
    } catch { /* ignore */ }
  };

  const createGoal = async () => {
    const t = parseInt(newTarget, 10);
    if (!newName.trim() || !t || t <= 0 || !newDue.match(/^\d{4}-\d{2}-\d{2}$/)) return;
    try {
      await financialApi.createGoal({
        name: newName.trim(),
        target_paise: rupeesToPaise(t),
        start_date: todayISO(),
        due_date: newDue,
      });
      setNewName('');
      setNewTarget('');
      setNewDue('');
      setShowNew(false);
      await load();
    } catch { /* ignore */ }
  };

  const archiveGoal = async (g: Goal) => {
    try {
      await financialApi.patchGoal(g.id, { expected_revision: g.revision, archived: true });
      await load();
    } catch { /* ignore */ }
  };

  if (loading) {
    return <View style={{ paddingVertical: 32, alignItems: 'center' }}><ActivityIndicator color={colors.indigo} /></View>;
  }
  if (error) {
    return (
      <Card style={{ backgroundColor: colors.marigoldSoft }}>
        <AppText type="labelMed" color={colors.marigold}>Pi not reachable</AppText>
        <AppText type="caption" muted style={{ marginTop: 4 }}>{error}</AppText>
      </Card>
    );
  }

  return (
    <>
      {goals.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <AppText style={{ fontSize: 36 }}>⭐</AppText>
          <AppText type="h3" style={{ marginTop: 6 }}>No goals yet</AppText>
          <AppText type="label" muted style={{ textAlign: 'center', marginTop: 4 }}>Add one below to start tracking.</AppText>
        </Card>
      ) : goals.map((g) => {
        const pct = parseFloat(g.progress_percent);
        return (
          <Card key={g.id}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={[styles.ring, { borderColor: g.on_track ? colors.sage : colors.marigold }]}>
                <AppText style={{ fontSize: 24 }}>{g.emoji}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <AppText type="h3">{g.name}</AppText>
                  <StatusChip tone={g.on_track ? 'ok' : 'warn'} label={g.on_track ? 'On track' : 'Behind'} />
                </View>
                <AppText type="label" muted num>
                  <AppText type="labelMed">{fmtPaise(g.saved_paise)}</AppText> of {fmtPaise(g.target_paise)} · {g.progress_percent}%
                </AppText>
                <AppText type="caption" muted num>
                  Due {g.due_date} · {g.saved_paise >= g.target_paise
                    ? 'Reached 🎉'
                    : `~${fmtPaise(g.need_per_month_paise)}/mo to hit target`}
                </AppText>
                <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.line, marginTop: 8, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: g.on_track ? colors.sage : colors.marigold }} />
                </View>
              </View>
            </View>
            {addingTo === g.id ? (
              <View style={[styles.editRow, { marginTop: 12 }]}>
                <TextInput
                  value={addAmt}
                  onChangeText={setAddAmt}
                  keyboardType="numeric"
                  placeholder="Amount (₹)"
                  placeholderTextColor={colors.ink3}
                  style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2 }]}
                />
                <Pressable onPress={() => addContribution(g.id, addAmt)} style={[styles.smallBtn, { backgroundColor: colors.indigo }]}>
                  <AppText type="captionMed" style={{ color: '#fff' }}>Save</AppText>
                </Pressable>
                <Pressable onPress={() => { setAddingTo(null); setAddAmt(''); }} style={[styles.smallBtn, { backgroundColor: colors.surface2 }]}>
                  <AppText type="captionMed" muted>Cancel</AppText>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button label="Add contribution" sm variant="primary" onPress={() => setAddingTo(g.id)} />
                <Button label="Archive" sm variant="soft" onPress={() => archiveGoal(g)} />
              </View>
            )}
          </Card>
        );
      })}

      {/* New goal */}
      {!showNew ? (
        <Button label="+ New goal" variant="soft" block onPress={() => setShowNew(true)} />
      ) : (
        <Card>
          <AppText type="h3">New goal</AppText>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Name (e.g. Emergency fund)"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2, marginTop: 10 }]}
          />
          <TextInput
            value={newTarget}
            onChangeText={setNewTarget}
            keyboardType="numeric"
            placeholder="Target (₹)"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2, marginTop: 8 }]}
          />
          <TextInput
            value={newDue}
            onChangeText={setNewDue}
            placeholder="Due date YYYY-MM-DD"
            placeholderTextColor={colors.ink3}
            style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2, marginTop: 8 }]}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Button label="Create" sm variant="primary" onPress={createGoal} />
            <Button label="Cancel" sm variant="soft" onPress={() => setShowNew(false)} />
          </View>
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  ico: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1 },
  editRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  smallBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  ring: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});

// Pi-backed EMI/loan tracker: GET /loans, POST /loans, GET /recurring.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Segmented } from '@/components/Segmented';
import { StatusChip } from '@/components/StatusChip';
import { useTheme } from '@/theme/ThemeProvider';
import {
  financialApi,
  fmtPaise,
  rupeesToPaise,
  todayISO,
  type Loan,
  type LoanKind,
  type LoanSource,
  type Recurring,
} from '@/lib/financialApi';
import { piCatColor, piCatEmoji, piCatLabel } from '@/lib/catMap';

const KIND_LABEL: Record<LoanKind, string> = {
  no_cost_emi: 'No-cost EMI',
  loan_emi:    'Loan EMI',
  card_emi:    'Card EMI',
};

type Tab = 'loans' | 'recurring';

export default function LoansScreen() {
  const [tab, setTab] = useState<Tab>('loans');

  return (
    <Screen title="Recurring & EMIs" screen="activity" showBack showScopeBar={false}>
      <Segmented
        options={[
          { key: 'loans', label: 'EMIs' },
          { key: 'recurring', label: 'Recurring' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />
      {tab === 'loans' ? <LoansTab /> : <RecurringTab />}
    </Screen>
  );
}

function LoansTab() {
  const { colors } = useTheme();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // new loan form
  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [emi, setEmi] = useState('');
  const [months, setMonths] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [kind, setKind] = useState<LoanKind>('loan_emi');
  const [source, setSource] = useState<LoanSource>('bank');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const l = await financialApi.loans();
      setLoans(l);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const emiR = parseInt(emi, 10);
    const monthsN = parseInt(months, 10);
    const dueN = parseInt(dueDay, 10);
    if (!name.trim() || !lender.trim() || !emiR || !monthsN || !dueN) return;
    try {
      await financialApi.createLoan({
        name: name.trim(),
        lender: lender.trim(),
        kind,
        emi_paise: rupeesToPaise(emiR),
        start_date: todayISO(),
        months: monthsN,
        due_day: dueN,
        source,
      });
      setName(''); setLender(''); setEmi(''); setMonths(''); setDueDay('5');
      setShowNew(false);
      await load();
    } catch { /* ignore */ }
  };

  const remove = async (l: Loan) => {
    try {
      await financialApi.deleteLoan(l.id);
      await load();
    } catch { /* ignore */ }
  };

  const archive = async (l: Loan) => {
    try {
      await financialApi.patchLoan(l.id, { expected_revision: l.revision, archived: true });
      await load();
    } catch { /* ignore */ }
  };

  const active = loans.filter((l) => !l.archived && !l.done);
  const done = loans.filter((l) => l.done || l.archived);
  const totalEmi = active.reduce((a, l) => a + l.emi_paise, 0);
  const totalRemaining = active.reduce((a, l) => a + l.remaining_paise, 0);

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
      {/* Summary */}
      {active.length > 0 && (
        <Card style={{ backgroundColor: colors.marigoldSoft }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <AppText type="caption" muted>Monthly EMI</AppText>
              <AppText type="h3" num style={{ fontSize: 22 }}>{fmtPaise(totalEmi)}</AppText>
            </View>
            <View>
              <AppText type="caption" muted>Total remaining</AppText>
              <AppText type="h3" num style={{ fontSize: 22, color: colors.marigold }}>{fmtPaise(totalRemaining)}</AppText>
            </View>
          </View>
        </Card>
      )}

      {active.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <AppText style={{ fontSize: 36 }}>🏷️</AppText>
          <AppText type="h3" style={{ marginTop: 6 }}>No active EMIs</AppText>
          <AppText type="label" muted style={{ marginTop: 4 }}>Add one below.</AppText>
        </Card>
      ) : (
        active.map((l) => (
          <Card key={l.id}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={[styles.ico, { backgroundColor: colors.marigoldSoft }]}>
                <AppText style={{ fontSize: 24 }}>{l.emoji}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText type="h3">{l.name}</AppText>
                  <StatusChip tone="warn" label={`${l.paid_installments}/${l.months}`} />
                </View>
                <AppText type="captionSm" muted>{l.lender} · {KIND_LABEL[l.kind]} · {l.source}</AppText>
                <AppText type="caption" muted style={{ marginTop: 2 }}>
                  Due day {l.due_day} · ends {l.end_date}
                </AppText>
                <View style={{ height: 6, borderRadius: 99, backgroundColor: colors.line, marginTop: 8, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${(l.paid_installments / l.months) * 100}%`, backgroundColor: colors.marigold }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <AppText type="captionSm" num>EMI {fmtPaise(l.emi_paise)}</AppText>
                  <AppText type="captionSm" num muted>{fmtPaise(l.remaining_paise)} left</AppText>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Button label="Archive" sm variant="soft" onPress={() => archive(l)} />
              <Button label="Delete" sm variant="soft" onPress={() => remove(l)} />
            </View>
          </Card>
        ))
      )}

      {done.length > 0 && (
        <>
          <AppText type="captionMed" muted style={{ marginTop: 16, marginBottom: 8, marginHorizontal: 4, letterSpacing: 1 }}>
            COMPLETED / ARCHIVED
          </AppText>
          {done.map((l) => (
            <Card key={l.id} style={{ opacity: 0.6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <AppText style={{ fontSize: 22 }}>{l.emoji}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText type="bodyMed">{l.name}</AppText>
                  <AppText type="captionSm" muted>{l.lender} · {l.paid_installments}/{l.months} paid</AppText>
                </View>
                <Pressable onPress={() => remove(l)}>
                  <AppText type="captionMed" color={colors.coral}>Delete</AppText>
                </Pressable>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* New loan */}
      {!showNew ? (
        <Button label="+ Add an EMI" variant="soft" block onPress={() => setShowNew(true)} />
      ) : (
        <Card>
          <AppText type="h3">New EMI</AppText>
          <TextInput value={name} onChangeText={setName} placeholder="Name (e.g. iPhone 16)" placeholderTextColor={colors.ink3} style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2, marginTop: 10 }]} />
          <TextInput value={lender} onChangeText={setLender} placeholder="Lender (bank/NBFC)" placeholderTextColor={colors.ink3} style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2, marginTop: 8 }]} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput value={emi} onChangeText={setEmi} keyboardType="numeric" placeholder="EMI (₹)" placeholderTextColor={colors.ink3} style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2, flex: 1 }]} />
            <TextInput value={months} onChangeText={setMonths} keyboardType="numeric" placeholder="Months" placeholderTextColor={colors.ink3} style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2, flex: 1 }]} />
            <TextInput value={dueDay} onChangeText={setDueDay} keyboardType="numeric" placeholder="Day" placeholderTextColor={colors.ink3} style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2, width: 70 }]} />
          </View>

          <AppText type="caption" muted style={{ marginTop: 10, marginBottom: 4 }}>Kind</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {(['no_cost_emi', 'loan_emi', 'card_emi'] as LoanKind[]).map((k) => (
              <Pressable
                key={k}
                onPress={() => setKind(k)}
                style={[styles.chip, { backgroundColor: kind === k ? colors.indigo : colors.surface2, borderColor: colors.indigo }]}
              >
                <AppText type="captionMed" style={{ color: kind === k ? '#fff' : colors.ink }}>{KIND_LABEL[k]}</AppText>
              </Pressable>
            ))}
          </ScrollView>

          <AppText type="caption" muted style={{ marginTop: 10, marginBottom: 4 }}>Source</AppText>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['bank', 'card'] as LoanSource[]).map((s) => (
              <Pressable
                key={s}
                onPress={() => setSource(s)}
                style={[styles.chip, { backgroundColor: source === s ? colors.indigo : colors.surface2, borderColor: colors.indigo }]}
              >
                <AppText type="captionMed" style={{ color: source === s ? '#fff' : colors.ink }}>{s === 'bank' ? '🏦 Bank' : '💳 Card'}</AppText>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <Button label="Create" sm variant="primary" onPress={create} />
            <Button label="Cancel" sm variant="soft" onPress={() => setShowNew(false)} />
          </View>
        </Card>
      )}
    </>
  );
}

function RecurringTab() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await financialApi.recurring();
      setItems(r);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

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

  const total = items.reduce((a, r) => a + r.amount_paise, 0);

  if (items.length === 0) {
    return (
      <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
        <AppText style={{ fontSize: 36 }}>🔁</AppText>
        <AppText type="h3" style={{ marginTop: 6 }}>No recurring patterns</AppText>
        <AppText type="label" muted style={{ marginTop: 4, textAlign: 'center' }}>
          The Pi auto-detects these after ~3 months of data.
        </AppText>
      </Card>
    );
  }

  return (
    <>
      <Card style={{ backgroundColor: colors.indigoSoft }}>
        <AppText type="caption" muted>Monthly recurring total</AppText>
        <AppText type="h3" num style={{ fontSize: 22, color: colors.indigo }}>{fmtPaise(total)}</AppText>
        <AppText type="caption" muted style={{ marginTop: 2 }}>{items.length} patterns detected</AppText>
      </Card>
      <Card>
        {items.map((r, i) => (
          <View key={r.merchant_key} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 10, marginTop: 2 }]}>
            <View style={[styles.ico, { backgroundColor: piCatColor(r.category_id) + '22' }]}>
              <AppText style={{ fontSize: 20 }}>{piCatEmoji(r.category_id)}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText type="bodyMed">{r.merchant}</AppText>
              <AppText type="captionSm" muted>
                {piCatLabel(r.category_id)} · day {r.typical_day} · {r.months_present}/3 months
              </AppText>
            </View>
            <AppText type="bodyMed" num>{fmtPaise(r.amount_paise)}</AppText>
          </View>
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  ico: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1 },
});

// Ported from `recurringHTML()` in finprofile.html.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { CAT, icoBg } from '@/theme/tokens';
import { fmt, MON, ord } from '@/lib/format';
import { TODAY } from '@/data/seed';
import { SHORT } from '@/data/types';
import { activeLoans, loanInfo, scheduleItems, SUBCATS, detectRecurring, type RecurEntry } from '@/lib/recurring';
import { AppText } from './AppText';
import { Card } from './Card';
import { StackBar } from './Bars';
import { SegBar } from './SegBar';
import { StatusChip } from './StatusChip';
import { ScheduleRow } from './ScheduleRow';
import { SectionTitle } from './SectionTitle';
import { TxRow } from './TxRow';
import { useSheet } from './Sheet';
import { AddEmiSheetContent } from './sheets/AddEmiSheet';

export function RecurringTab() {
  const { colors } = useTheme();
  const sheet = useSheet();
  const { tx, stmts, loans } = useStore((s) => ({ tx: s.tx, stmts: s.stmts, loans: s.loans }));
  const recur = detectRecurring(tx);
  const loansActive = activeLoans(tx, stmts, loans);
  const subs = recur.filter((r) => SUBCATS.includes(r.cat));
  const bills = recur.filter((r) => !SUBCATS.includes(r.cat));
  const eT = loansActive.reduce((a, x) => a + x.L.emi, 0);
  const sT = subs.reduce((a, r) => a + r.amount, 0);
  const bT = bills.reduce((a, r) => a + r.amount, 0);
  const total = eT + sT + bT || 1;
  const schedule = scheduleItems(tx, stmts, loans, recur);

  const openLoanTx = (loanId: string) => {
    const L = loans.find((x) => x.id === loanId);
    if (!L) return;
    const info = loanInfo(tx, stmts, L);
    sheet.open(
      <View>
        <AppText type="titleLg" style={{ marginBottom: 4 }}>
          {L.emoji} {L.name}
        </AppText>
        <AppText type="label" muted style={{ marginBottom: 14 }}>
          {L.kind} with {L.lender}. {info.paid} of {L.months} installments paid, {fmt(info.remaining)} left. Payments found in your
          statements:
        </AppText>
        {info.list.map((t) => (
          <TxRow key={t.id} t={t} />
        ))}
      </View>,
      ['70%', '92%'],
    );
  };

  const openRecTx = (r: RecurEntry) => {
    sheet.open(
      <View>
        <AppText type="titleLg" style={{ marginBottom: 4 }}>
          {CAT[r.cat].emoji} {r.merchant}
        </AppText>
        <AppText type="label" muted style={{ marginBottom: 14 }}>
          Recurring every month around the {ord(r.day)}. From {SHORT[r.source]}.
        </AppText>
        {r.list.map((t) => (
          <TxRow key={t.id} t={t} />
        ))}
      </View>,
      ['70%', '92%'],
    );
  };

  return (
    <View>
      <View style={[styles.hero, { backgroundColor: '#1E6B5C' }]}>
        <AppText type="h3" color="#fff">
          Committed every month
        </AppText>
        <AppText type="displayXl" color="#fff" num style={{ fontSize: 40, marginVertical: 6 }}>
          {fmt(eT + sT + bT)}
        </AppText>
        <AppText type="caption" color="rgba(255,255,255,.85)">
          {loansActive.length} EMIs and {recur.length} recurring payments found in your records
        </AppText>
        <View style={{ marginTop: 12 }}>
          <StackBar
            segments={[
              { value: eT, color: '#FFD27A' },
              { value: bT, color: '#9FE3C9' },
              { value: sT, color: '#C3CAFF' },
            ]}
          />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          <Legend color="#FFD27A" label={`EMIs ${fmt(eT)}`} />
          <Legend color="#9FE3C9" label={`Rent & bills ${fmt(bT)}`} />
          <Legend color="#C3CAFF" label={`Subscriptions ${fmt(sT)}`} />
        </View>
      </View>

      <SectionTitle label="October schedule" action={`Today is ${TODAY.getDate()} Oct`} />
      <Card>
        {schedule.map((x, i) => (
          <ScheduleRow key={i} item={x} divider={i > 0} />
        ))}
      </Card>

      <SectionTitle label="EMIs" action="Add EMI" onAction={() => sheet.open(<AddEmiSheetContent />, ['80%', '96%'])} />
      {loans.map((L) => {
        const info = loanInfo(tx, stmts, L);
        return (
          <Card key={L.id}>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <View style={[styles.ico, { backgroundColor: colors.marigoldSoft }]}>
                <AppText style={{ fontSize: 20 }}>{L.emoji}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText type="h3">{L.name}</AppText>
                  <AppText type="bodyMed" num>
                    {fmt(L.emi)}
                    <AppText type="caption" faint> /mo</AppText>
                  </AppText>
                </View>
                <AppText type="captionSm" muted>
                  {L.kind}, {L.lender}, due on the {ord(L.dueDay)}
                </AppText>
              </View>
            </View>
            <SegBar months={L.months} paid={info.paid} current={!info.done && info.cur >= 1} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <AppText type="captionSm" muted>
                <AppText type="captionSmBold">{info.paid}</AppText> of {L.months} paid
              </AppText>
              <AppText type="captionSm" muted num>
                {info.done ? 'All paid' : `${fmt(info.remaining)} left, ends ${MON[info.end.getMonth()]} ${info.end.getFullYear()}`}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <StatusChip tone={info.st.s} label={`This month: ${info.st.l}`} />
              {info.seen ? (
                <Pressable onPress={() => openLoanTx(L.id)}>
                  <View style={[styles.smBtn, { backgroundColor: colors.indigoSoft }]}>
                    <AppText type="captionMed" color={colors.indigo}>
                      {info.seen} payment{info.seen > 1 ? 's' : ''} found
                    </AppText>
                  </View>
                </Pressable>
              ) : (
                <AppText type="captionSm" muted>
                  No payments in statements yet
                </AppText>
              )}
            </View>
          </Card>
        );
      })}

      <SectionTitle label="Recurring payments" action={`${fmt(sT + bT)} /month`} />
      <Card>
        {recur.map((r, i) => (
          <Pressable key={r.key} onPress={() => openRecTx(r)}>
            <View style={[styles.catrow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
              <View style={[styles.ico, { backgroundColor: icoBg(CAT[r.cat].color) }]}>
                <AppText style={{ fontSize: 20 }}>{CAT[r.cat].emoji}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText type="bodyMed">{r.merchant}</AppText>
                  <AppText type="bodyMed" num>
                    {fmt(r.amount)}
                  </AppText>
                </View>
                <AppText type="captionSm" muted>
                  Every month, around the {ord(r.day)}{' '}
                  <AppText type="tag" muted>
                    {SHORT[r.source]}
                  </AppText>
                </AppText>
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 5 }}>
                  {['Jul', 'Aug', 'Sep', 'Oct'].map((mn, j) => {
                    const has = r.list.some((t) => t.date.startsWith('2026-' + String(7 + j).padStart(2, '0')));
                    return (
                      <View
                        key={mn}
                        style={[styles.mdot, { backgroundColor: has ? colors.sageSoft : colors.surface2 }]}
                      >
                        <AppText type="tag" color={has ? colors.sage : colors.ink3}>
                          {has ? '✓ ' : ''}
                          {mn}
                        </AppText>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </Card>

      <AppText type="caption" muted style={{ marginHorizontal: 4, marginTop: 4 }}>
        A payment counts as recurring when the same merchant charges a similar amount (within 15%) once a month in at
        least 2 of the last 3 months. EMI installment numbers come from the details you added; payments are confirmed
        from imported statements. EMIs are shown here and kept out of category spending.
      </AppText>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: color }} />
      <AppText type="caption" color="rgba(255,255,255,.95)">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 28, padding: 18, marginBottom: 12 },
  ico: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  smBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 11 },
  catrow: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  mdot: { paddingVertical: 1, paddingHorizontal: 6, borderRadius: 5 },
});

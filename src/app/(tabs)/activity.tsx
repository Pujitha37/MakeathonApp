// Ported from `activityHTML()` in finprofile.html.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Segmented } from '@/components/Segmented';
import { Button } from '@/components/Button';
import { StatusChip } from '@/components/StatusChip';
import { GroupedTxList } from '@/components/GroupedTxList';
import { TxRow } from '@/components/TxRow';
import { RecurringTab } from '@/components/RecurringTab';
import { useSheet } from '@/components/Sheet';
import { ImportSheetContent } from '@/components/sheets/ImportSheet';
import { useStore } from '@/store/useStore';
import { sum } from '@/lib/calc';
import { detectRecurring, isRec } from '@/lib/recurring';
import { fd, fmt } from '@/lib/format';
import { SOURCES } from '@/data/types';
import type { Source, Tx } from '@/data/types';
import { useTheme } from '@/theme/ThemeProvider';

export default function ActivityScreen() {
  const { tx, stmts, actTab, stmtSrc } = useStore((s) => ({ tx: s.tx, stmts: s.stmts, actTab: s.actTab, stmtSrc: s.stmtSrc }));
  const setActTab = useStore((s) => s.setActTab);
  const setStmtSrc = useStore((s) => s.setStmtSrc);
  const openStmt = useStore((s) => s.openStmt);
  const setOpenStmt = useStore((s) => s.setOpenStmt);
  const sheet = useSheet();
  const recur = detectRecurring(tx);

  return (
    <Screen title="Activity" screen="activity" showScopeBar={false}>
      <Segmented
        options={[
          { key: 'manual', label: 'Expenses' },
          { key: 'statements', label: 'Statements' },
          { key: 'recurring', label: 'Recurring' },
        ]}
        value={actTab}
        onChange={setActTab}
      />

      {actTab === 'recurring' && <RecurringTab />}

      {actTab === 'manual' && (
        <>
          <Card flat style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <AppText style={{ fontSize: 26 }}>✍️</AppText>
            <AppText type="label" muted style={{ flex: 1 }}>
              Everything you've added by voice or typing. This is your everyday record.
            </AppText>
          </Card>
          <Card style={{ paddingTop: 4 }}>
            {(() => {
              const list = tx
                .filter((t) => t.source === 'manual' && t.type === 'expense')
                .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
                .slice(0, 40);
              return list.length ? (
                <GroupedTxList list={list} recurFn={(t) => isRec(recur, t)} />
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <AppText style={{ fontSize: 40 }}>✍️</AppText>
                  <AppText type="h3" style={{ marginTop: 8 }}>
                    No expenses yet
                  </AppText>
                  <AppText type="label" muted>
                    Add one from Home or the + button.
                  </AppText>
                </View>
              );
            })()}
          </Card>
        </>
      )}

      {actTab === 'statements' && (
        <>
          <Card flat style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <AppText style={{ fontSize: 26 }}>🗂️</AppText>
            <AppText type="label" muted style={{ flex: 1 }}>
              Statements are imported occasionally — add a new one when it arrives. Your day-to-day expenses live under{' '}
              <AppText type="labelMed">Expenses</AppText>.
            </AppText>
          </Card>
          <Segmented
            options={[
              { key: 'bank', label: '🏦 Bank' },
              { key: 'card', label: '💳 Credit card' },
            ]}
            value={stmtSrc}
            onChange={setStmtSrc}
          />
          <Button
            label={`Import ${stmtSrc === 'bank' ? 'bank' : 'card'} statement`}
            variant="soft"
            block
            style={{ marginBottom: 12 }}
            onPress={() => sheet.open(<ImportSheetContent />, ['65%', '92%'])}
          />
          {stmts
            .filter((s) => s.source === stmtSrc)
            .sort((a, b) => b.to.localeCompare(a.to))
            .map((s) => (
              <StatementCard
                key={s.id}
                stmtId={s.id}
                source={s.source}
                name={s.name}
                from={s.from}
                to={s.to}
                imported={s.imported}
                tx={tx.filter((t) => t.stmt === s.id)}
                open={openStmt === s.id}
                onToggle={() => setOpenStmt(s.id)}
              />
            ))}
        </>
      )}
    </Screen>
  );
}

function StatementCard({
  stmtId,
  source,
  name,
  from,
  to,
  imported,
  tx,
  open,
  onToggle,
}: {
  stmtId: string;
  source: Source;
  name: string;
  from: string;
  to: string;
  imported: string;
  tx: Tx[];
  open: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const sorted = tx.slice().sort((a, b) => b.date.localeCompare(a.date));
  const exp = sorted.filter((t) => t.type === 'expense');
  const emis = sorted.filter((t) => t.type === 'emi');
  const other = sorted.filter((t) => t.type === 'income' || t.type === 'transfer');
  const year = to.split('-')[0];

  return (
    <Card>
      <Pressable onPress={onToggle} style={styles.stmt}>
        <View style={[styles.ico, { backgroundColor: colors.indigoSoft }]}>
          <AppText style={{ fontSize: 20 }}>{SOURCES[source].ico}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText type="h3">
            {fd(from)} – {fd(to)} {year}
          </AppText>
          <AppText type="captionSm" muted>
            {name}, {tx.length} rows, imported {fd(imported)}
          </AppText>
        </View>
        <StatusChip tone="ok" label="Imported" />
      </Pressable>
      {open && (
        <View style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
            <StatusChip tone="info" label={`Spending ${fmt(sum(exp))}`} />
            {emis.length > 0 && <StatusChip tone="warn" label={`${emis.length} EMI payment${emis.length > 1 ? 's' : ''} ${fmt(sum(emis))}`} />}
            {other.length > 0 && <StatusChip tone="warn" label={`${other.length} income or transfer rows not counted as spending`} />}
          </View>
          {sorted.map((t) =>
            t.type !== 'income' && t.type !== 'transfer' ? (
              <TxRow key={t.id} t={t} />
            ) : (
              <View key={t.id} style={styles.otherRow}>
                <View style={[styles.ico, { backgroundColor: colors.surface2 }]}>
                  <AppText style={{ fontSize: 20 }}>{t.type === 'income' ? '💰' : '🔄'}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText type="bodyMed">{t.merchant}</AppText>
                  <AppText type="captionSm" muted>
                    {t.type === 'income' ? 'Income' : 'Transfer between your accounts'}
                  </AppText>
                </View>
                <AppText type="bodyMed" faint num>
                  {t.type === 'income' ? '+' : ''}
                  {fmt(t.amount)}
                </AppText>
              </View>
            ),
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  stmt: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  ico: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  otherRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10 },
});

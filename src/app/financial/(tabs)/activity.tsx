// Pi-backed Activity: /transactions (paginated) + /recurring + review filter.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Segmented } from '@/components/Segmented';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme/ThemeProvider';
import {
  financialApi,
  fmtPaise,
  type Recurring,
  type Transaction,
  type TxType,
} from '@/lib/financialApi';
import { piCatColor, piCatEmoji, piCatLabel } from '@/lib/catMap';

type Tab = 'all' | 'review' | 'recurring';

const TYPE_LABELS: Record<TxType, string> = {
  expense:  'Expense',
  refund:   'Refund',
  income:   'Income',
  transfer: 'Transfer',
};

export default function ActivityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('all');
  const [items, setItems] = useState<Transaction[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'recurring') {
        const r = await financialApi.recurring();
        setRecurring(r);
      } else {
        const page = await financialApi.transactions({
          needs_review: tab === 'review' ? true : undefined,
          limit: 50,
        });
        setItems(page.items);
        setCursor(page.next_cursor);
      }
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await financialApi.transactions({
        needs_review: tab === 'review' ? true : undefined,
        limit: 50,
        cursor,
      });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.next_cursor);
    } catch { /* ignore */ }
    setLoadingMore(false);
  };

  const deleteTx = async (t: Transaction) => {
    try {
      await financialApi.deleteTransaction(t.id, t.revision);
      setItems((prev) => prev.filter((x) => x.id !== t.id));
    } catch { /* ignore */ }
  };

  return (
    <Screen title="Activity" screen="activity" showScopeBar={false}>
      <Segmented
        options={[
          { key: 'all', label: 'All' },
          { key: 'review', label: 'Needs review' },
          { key: 'recurring', label: 'Recurring' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />

      {/* Import entry */}
      {tab !== 'recurring' && (
        <Button
          label="Import a statement"
          variant="soft"
          block
          style={{ marginBottom: 12 }}
          onPress={() => router.push('/financial/import')}
        />
      )}

      {loading && (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <ActivityIndicator color={colors.indigo} />
        </View>
      )}

      {!loading && error && (
        <Card style={{ backgroundColor: colors.marigoldSoft }}>
          <AppText type="labelMed" color={colors.marigold}>Pi not reachable</AppText>
          <AppText type="caption" muted style={{ marginTop: 4 }}>{error}</AppText>
        </Card>
      )}

      {!loading && !error && tab === 'recurring' && (
        <>
          {recurring.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
              <AppText style={{ fontSize: 36 }}>🔁</AppText>
              <AppText type="h3" style={{ marginTop: 6 }}>No recurring patterns yet</AppText>
              <AppText type="label" muted style={{ marginTop: 4, textAlign: 'center' }}>
                Pi detects these after you have ~3 months of data.
              </AppText>
            </Card>
          ) : (
            <Card>
              {recurring.map((r, i) => (
                <View key={r.merchant_key} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 10, marginTop: 2 }]}>
                  <View style={[styles.ico, { backgroundColor: piCatColor(r.category_id) + '22' }]}>
                    <AppText style={{ fontSize: 20 }}>{piCatEmoji(r.category_id)}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText type="bodyMed">{r.merchant}</AppText>
                    <AppText type="captionSm" muted>
                      {piCatLabel(r.category_id)} · ~day {r.typical_day} · {r.months_present}/3 months
                    </AppText>
                  </View>
                  <AppText type="bodyMed" num>{fmtPaise(r.amount_paise)}</AppText>
                </View>
              ))}
            </Card>
          )}
        </>
      )}

      {!loading && !error && tab !== 'recurring' && (
        <>
          {items.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
              <AppText style={{ fontSize: 36 }}>{tab === 'review' ? '✅' : '✍️'}</AppText>
              <AppText type="h3" style={{ marginTop: 6 }}>
                {tab === 'review' ? 'All caught up' : 'No transactions yet'}
              </AppText>
              <AppText type="label" muted style={{ marginTop: 4, textAlign: 'center' }}>
                {tab === 'review'
                  ? 'Nothing needs your review right now.'
                  : 'Use Quick Add or import a statement.'}
              </AppText>
            </Card>
          ) : (
            <Card>
              {items.map((t, i) => (
                <TxItem key={t.id} t={t} divider={i > 0} onDelete={() => deleteTx(t)} />
              ))}
            </Card>
          )}

          {cursor && (
            <Button
              label={loadingMore ? 'Loading…' : 'Load more'}
              variant="soft"
              block
              onPress={loadMore}
              disabled={loadingMore}
            />
          )}
        </>
      )}
    </Screen>
  );
}

function TxItem({ t, divider, onDelete }: { t: Transaction; divider: boolean; onDelete: () => void }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const sign = t.type === 'income' ? '+' : t.type === 'refund' ? '+' : '';
  const amtColor = t.type === 'income' ? colors.sage : t.type === 'refund' ? colors.sage : colors.ink;

  return (
    <Pressable onPress={() => setOpen((v) => !v)} style={[styles.row, divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 10, marginTop: 2 }]}>
      <View style={[styles.ico, { backgroundColor: piCatColor(t.category_id) + '22' }]}>
        <AppText style={{ fontSize: 20 }}>{piCatEmoji(t.category_id)}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText type="bodyMed" numberOfLines={1}>{t.merchant ?? '—'}</AppText>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <AppText type="captionSm" muted>{t.posted_date}</AppText>
          <AppText type="captionSm" muted>·</AppText>
          <AppText type="captionSm" muted>{TYPE_LABELS[t.type]}</AppText>
          {t.needs_review === 1 && (
            <AppText type="captionSm" style={{ color: colors.marigold }}>· review</AppText>
          )}
        </View>
        {open && (
          <>
            <AppText type="captionSm" muted style={{ marginTop: 4 }}>
              {piCatLabel(t.category_id)} · {t.category_origin}
            </AppText>
            {t.description && <AppText type="captionSm" muted>{t.description}</AppText>}
            <Pressable onPress={onDelete} style={{ marginTop: 6 }}>
              <AppText type="captionMed" color={colors.coral}>Delete</AppText>
            </Pressable>
          </>
        )}
      </View>
      <AppText type="bodyMed" num style={{ color: amtColor }}>
        {sign}{fmtPaise(t.amount_paise)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  ico: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

// Pi-backed statement import: POST /imports (multipart) → review rows → POST /imports/{id}/confirm.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { StatusChip } from '@/components/StatusChip';
import { useTheme } from '@/theme/ThemeProvider';
import {
  FIN_BASE,
  financialApi,
  fmtPaise,
  type Account,
  type ImportObj,
  type ImportRow,
  type RowDecision,
} from '@/lib/financialApi';
import { PI_CATEGORY_LIST, piCatColor, piCatEmoji, piCatLabel } from '@/lib/catMap';

type Stage = 'pick' | 'uploading' | 'review' | 'committed' | 'cancelled' | 'error';

export default function ImportScreen() {
  const { colors } = useTheme();
  const [stage, setStage] = useState<Stage>('pick');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [imp, setImp] = useState<ImportObj | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [result, setResult] = useState<{ inserted: number; linked: number; excluded: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPicker, setShowPicker] = useState<string | null>(null); // row id

  const loadAccounts = useCallback(async () => {
    try {
      const a = await financialApi.accounts();
      setAccounts(a);
      if (a.length > 0 && !accountId) setAccountId(a[0].id);
    } catch (e: any) {
      setError(e.message ?? 'Could not reach the Pi');
    }
  }, [accountId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const createDemoAccount = async () => {
    try {
      await financialApi.createAccount({ display_name: 'Default', type: 'bank' });
      await loadAccounts();
    } catch (e: any) {
      setError(e.message ?? 'Failed');
    }
  };

  const uploadFormData = async (fd: FormData) => {
    setStage('uploading');
    setError(null);
    try {
      const res = await fetch(`${FIN_BASE}/imports`, { method: 'POST', body: fd as unknown as BodyInit });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: any };
        const code = typeof err.detail === 'string' ? err.detail : err.detail?.code ?? `HTTP ${res.status}`;
        throw new Error(code);
      }
      const i = await res.json() as ImportObj;
      setImp(i);
      const r = await financialApi.importRows(i.id);
      setRows(r);
      setStage('review');
    } catch (e: any) {
      setError(e.message ?? 'Upload failed');
      setStage('error');
    }
  };

  const onPickFile = async () => {
    if (!accountId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf', 'application/vnd.ms-excel'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const fd = new FormData();
      fd.append('account_id', accountId);

      if (Platform.OS === 'web' && asset.file) {
        // On web, the picker exposes the real File object.
        fd.append('file', asset.file, asset.name);
      } else {
        // Native: use the RN-style { uri, name, type } shape.
        const mime = asset.mimeType
          ?? (asset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'text/csv');
        fd.append('file', { uri: asset.uri, name: asset.name, type: mime } as unknown as Blob);
      }
      await uploadFormData(fd);
    } catch (e: any) {
      setError(e.message ?? 'Could not pick file');
      setStage('error');
    }
  };

  const updateRow = async (rowId: string, patch: Partial<Pick<ImportRow, 'decision' | 'category_id'>>) => {
    if (!imp) return;
    try {
      const updated = await financialApi.patchImportRow(imp.id, rowId, patch);
      setRows((prev) => prev.map((r) => (r.id === rowId ? updated : r)));
    } catch { /* ignore */ }
  };

  const confirm = async () => {
    if (!imp) return;
    setBusy(true);
    try {
      const r = await financialApi.confirmImport(imp.id);
      setResult(r);
      setStage('committed');
    } catch (e: any) {
      setError(e.message ?? 'Confirm failed');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!imp) return;
    try { await financialApi.cancelImport(imp.id); } catch { /* ignore */ }
    setStage('cancelled');
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Screen title="Statement import" screen="activity" showBack showScopeBar={false}>
      <AppText type="label" muted style={{ marginHorizontal: 4, marginBottom: 10 }}>
        Upload a bank or credit-card statement (CSV or PDF). The Pi parses, categorizes, and lets you review before anything is saved.
      </AppText>

      {error && (
        <Card style={{ backgroundColor: colors.marigoldSoft, marginBottom: 10 }}>
          <AppText type="labelMed" color={colors.marigold}>Problem</AppText>
          <AppText type="caption" muted style={{ marginTop: 4 }}>{error}</AppText>
        </Card>
      )}

      {stage === 'pick' && (
        <>
          <Card>
            <AppText type="h3">1. Choose an account</AppText>
            {accounts.length === 0 ? (
              <>
                <AppText type="label" muted style={{ marginTop: 6 }}>No accounts yet.</AppText>
                <Button label="Create a default account" variant="soft" style={{ marginTop: 10 }} onPress={createDemoAccount} />
              </>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 10 }}>
                {accounts.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => setAccountId(a.id)}
                    style={[styles.chip, { backgroundColor: accountId === a.id ? colors.indigo : colors.surface2, borderColor: colors.indigo }]}
                  >
                    <AppText type="captionMed" style={{ color: accountId === a.id ? '#fff' : colors.ink }}>
                      {a.type === 'bank' ? '🏦' : a.type === 'credit_card' ? '💳' : '💵'} {a.display_name}{a.last4 ? ` ••${a.last4}` : ''}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Card>

          <Card>
            <AppText type="h3">2. Upload the file</AppText>
            <AppText type="caption" muted style={{ marginTop: 6, lineHeight: 18 }}>
              Supported: CSV (canonical or Date/Description/Debit/Credit) or text-extractable PDF. Max 25 MB, 10 000 rows.
            </AppText>
            <Button
              label="Choose a file"
              variant="primary"
              block
              style={{ marginTop: 12 }}
              onPress={onPickFile}
              disabled={!accountId}
            />
          </Card>
        </>
      )}

      {stage === 'uploading' && (
        <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator color={colors.indigo} size="large" />
          <AppText type="h3" style={{ marginTop: 12 }}>Pi is parsing…</AppText>
          <AppText type="caption" muted style={{ marginTop: 4 }}>Extracting rows and classifying categories</AppText>
        </Card>
      )}

      {stage === 'review' && imp && (
        <>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <AppText type="h3">{imp.original_filename}</AppText>
                <AppText type="caption" muted>
                  {imp.row_count} rows · {imp.issue_count} flagged · parser {imp.parser_id}
                </AppText>
              </View>
              <StatusChip tone="info" label="Review ready" />
            </View>
          </Card>

          <Card>
            <AppText type="captionMed" muted style={{ letterSpacing: 1, marginBottom: 8 }}>ROWS</AppText>
            {rows.map((r) => (
              <ReviewRow
                key={r.id}
                row={r}
                picker={showPicker === r.id}
                togglePicker={() => setShowPicker(showPicker === r.id ? null : r.id)}
                onDecision={(d) => updateRow(r.id, { decision: d })}
                onCategory={(c) => { updateRow(r.id, { category_id: c }); setShowPicker(null); }}
              />
            ))}
          </Card>

          {rows.some((r) => r.decision === 'unresolved') && (
            <Card style={{ backgroundColor: colors.marigoldSoft }}>
              <AppText type="captionMed" color={colors.marigold}>
                {rows.filter((r) => r.decision === 'unresolved').length} row(s) still need a decision
              </AppText>
            </Card>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              label={busy ? 'Committing…' : 'Confirm & save'}
              variant="primary"
              block
              onPress={confirm}
              disabled={busy || rows.some((r) => r.decision === 'unresolved')}
            />
            <Button label="Cancel" variant="soft" onPress={cancel} />
          </View>
        </>
      )}

      {stage === 'committed' && result && (
        <Card style={{ backgroundColor: colors.sageSoft, alignItems: 'center', paddingVertical: 24 }}>
          <AppText style={{ fontSize: 44 }}>✓</AppText>
          <AppText type="h3" style={{ marginTop: 8 }}>Imported</AppText>
          <AppText type="label" muted style={{ marginTop: 4 }}>
            {result.inserted} inserted · {result.linked} linked · {result.excluded} excluded
          </AppText>
          <Button label="Import another" variant="soft" style={{ marginTop: 14 }} onPress={() => { setStage('pick'); setImp(null); setRows([]); setResult(null); }} />
        </Card>
      )}

      {stage === 'cancelled' && (
        <Card>
          <AppText type="h3">Cancelled</AppText>
          <AppText type="label" muted style={{ marginTop: 4 }}>No transactions were created.</AppText>
          <Button label="Try again" variant="soft" style={{ marginTop: 10 }} onPress={() => { setStage('pick'); setImp(null); setRows([]); }} />
        </Card>
      )}

      {stage === 'error' && (
        <Button label="Try again" variant="soft" onPress={() => setStage('pick')} />
      )}
    </Screen>
  );
}

function ReviewRow({
  row,
  picker,
  togglePicker,
  onDecision,
  onCategory,
}: {
  row: ImportRow;
  picker: boolean;
  togglePicker: () => void;
  onDecision: (d: RowDecision) => void;
  onCategory: (c: ImportRow['category_id']) => void;
}) {
  const { colors } = useTheme();
  const decColor = row.decision === 'include' ? colors.sage : row.decision === 'exclude' ? colors.ink3 : row.decision === 'link_existing' ? colors.indigo : colors.marigold;
  return (
    <View style={[rowStyles.wrap, { borderBottomColor: colors.line }]}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={[rowStyles.ico, { backgroundColor: piCatColor(row.category_id) + '22' }]}>
          <AppText style={{ fontSize: 18 }}>{piCatEmoji(row.category_id)}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText type="bodyMed" numberOfLines={2}>{row.raw_description}</AppText>
          <AppText type="captionSm" muted>
            {row.posted_date ?? '—'} · {row.type} · {row.source_locator}
          </AppText>
          <Pressable onPress={togglePicker}>
            <AppText type="captionMed" color={colors.indigo} style={{ marginTop: 2 }}>
              {piCatLabel(row.category_id)} · change
            </AppText>
          </Pressable>
          {row.issue_codes.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {row.issue_codes.map((ic) => (
                <View key={ic} style={{ backgroundColor: colors.marigoldSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <AppText type="caption" style={{ fontSize: 9, color: colors.marigold }}>{ic}</AppText>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText type="bodyMed" num>{fmtPaise(row.amount_paise)}</AppText>
          <AppText type="captionSm" style={{ color: decColor, marginTop: 2 }}>{row.decision}</AppText>
        </View>
      </View>
      {picker && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 4 }}>
          {PI_CATEGORY_LIST.map((c) => (
            <Pressable
              key={c}
              onPress={() => onCategory(c)}
              style={[rowStyles.catChip, { backgroundColor: row.category_id === c ? piCatColor(c) + '55' : colors.surface2, borderColor: piCatColor(c) }]}
            >
              <AppText type="caption" style={{ fontSize: 10 }}>{piCatEmoji(c)} {piCatLabel(c)}</AppText>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        <DecBtn label="Include" active={row.decision === 'include'} color={colors.sage} onPress={() => onDecision('include')} />
        <DecBtn label="Exclude" active={row.decision === 'exclude'} color={colors.ink3} onPress={() => onDecision('exclude')} />
      </View>
    </View>
  );
}

function DecBtn({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[rowStyles.decBtn, { backgroundColor: active ? color : colors.surface2, borderColor: color }]}
    >
      <AppText type="captionMed" style={{ color: active ? '#fff' : color, fontSize: 11 }}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1 },
});

const rowStyles = StyleSheet.create({
  wrap: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  ico: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catChip: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 99, borderWidth: 1 },
  decBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 99, borderWidth: 1 },
});

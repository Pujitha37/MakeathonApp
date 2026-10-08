// Ported from `importSheet()` / `doImport()` in finprofile.html.
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from '@/components/AppText';
import { SheetTitle, SheetLead } from '@/components/SheetParts';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { ProgressBar } from '@/components/Bars';
import { useStore } from '@/store/useStore';
import { useSheet } from '@/components/Sheet';

export function ImportSheetContent() {
  const { colors } = useTheme();
  const router = useRouter();
  const sheet = useSheet();
  const stmts = useStore((s) => s.stmts);
  const importBankOct = useStore((s) => s.importBankOct);
  const setActTab = useStore((s) => s.setActTab);
  const setStmtSrc = useStore((s) => s.setStmtSrc);
  const setOpenStmt = useStore((s) => s.setOpenStmt);

  const hasOct = stmts.some((s) => s.id === 'b-oct');
  const [stage, setStage] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  const doImport = (kind: 'bank' | 'scan') => {
    if (kind === 'scan') {
      setStage('error');
      return;
    }
    setStage('loading');
    setProgress(0);
    requestAnimationFrame(() => requestAnimationFrame(() => setProgress(100)));
    setTimeout(() => {
      importBankOct();
      setStage('done');
    }, 1700);
  };

  return (
    <View>
      <SheetTitle>Import a statement</SheetTitle>
      <SheetLead>
        Pick a PDF or CSV statement. It's read on this phone by a fixed parser, not by AI. Scanned or photo statements
        aren't supported yet.
      </SheetLead>
      <Pressable
        disabled={hasOct || stage !== 'idle'}
        onPress={() => doImport('bank')}
        style={[styles.opt, { backgroundColor: colors.surface2, opacity: hasOct ? 0.5 : 1 }]}
      >
        <View style={[styles.ico, { backgroundColor: colors.surface }]}>
          <AppText style={{ fontSize: 20 }}>🏦</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText type="h3">Savings_4821_Oct.pdf</AppText>
          <AppText type="captionSm" muted>
            {hasOct ? 'Already imported' : 'Bank statement, 1–5 Oct 2026 (sample)'}
          </AppText>
        </View>
      </Pressable>
      <Pressable disabled={stage !== 'idle'} onPress={() => doImport('scan')} style={[styles.opt, { backgroundColor: colors.surface2 }]}>
        <View style={[styles.ico, { backgroundColor: colors.surface }]}>
          <AppText style={{ fontSize: 20 }}>🖼️</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText type="h3">scan_statement.jpg</AppText>
          <AppText type="captionSm" muted>
            Image file (sample)
          </AppText>
        </View>
      </Pressable>

      {stage === 'error' && (
        <View style={[styles.errBox, { backgroundColor: colors.marigoldSoft }]}>
          <AppText type="label">
            <AppText type="labelMed">This file is an image.</AppText> Image and scanned statements can't be read in
            this version. Download the PDF or CSV statement from your bank's app and import that instead.
          </AppText>
        </View>
      )}

      {stage === 'loading' && (
        <View>
          <View style={styles.thinkRow}>
            <Mascot size={44} />
            <AppText type="labelMed" muted>
              Reading the statement…
            </AppText>
          </View>
          <View style={{ marginTop: 12 }}>
            <ProgressBar pct={progress / 100} color={colors.indigo} />
          </View>
        </View>
      )}

      {stage === 'done' && (
        <View>
          <View style={[styles.doneCard, { backgroundColor: colors.surface2 }]}>
            <View style={[styles.ico, { backgroundColor: colors.sageSoft }]}>
              <AppText style={{ fontSize: 20 }}>✅</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText type="labelMed">Imported rows</AppText>
              <AppText type="captionSm" muted>
                1 Oct – 5 Oct 2026. Salary and transfers are kept out of spending.
              </AppText>
            </View>
          </View>
          <Button
            label="View statement"
            variant="primary"
            block
            style={{ marginTop: 12 }}
            onPress={() => {
              sheet.close();
              setActTab('statements');
              setStmtSrc('bank');
              setOpenStmt('b-oct');
              router.push('/activity');
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  opt: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, marginBottom: 8 },
  ico: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  errBox: { marginTop: 10, padding: 12, borderRadius: 14 },
  thinkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
});

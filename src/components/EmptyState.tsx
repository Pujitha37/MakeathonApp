// Ported from `catEmptyState()` in finprofile.html.
import React from 'react';
import { View } from 'react-native';
import { Card } from './Card';
import { AppText } from './AppText';
import { Button } from './Button';
import { useSheet } from './Sheet';
import { ImportSheetContent } from './sheets/ImportSheet';
import { SHORT } from '@/data/types';
import type { Source } from '@/data/types';
import { fd } from '@/lib/format';

export function EmptyState({ scope, coverageEndDate, hasStmts }: { scope: Source; coverageEndDate: Date; hasStmts: boolean }) {
  const sheet = useSheet();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
      <AppText style={{ fontSize: 40 }}>📭</AppText>
      <AppText type="h3" style={{ marginTop: 8, marginBottom: 4, textAlign: 'center' }}>
        No {SHORT[scope].toLowerCase()} data for this month yet
      </AppText>
      <AppText type="label" muted style={{ textAlign: 'center', marginBottom: 14 }}>
        Your latest {scope === 'bank' ? 'bank' : 'card'} statement ends on {hasStmts ? fd(coverageEndDate) : '—'}. Import a
        newer one to see October here.
      </AppText>
      <Button label="Import statement" variant="primary" onPress={() => sheet.open(<ImportSheetContent />, ['65%', '92%'])} />
    </Card>
  );
}

// Ported from `adviceCard()` in finprofile.html.
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import type { AdviceItem } from '@/lib/advice';
import { useStore } from '@/store/useStore';
import { Card } from './Card';
import { AppText } from './AppText';
import { Button } from './Button';
import { useSheet } from './Sheet';
import { groupedKey, TxRow, DayHeader } from './TxRow';
import { iso } from '@/lib/format';
import { TODAY } from '@/data/seed';

export function AdviceCard({ item, preview }: { item: AdviceItem; preview?: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const dismissAdvice = useStore((s) => s.dismissAdvice);
  const sheet = useSheet();
  const [showWhy, setShowWhy] = useState(false);

  const borderColor = item.tone === 'bad' ? colors.coral : item.tone === 'good' ? colors.sage : colors.marigold;

  const viewEvidence = () => {
    if (!item.ev) return;
    const today = iso(TODAY);
    const yest = iso(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 1));
    const rows: React.ReactNode[] = [];
    let last = '';
    item.ev
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((t) => {
        if (t.date !== last) {
          last = t.date;
          rows.push(<DayHeader key={'h' + t.date} label={groupedKey(t, today, yest)} />);
        }
        rows.push(<TxRow key={t.id} t={t} />);
      });
    sheet.open(
      <View>
        <AppText type="titleLg" style={{ marginBottom: 4 }}>
          Behind this advice
        </AppText>
        <AppText type="label" muted style={{ marginBottom: 14 }}>
          {item.why}
        </AppText>
        {rows}
      </View>,
      ['70%', '92%'],
    );
  };

  return (
    <Card style={{ borderLeftWidth: 5, borderLeftColor: borderColor }}>
      <AppText type="h3" style={{ marginBottom: 4 }}>
        {item.title}
      </AppText>
      <AppText type="label" muted>
        {item.body}
      </AppText>
      {showWhy && !preview && (
        <View style={[styles.why, { backgroundColor: colors.surface2 }]}>
          <AppText type="captionMed">Why am I seeing this?</AppText>
          <AppText type="caption" muted>
            {item.why}
          </AppText>
        </View>
      )}
      <View style={styles.acts}>
        {item.ev && (
          <Button label={`View ${item.ev.length} transaction${item.ev.length !== 1 ? 's' : ''}`} sm variant="soft" onPress={viewEvidence} />
        )}
        {preview ? (
          <Button label="More advice" sm variant="ghost" onPress={() => router.push('/financial/advice')} />
        ) : (
          <>
            {item.link && (
              <Button
                label={item.link === 'forecast' ? 'Open forecast' : 'Open goals'}
                sm
                variant="soft"
                onPress={() => (item.link === 'forecast' ? router.push('/financial/forecast') : router.push('/financial/plan'))}
              />
            )}
            <Button label={showWhy ? 'Hide reason' : 'Why am I seeing this?'} sm variant="ghost" onPress={() => setShowWhy((v) => !v)} />
            <Button label="Dismiss" sm variant="ghost" onPress={() => dismissAdvice(item.id)} />
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  why: { marginTop: 10, padding: 12, borderRadius: 14 },
});

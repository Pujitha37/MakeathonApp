import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { CAT, icoBg } from '@/theme/tokens';
import { fd, fmt } from '@/lib/format';
import type { Tx } from '@/data/types';
import { SHORT } from '@/data/types';
import { AppText } from './AppText';

interface TxRowProps {
  t: Tx;
  showSrc?: boolean;
  recurring?: boolean;
  loanName?: string;
  loanEmoji?: string;
  loanSub?: string; // e.g. "Installment 3 of 12, Bajaj Finserv EMI"
  divider?: boolean;
}

export function TxRow({ t, showSrc, recurring, loanName, loanEmoji, loanSub, divider = true }: TxRowProps) {
  const { colors } = useTheme();
  const isEmi = t.type === 'emi';
  const c = CAT[t.cat];
  const emoji = isEmi ? loanEmoji ?? '🏷️' : c.emoji;
  const tileBg = isEmi ? colors.marigoldSoft : icoBg(c.color);
  const title = isEmi ? loanName ?? 'EMI' : t.merchant;
  const caption = isEmi ? loanSub ?? t.merchant : c.label;

  return (
    <View style={[styles.row, divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
      <View style={[styles.ico, { backgroundColor: tileBg }]}>
        <AppText style={{ fontSize: 20 }}>{emoji}</AppText>
      </View>
      <View style={styles.mid}>
        <AppText type="bodyMed" numberOfLines={1}>
          {title}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <AppText type="captionSm" muted>
            {caption}
          </AppText>
          {recurring && !isEmi && <Tag label="↻ Monthly" tone="indigo" />}
          {isEmi && <Tag label="EMI" tone="marigold" />}
          {showSrc && <Tag label={SHORT[t.source]} tone="neutral" />}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <AppText type="bodyMed" num>
          {fmt(t.amount)}
        </AppText>
        <AppText type="captionSm" faint num>
          {fd(t.date)}
        </AppText>
      </View>
    </View>
  );
}

function Tag({ label, tone }: { label: string; tone: 'indigo' | 'marigold' | 'neutral' }) {
  const { colors, dark } = useTheme();
  const bg = tone === 'indigo' ? colors.indigoSoft : tone === 'marigold' ? colors.marigoldSoft : colors.surface2;
  const fg = tone === 'indigo' ? colors.indigo : tone === 'marigold' ? (dark ? colors.marigold : '#9A6200') : colors.ink2;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 }}>
      <AppText type="tag" color={fg}>
        {label}
      </AppText>
    </View>
  );
}

export function DayHeader({ label }: { label: string }) {
  return (
    <AppText type="captionSmBold" muted style={{ marginTop: 14, marginHorizontal: 4, marginBottom: 4 }}>
      {label}
    </AppText>
  );
}

export function groupedKey(t: Tx, today: string, yesterday: string): string {
  if (t.date === today) return 'Today';
  if (t.date === yesterday) return 'Yesterday';
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [y, m, d] = t.date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WD[dt.getDay()]}, ${fd(t.date)}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  ico: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: {
    flex: 1,
    minWidth: 0,
  },
});

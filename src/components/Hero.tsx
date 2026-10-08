// Ported from `.hero` in finprofile.html (the Home month-total card).
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { CAT, CatId } from '@/theme/tokens';
import { fmt } from '@/lib/format';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { StackBar } from './Bars';

interface HeroProps {
  monthLabel: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  hasData: boolean;
  noDataReason?: string;
  total?: number;
  count?: number;
  rangeLabel?: string;
  complete?: boolean;
  deltaText?: string;
  deltaUp?: boolean;
  cats?: [CatId, number][];
}

export function Hero({
  monthLabel,
  canPrev,
  canNext,
  onPrev,
  onNext,
  hasData,
  noDataReason,
  total = 0,
  count = 0,
  rangeLabel,
  complete,
  deltaText,
  deltaUp,
  cats = [],
}: HeroProps) {
  const { colors, dark } = useTheme();
  const router = useRouter();
  const bg = dark ? '#2B3398' : colors.indigo;

  const body = (
    <View style={[styles.hero, { backgroundColor: bg }]}>
      <View style={styles.monthnav}>
        <Pressable onPress={onPrev} disabled={!canPrev} style={[styles.navBtn, !canPrev && { opacity: 0.3 }]}>
          <Icon name="l" size={18} color="#fff" />
        </Pressable>
        <AppText type="h3" color="#fff">
          {monthLabel}
        </AppText>
        <Pressable onPress={onNext} disabled={!canNext} style={[styles.navBtn, !canNext && { opacity: 0.3 }]}>
          <Icon name="r" size={18} color="#fff" />
        </Pressable>
      </View>

      {!hasData ? (
        <>
          <AppText type="displayXl" color="#fff" num style={{ marginVertical: 6 }}>
            —
          </AppText>
          <AppText type="caption" color="rgba(255,255,255,.85)">
            {noDataReason}
          </AppText>
        </>
      ) : (
        <>
          <AppText type="displayXl" color="#fff" num style={{ marginVertical: 6 }}>
            {fmt(total)}
          </AppText>
          <AppText type="caption" color="rgba(255,255,255,.85)">
            {count} expenses, {rangeLabel}
            {complete ? '' : ' (data so far)'}
          </AppText>
          {deltaText && (
            <View style={styles.delta}>
              <AppText type="captionMed" color="#fff">
                {deltaUp ? '▲' : '▼'} {deltaText}
              </AppText>
            </View>
          )}
          {cats.length > 0 && (
            <>
              <StackBar segments={cats.map(([c, v]) => ({ value: v, color: CAT[c].color }))} />
              <View style={styles.legend}>
                {cats.slice(0, 4).map(([c, v]) => (
                  <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: CAT[c].color }} />
                    <AppText type="caption" color="rgba(255,255,255,.95)">
                      {CAT[c].label} {Math.round((v / total) * 100)}%
                    </AppText>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </View>
  );

  if (!hasData) return body;
  return (
    <Pressable onPress={() => router.push('/insights')} style={{ marginBottom: 0 }}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 28,
    padding: 18,
    paddingBottom: 16,
    marginBottom: 12,
  },
  monthnav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delta: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,.14)',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
});

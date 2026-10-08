// Ported from `scopeSheet()` in finprofile.html.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from '@/components/AppText';
import { SheetTitle, SheetLead } from '@/components/SheetParts';
import { useStore } from '@/store/useStore';
import { useSheet } from '@/components/Sheet';
import { SOURCES } from '@/data/types';
import type { Source } from '@/data/types';
import { coverageEnd } from '@/lib/calc';
import { fd } from '@/lib/format';

export function ScopeSheetContent() {
  const { colors } = useTheme();
  const scope = useStore((s) => s.scope);
  const setScope = useStore((s) => s.setScope);
  const tx = useStore((s) => s.tx);
  const stmts = useStore((s) => s.stmts);
  const sheet = useSheet();

  const freshnessFor = (k: Source) => {
    if (k === 'manual') {
      const last = tx.filter((t) => t.source === 'manual').map((t) => t.date).sort().pop();
      return last ? 'Up to date, last entry ' + fd(last) : 'Up to date';
    }
    return 'Covers up to ' + fd(coverageEnd(stmts, k));
  };

  return (
    <View>
      <SheetTitle>Which records?</SheetTitle>
      <SheetLead>
        Totals, charts, advice and answers use the source you choose here. Voice entries and each statement are kept
        separate and never added together.
      </SheetLead>
      {(Object.keys(SOURCES) as Source[]).map((k) => {
        const on = scope === k;
        return (
          <Pressable
            key={k}
            onPress={() => {
              setScope(k);
              sheet.close();
            }}
            style={[
              styles.opt,
              { backgroundColor: on ? colors.indigoSoft : colors.surface2 },
              on && { borderWidth: 2, borderColor: colors.indigo },
            ]}
          >
            <View style={[styles.ico, { backgroundColor: colors.surface }]}>
              <AppText style={{ fontSize: 20 }}>{SOURCES[k].ico}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText type="h3">{SOURCES[k].label}</AppText>
              <AppText type="captionSm" muted>
                {SOURCES[k].desc}
              </AppText>
              <AppText type="captionSm" muted style={{ fontWeight: '600', marginTop: 3 }}>
                {freshnessFor(k)}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  opt: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    marginBottom: 8,
  },
  ico: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

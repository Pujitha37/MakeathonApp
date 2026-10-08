// Ported from `.scopebar` / `#scopebar` in finprofile.html.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { SOURCES } from '@/data/types';
import { scopeFresh } from '@/lib/calc';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { useSheet } from './Sheet';
import { ScopeSheetContent } from './sheets/ScopeSheet';

export function ScopeBar() {
  const { colors, shadow } = useTheme();
  const scope = useStore((s) => s.scope);
  const stmts = useStore((s) => s.stmts);
  const sheet = useSheet();

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => sheet.open(<ScopeSheetContent />, ['65%'])}
        style={[styles.btn, { backgroundColor: colors.surface, ...shadow }]}
      >
        <AppText style={{ fontSize: 16 }}>{SOURCES[scope].ico}</AppText>
        <AppText type="captionMed">
          {SOURCES[scope].label}{' '}
          <AppText type="caption" muted>
            {scopeFresh(stmts, scope)}
          </AppText>
        </AppText>
        <Icon name="down" size={16} color={colors.ink2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingBottom: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
});

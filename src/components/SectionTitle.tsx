import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

export function SectionTitle({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 18,
        marginHorizontal: 4,
        marginBottom: 10,
      }}
    >
      <AppText type="sectionTitle">{label}</AppText>
      {action && (
        <AppText type="captionMed" onPress={onAction} suppressHighlighting color={colors.indigo}>
          {action}
        </AppText>
      )}
    </View>
  );
}

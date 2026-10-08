// Ported from `.segbar` (EMI installment progress) in finprofile.html.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function SegBar({ months, paid, current }: { months: number; paid: number; current: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: months }, (_, i) => {
        const isPaid = i < paid;
        const isCurrent = i === paid && current;
        return (
          <View
            key={i}
            style={[
              styles.cell,
              { backgroundColor: isPaid ? colors.sage : isCurrent ? colors.marigold : colors.surface2 },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, marginTop: 14 },
  cell: { flex: 1, height: 12, borderRadius: 4 },
});

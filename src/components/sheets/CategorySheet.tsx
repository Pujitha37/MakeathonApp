// Ported from `changeCat()` in finprofile.html — a 4-column category picker grid.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { CATS, CatId } from '@/theme/tokens';
import { AppText } from '@/components/AppText';
import { SheetTitle, SheetLead } from '@/components/SheetParts';
import { fmt } from '@/lib/format';

interface CategorySheetProps {
  merchant: string;
  amount: number;
  current: CatId;
  suggested: CatId;
  onPick: (cat: CatId) => void;
}

export function CategorySheetContent({ merchant, amount, current, suggested, onPick }: CategorySheetProps) {
  const { colors } = useTheme();
  return (
    <View>
      <SheetTitle>Pick a category</SheetTitle>
      <SheetLead>
        For {merchant}, {fmt(amount)}. The Pi suggested {CATS.find((c) => c.id === suggested)?.label}.
      </SheetLead>
      <View style={styles.grid}>
        {CATS.map((c) => {
          const on = current === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => onPick(c.id)}
              style={[
                styles.cell,
                { backgroundColor: colors.surface2 },
                on && { borderWidth: 2, borderColor: colors.indigo },
              ]}
            >
              <AppText style={{ fontSize: 22 }}>{c.emoji}</AppText>
              <AppText type="captionSmBold" style={{ textAlign: 'center' }}>
                {c.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '23.5%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
  },
});

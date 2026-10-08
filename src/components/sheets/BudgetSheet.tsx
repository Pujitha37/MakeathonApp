// Ported from `budgetSheet()` in finprofile.html.
import React, { useState } from 'react';
import { View } from 'react-native';
import { CAT, CatId } from '@/theme/tokens';
import { AppText } from '@/components/AppText';
import { SheetTitle, SheetLead } from '@/components/SheetParts';
import { Stepper } from '@/components/Stepper';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { useSheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { fmt } from '@/lib/format';
import { suggestFor } from '@/lib/calc';

export function BudgetSheetContent({ cat, preset }: { cat: CatId; preset?: number }) {
  const sheet = useSheet();
  const toast = useToast();
  const { tx, stmts, scope, budgets } = useStore(useShallow((s) => ({ tx: s.tx, stmts: s.stmts, scope: s.scope, budgets: s.budgets })));
  const setBudget = useStore((s) => s.setBudget);
  const removeBudget = useStore((s) => s.removeBudget);
  const existing = budgets[cat];
  const initial = preset ?? existing ?? suggestFor(tx, stmts, scope, cat)?.avg ?? 2000;
  const [value, setValue] = useState(initial);

  const save = () => {
    if (!value) {
      toast.show('Enter an amount above zero');
      return;
    }
    setBudget(cat, value);
    sheet.close();
    toast.show(`${CAT[cat].label} budget set to ${fmt(value)}`);
  };

  return (
    <View>
      <SheetTitle>
        {CAT[cat].emoji} {CAT[cat].label}
      </SheetTitle>
      <SheetLead>Monthly limit. You can change it any time.</SheetLead>
      <Stepper value={value} onChange={setValue} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[2000, 3000, 5000, 8000].map((n) => (
          <Chip key={n} label={fmt(n)} onPress={() => setValue(n)} />
        ))}
      </View>
      <Button label="Save budget" variant="primary" block onPress={save} />
      {existing !== undefined && (
        <Button
          label="Remove budget"
          variant="ghost"
          block
          style={{ marginTop: 6 }}
          onPress={() => {
            removeBudget(cat);
            sheet.close();
            toast.show('Budget removed');
          }}
        />
      )}
    </View>
  );
}

// Ported from `contribSheet()` in finprofile.html.
import React, { useState } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { SheetTitle, SheetLead } from '@/components/SheetParts';
import { Stepper } from '@/components/Stepper';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { useStore } from '@/store/useStore';
import { useSheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { fmt, iso } from '@/lib/format';
import { TODAY } from '@/data/seed';

export function ContributionSheetContent({ goalId, goalName, emoji }: { goalId: number; goalName: string; emoji: string }) {
  const sheet = useSheet();
  const toast = useToast();
  const addContribution = useStore((s) => s.addContribution);
  const [value, setValue] = useState(2000);

  const save = () => {
    if (!value) return;
    addContribution(goalId, value, iso(TODAY));
    sheet.close();
    toast.show(`${fmt(value)} added to ${goalName}`);
  };

  return (
    <View>
      <SheetTitle>
        {emoji} Add to {goalName}
      </SheetTitle>
      <SheetLead>Record money you've set aside. Progress uses only what you record.</SheetLead>
      <Stepper value={value} onChange={setValue} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[1000, 2000, 5000, 10000].map((n) => (
          <Chip key={n} label={fmt(n)} onPress={() => setValue(n)} />
        ))}
      </View>
      <Button label="Add contribution" variant="primary" block onPress={save} />
    </View>
  );
}

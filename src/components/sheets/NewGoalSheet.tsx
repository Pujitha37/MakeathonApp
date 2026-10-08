// Ported from `newGoal()` / `saveGoal()` in finprofile.html.
import React, { useState } from 'react';
import { View } from 'react-native';
import { SheetTitle, SheetLead } from '@/components/SheetParts';
import { Field } from '@/components/Field';
import { Button } from '@/components/Button';
import { useStore } from '@/store/useStore';
import { useSheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { iso } from '@/lib/format';
import { TODAY } from '@/data/seed';

export function NewGoalSheetContent() {
  const sheet = useSheet();
  const toast = useToast();
  const addGoal = useStore((s) => s.addGoal);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [due, setDue] = useState('2027-03-31');

  const save = () => {
    const tv = +target.replace(/\D/g, '');
    if (!name || !tv || !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
      toast.show('Add a name, amount and date (YYYY-MM-DD)');
      return;
    }
    addGoal({ name, emoji: '⭐', target: tv, start: iso(TODAY), due });
    sheet.close();
    toast.show('Goal created');
  };

  return (
    <View>
      <SheetTitle>New goal</SheetTitle>
      <SheetLead>What are you saving for?</SheetLead>
      <Field label="Name" placeholder="New laptop" value={name} onChangeText={setName} />
      <Field label="Target amount (₹)" placeholder="60000" keyboardType="numeric" value={target} onChangeText={setTarget} />
      <Field label="Target date (YYYY-MM-DD)" placeholder="2027-03-31" value={due} onChangeText={setDue} />
      <Button label="Create goal" variant="primary" block onPress={save} />
    </View>
  );
}

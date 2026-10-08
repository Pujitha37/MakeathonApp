// Ported from the `addEmi()` / `saveEmi()` sheet in finprofile.html.
import React, { useState } from 'react';
import { View } from 'react-native';
import { SheetTitle, SheetLead } from '@/components/SheetParts';
import { Field } from '@/components/Field';
import { Segmented } from '@/components/Segmented';
import { Button } from '@/components/Button';
import { useStore } from '@/store/useStore';
import { useSheet } from '@/components/Sheet';
import { iso } from '@/lib/format';
import type { Source } from '@/data/types';
import { useToast } from '@/components/Toast';

export function AddEmiSheetContent() {
  const addEmi = useStore((s) => s.addEmi);
  const sheet = useSheet();
  const toast = useToast();
  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState('');
  const [months, setMonths] = useState('');
  const [paid, setPaid] = useState('0');
  const [src, setSrc] = useState<Source>('bank');

  const save = () => {
    const n = +amount.replace(/\D/g, '');
    const d = +day;
    const m = +months;
    const p = +paid || 0;
    if (!name || !n || !(d >= 1 && d <= 28) || !m || p >= m) {
      toast.show("Check the amount, a due day from 1 to 28, and installments");
      return;
    }
    addEmi({
      name,
      kind: src === 'card' ? 'Card EMI' : 'Loan EMI',
      lender: lender || 'Lender',
      emoji: '🏷️',
      emi: n,
      start: iso(new Date(2026, 9 - p, d)),
      months: m,
      dueDay: d,
      source: src,
    });
    sheet.close();
    toast.show('EMI added');
  };

  return (
    <View>
      <SheetTitle>Add an EMI</SheetTitle>
      <SheetLead>Enter the details from your loan or EMI agreement. Payments will be matched from your statements.</SheetLead>
      <Field label="What is it for?" placeholder="Laptop" value={name} onChangeText={setName} />
      <Field label="Lender" placeholder="Bajaj Finserv" value={lender} onChangeText={setLender} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Monthly EMI (₹)" placeholder="3500" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Due day" placeholder="7" keyboardType="numeric" value={day} onChangeText={setDay} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Total installments" placeholder="12" keyboardType="numeric" value={months} onChangeText={setMonths} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Already paid" placeholder="0" keyboardType="numeric" value={paid} onChangeText={setPaid} />
        </View>
      </View>
      <Segmented
        options={[
          { key: 'bank', label: 'Paid from bank' },
          { key: 'card', label: 'Card EMI' },
        ]}
        value={src}
        onChange={(v) => setSrc(v as Source)}
      />
      <Button label="Add EMI" variant="primary" block onPress={save} />
    </View>
  );
}

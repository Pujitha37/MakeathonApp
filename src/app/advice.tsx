// Ported from `adviceHTML()` in finprofile.html.
import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { AdviceCard } from '@/components/AdviceCard';
import { SettingRow } from '@/components/SheetParts';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { adviceList } from '@/lib/advice';

export default function AdviceScreen() {
  const { tx, stmts, scope, budgets, goals, dismissed } = useStore(useShallow((s) => ({
    tx: s.tx,
    stmts: s.stmts,
    scope: s.scope,
    budgets: s.budgets,
    goals: s.goals,
    dismissed: s.dismissed,
  })));
  const resetDismissed = useStore((s) => s.resetDismissed);
  const adv = adviceList(tx, stmts, scope, budgets, goals, dismissed);
  const [notif, setNotif] = useState(false);
  const [spoken, setSpoken] = useState(false);

  return (
    <Screen title="Advice" screen="advice" showBack showScopeBar={false}>
      <AppText type="label" muted style={{ marginHorizontal: 4, marginBottom: 12 }}>
        Friendly nudges based on what you've recorded. Each one shows the numbers behind it.
      </AppText>

      {!adv.length ? (
        <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
          <AppText style={{ fontSize: 40 }}>🌤️</AppText>
          <AppText type="h3" style={{ marginTop: 8, marginBottom: 4 }}>
            All clear
          </AppText>
          <AppText type="label" muted style={{ textAlign: 'center', marginBottom: 14 }}>
            Nothing needs your attention for this source right now.
          </AppText>
          <Button label="Show dismissed cards" variant="soft" onPress={resetDismissed} />
        </Card>
      ) : (
        adv.map((a) => <AdviceCard key={a.id} item={a} />)
      )}

      <Card flat>
        <SettingRow title="Notifications" desc="Off unless you turn them on" on={notif} onToggle={() => setNotif((v) => !v)} divider={false} />
        <SettingRow title="Spoken reminders on the Pi" desc="Off unless you turn them on" on={spoken} onToggle={() => setSpoken((v) => !v)} />
      </Card>
    </Screen>
  );
}

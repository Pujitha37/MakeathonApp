import React from 'react';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabButton, useNavBarStyle } from '@/components/BottomNav';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const navStyle = useNavBarStyle(insets.bottom);

  return (
    <Tabs>
      <TabSlot />
      <TabList style={navStyle}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="home" label="Home" />
        </TabTrigger>
        <TabTrigger name="activity" href="/activity" asChild>
          <TabButton icon="list" label="Activity" />
        </TabTrigger>
        <TabTrigger name="insights" href="/insights" asChild>
          <TabButton icon="pie" label="Insights" />
        </TabTrigger>
        <TabTrigger name="plan" href="/plan" asChild>
          <TabButton icon="target" label="Plan" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

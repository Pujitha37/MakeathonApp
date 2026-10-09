import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabButton, useNavBarStyle } from '@/components/BottomNav';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/components/Icon';
import { AppText } from '@/components/AppText';

function BackBar() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.backBar, { paddingTop: insets.top + 6, backgroundColor: colors.paper, borderBottomColor: colors.line }]}>
      <Pressable
        onPress={() => router.replace('/')}
        style={[styles.backBtn, { backgroundColor: colors.surface }]}
        hitSlop={8}
      >
        <Icon name="back" size={18} color={colors.ink} />
        <AppText type="captionMed" color={colors.ink2}>Profiles</AppText>
      </Pressable>
    </View>
  );
}

export default function FinancialTabsLayout() {
  const insets = useSafeAreaInsets();
  const navStyle = useNavBarStyle(insets.bottom);

  return (
    <Tabs style={styles.tabs}>
      <BackBar />
      <TabSlot style={styles.slot} />
      <TabList style={navStyle}>
        <TabTrigger name="index" href="/financial" asChild>
          <TabButton icon="home" label="Home" />
        </TabTrigger>
        <TabTrigger name="activity" href="/financial/activity" asChild>
          <TabButton icon="list" label="Activity" />
        </TabTrigger>
        <TabTrigger name="insights" href="/financial/insights" asChild>
          <TabButton icon="pie" label="Insights" />
        </TabTrigger>
        <TabTrigger name="plan" href="/financial/plan" asChild>
          <TabButton icon="target" label="Plan" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1 },
  slot: { flex: 1 },
  backBar: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
});

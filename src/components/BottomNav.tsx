// Custom bottom tab bar, ported from `.nav` / `.nav button` / `.nav .pill` in finprofile.html.
// Built on Expo Router's headless Tabs API (expo-router/ui): each button is a <TabTrigger asChild>
// wrapping this component, which receives `isFocused` injected by the trigger.
import React, { forwardRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, IconName } from './Icon';
import { AppText } from './AppText';

interface TabButtonProps extends TabTriggerSlotProps {
  icon: IconName;
  label: string;
}

export const TabButton = forwardRef<View, TabButtonProps>(({ icon, label, isFocused, style, ...rest }, ref) => {
  const { colors } = useTheme();
  return (
    <Pressable ref={ref} style={[styles.btn, style as any]} {...rest}>
      <View style={[styles.pill, isFocused && { backgroundColor: colors.indigoSoft }]}>
        <Icon name={icon} size={22} color={isFocused ? colors.indigo : colors.ink3} />
      </View>
      <AppText type="nav" color={isFocused ? colors.ink : colors.ink3}>
        {label}
      </AppText>
    </Pressable>
  );
});
TabButton.displayName = 'TabButton';

// Pass directly as `<TabList style={useNavBarStyle(insetBottom)}>` — see (tabs)/_layout.tsx.
export function useNavBarStyle(insetBottom: number) {
  const { colors } = useTheme();
  return [
    styles.nav,
    { backgroundColor: colors.surface, borderTopColor: colors.line, paddingBottom: Math.max(10, insetBottom) },
  ];
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  pill: {
    width: 58,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

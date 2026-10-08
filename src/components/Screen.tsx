// Shared tab-screen chrome: topbar + scope bar + scrollable body + FAB stack.
// Ported from the prototype's `.screen` / `renderTop()` wiring in `render()`.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { TopBar } from './TopBar';
import { ScopeBar } from './ScopeBar';
import { FabStack, ScreenKind } from './FabStack';

interface ScreenProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showScopeBar?: boolean;
  screen: ScreenKind;
  children: React.ReactNode;
  scrollRef?: React.RefObject<ScrollView | null>;
  footer?: React.ReactNode; // pinned overlay above the FAB stack, e.g. Ask's input bar
}

export function Screen({ title, subtitle, showBack, showScopeBar = true, screen, children, scrollRef, footer }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.flex, { backgroundColor: colors.paper, paddingTop: insets.top }]}>
      <TopBar title={title} subtitle={subtitle} showBack={showBack} />
      {showScopeBar && <ScopeBar />}
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer}
      <FabStack screen={screen} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
});

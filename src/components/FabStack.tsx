import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { Icon } from './Icon';
import { AppText } from './AppText';
import { Mascot } from './Mascot';

export type ScreenKind = 'home' | 'activity' | 'insights' | 'plan' | 'ask' | 'forecast' | 'advice' | 'fraud';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FabButton({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style: any }) {
  const scale = useSharedValue(0.6);
  const translateY = useSharedValue(10);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 180 });
    translateY.value = withSpring(0, { damping: 8, stiffness: 180 });
    opacity.value = withSpring(1, { damping: 8, stiffness: 180 });
  }, [scale, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable onPress={onPress} style={[style, animStyle]}>
      {children}
    </AnimatedPressable>
  );
}

export function FabStack({ screen }: { screen: ScreenKind }) {
  const { colors, shadow } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requestQuickAddFocus = useStore((s) => s.requestQuickAddFocus);

  const showAdd = screen !== 'home' && screen !== 'ask' && screen !== 'fraud';
  const showAsk = screen !== 'ask' && screen !== 'fraud';
  if (!showAdd && !showAsk) return null;

  return (
    <View style={[styles.stack, { bottom: 84 + insets.bottom }]} pointerEvents="box-none">
      {showAdd && (
        <FabButton
          onPress={() => {
            router.navigate('/financial');
            requestQuickAddFocus();
          }}
          style={[styles.fabAdd, { backgroundColor: colors.marigold }]}
        >
          <Icon name="plus" size={22} color="#2A1E05" />
          <AppText type="h3" color="#2A1E05" style={{ fontWeight: '800' }}>
            Add
          </AppText>
        </FabButton>
      )}
      {showAsk && (
        <FabButton
          onPress={() => router.push('/financial/ask')}
          style={[styles.fabRobot, { backgroundColor: colors.surface, borderColor: colors.indigoSoft, ...shadow }]}
        >
          <Mascot size={42} />
          <AppText type="h3" color={colors.indigo} style={{ fontWeight: '800' }}>
            Ask
          </AppText>
        </FabButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
    gap: 12,
  },
  fabAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    paddingVertical: 15,
    paddingLeft: 16,
    paddingRight: 20,
  },
  fabRobot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 18,
    borderWidth: 1.5,
  },
});

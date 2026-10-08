import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { Icon } from './Icon';
import { AppText } from './AppText';
import { useSheet } from './Sheet';
import { PiSheetContent } from './sheets/PiSheet';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

function PulseDot({ color, listening }: { color: string; listening: boolean }) {
  const ringSpread = useSharedValue(0);

  useEffect(() => {
    if (listening) {
      ringSpread.value = withRepeat(
        withSequence(
          withTiming(4, { duration: 500 }),
          withTiming(0, { duration: 500 }),
        ),
        -1,
      );
    } else {
      cancelAnimation(ringSpread);
      ringSpread.value = 0;
    }
  }, [listening, ringSpread]);

  const pulseStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: 9 + ringSpread.value * 2,
    height: 9 + ringSpread.value * 2,
    borderRadius: (9 + ringSpread.value * 2) / 2,
    backgroundColor: color,
    opacity: 0.3 * (1 - ringSpread.value / 4),
    left: -ringSpread.value,
    top: -ringSpread.value,
  }));

  return (
    <View style={{ width: 9, height: 9 }}>
      {listening && <Animated.View style={pulseStyle} />}
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

export function TopBar({ title, subtitle, showBack }: TopBarProps) {
  const router = useRouter();
  const { colors, dark } = useTheme();
  const setTheme = useStore((s) => s.setTheme);
  const muted = useStore((s) => s.muted);
  const listening = useStore((s) => s.listening);
  const offline = useStore((s) => s.offline);
  const sheet = useSheet();

  const dotColor = muted ? colors.marigold : listening ? colors.coral : colors.sage;
  const piLabel = listening ? 'Listening' : muted ? 'Muted' : 'Pi';

  return (
    <View style={styles.row}>
      {showBack && (
        <Pressable onPress={() => router.back()} style={[styles.backbtn, { backgroundColor: colors.surface }]}>
          <Icon name="back" size={22} color={colors.ink} />
        </Pressable>
      )}
      <View style={styles.title}>
        {subtitle && (
          <AppText type="caption" muted>
            {subtitle}
          </AppText>
        )}
        <AppText type="titleXl">{title}</AppText>
      </View>
      <Pressable
        onPress={() => setTheme(dark ? 'light' : 'dark')}
        style={[styles.themebtn, { backgroundColor: colors.surface }]}
      >
        <Icon name={dark ? 'sun' : 'moon'} size={20} color={colors.ink} />
      </Pressable>
      <Pressable
        onPress={() => sheet.open(<PiSheetContent />, ['45%'])}
        style={[styles.pichip, { backgroundColor: colors.surface }]}
      >
        <PulseDot color={dotColor} listening={listening} />
        <AppText type="captionMed">
          {piLabel}
          {offline ? ' · offline' : ''}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: { flex: 1, minWidth: 0 },
  backbtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  themebtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pichip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
});

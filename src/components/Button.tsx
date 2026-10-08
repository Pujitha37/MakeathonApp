import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { AppText } from './AppText';

type Variant = 'primary' | 'soft' | 'ghost';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  sm?: boolean;
  block?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'soft', sm, block, disabled, style }: ButtonProps) {
  const { colors } = useTheme();
  const bg = variant === 'primary' ? colors.indigo : variant === 'soft' ? colors.indigoSoft : 'transparent';
  const fg = variant === 'primary' ? colors.onIndigo : variant === 'soft' ? colors.indigo : colors.ink2;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          paddingVertical: sm ? 8 : 12,
          paddingHorizontal: sm ? 12 : 18,
          borderRadius: sm ? radius.buttonSm : radius.button,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          alignSelf: block ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <AppText type={sm ? 'captionMed' : 'h3'} color={fg} style={block ? { textAlign: 'center' } : undefined}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

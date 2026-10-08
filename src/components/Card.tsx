import React from 'react';
import { View, ViewProps, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

interface CardProps extends ViewProps {
  flat?: boolean; // .card.flat — no shadow, surface-2 background
  onPress?: () => void;
}

export function Card({ flat, onPress, style, children, ...rest }: CardProps) {
  const { colors, shadow } = useTheme();
  const base = [
    styles.base,
    {
      backgroundColor: flat ? colors.surface2 : colors.surface,
      ...(flat ? {} : shadow),
    },
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={base} {...(rest as any)}>
        {children}
      </Pressable>
    );
  }
  return (
    <View style={base} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    padding: space.cardPad,
    marginBottom: space.cardGap,
  },
});

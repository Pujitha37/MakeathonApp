import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { type as typeTokens, tabularNums } from '@/theme/typography';

type TypeToken = keyof typeof typeTokens;

interface AppTextProps extends TextProps {
  type?: TypeToken;
  color?: string; // explicit override; defaults to theme ink
  muted?: boolean; // ink2
  faint?: boolean; // ink3
  num?: boolean; // tabular-nums, for money/amount values
}

export function AppText({ type = 'body', color, muted, faint, num, style, children, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const resolvedColor = color ?? (faint ? colors.ink3 : muted ? colors.ink2 : colors.ink);
  const base: TextStyle = { color: resolvedColor, ...typeTokens[type], ...(num ? tabularNums : null) };
  return (
    <Text style={[base, style]} {...rest}>
      {children}
    </Text>
  );
}

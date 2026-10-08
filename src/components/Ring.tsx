// Ported from the goal progress ring (`.ring`) in finprofile.html.
import React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

export function Ring({ pct, emoji, on, size = 64 }: { pct: number; emoji: string; on: boolean; size?: number }) {
  const { colors } = useTheme();
  const r = 26;
  const C = 2 * Math.PI * r;
  const cx = 32;
  const cy = 32;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.surface2} strokeWidth={7} />
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={on ? colors.sage : colors.marigold}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={`${C * Math.min(1, pct)} ${C}`}
        rotation={-90}
        origin={`${cx},${cy}`}
      />
      <SvgText x={cx} y={cy + 6} fontSize={18} textAnchor="middle">
        {emoji}
      </SvgText>
    </Svg>
  );
}

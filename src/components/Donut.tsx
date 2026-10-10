// Ported from the donut chart in `insightsHTML()` in finprofile.html.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';
import { CAT, CatId } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { fmt } from '@/lib/format';

interface DonutProps {
  cats: [CatId, number][];
  total: number;
  selected: CatId | null;
  onSelect: (c: CatId) => void;
}

export function Donut({ cats, total, selected, onSelect }: DonutProps) {
  const { colors } = useTheme();
  const C = 2 * Math.PI * 80;
  let off = 0;
  const sel = selected && cats.some(([c]) => c === selected) ? selected : null;
  const selValue = sel ? cats.find(([c]) => c === sel)![1] : total;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={220} height={220} viewBox="0 0 220 220">
        <G transform="rotate(-90 110 110)">
          {cats.map(([c, v]) => {
            const len = (v / total) * C;
            const seg = (
              <Circle
                key={c}
                cx={110}
                cy={110}
                r={80}
                fill="none"
                stroke={CAT[c].color}
                strokeWidth={sel === c ? 34 : 26}
                opacity={sel && sel !== c ? 0.35 : 1}
                strokeDasharray={`${Math.max(0, len - 2)} ${C - len + 2}`}
                strokeDashoffset={-off}
                onPress={() => onSelect(c)}
              />
            );
            off += len;
            return seg;
          })}
        </G>
        <SvgText x={110} y={sel ? 96 : 104} fontSize={13} fill={colors.ink2} textAnchor="middle">
          {sel ? `${CAT[sel].emoji} ${CAT[sel].label.split(' ')[0]}` : 'Total'}
        </SvgText>
        <SvgText x={110} y={sel ? 124 : 130} fontSize={26} fontWeight="800" fill={colors.ink} textAnchor="middle">
          {fmt(selValue)}
        </SvgText>
        {sel && (
          <SvgText x={110} y={146} fontSize={12} fill={colors.ink2} textAnchor="middle">
            {Math.round((selValue / total) * 100)}% of spending
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

// Ported from `sparkSVG()` in finprofile.html — the forecast actual/projected/budget chart.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { fmt } from '@/lib/format';
import type { ForecastResult } from '@/lib/forecast';

type OkForecast = Extract<ForecastResult, { ok: true }>;

export function SparkLine({ f, mini }: { f: OkForecast; mini: boolean }) {
  const { colors } = useTheme();
  const W = 340;
  const H = mini ? 90 : 190;
  const P = mini ? 6 : 30;
  const top = Math.max(f.projected, f.budget || 0) * 1.08;
  const x = (d: number) => P + ((d - 1) / (f.dim - 1)) * (W - P * 2);
  const yv = (v: number) => H - P - (v / top) * (H - P * 2);
  const pts = f.series.map((v, i) => `${x(i + 1)},${yv(v)}`).join(' ');
  const lx = x(f.covDay);
  const ly = yv(f.actual);
  const over = !!(f.budget && f.projected > f.budget);
  const overColor = colors.marigold;

  return (
    <View style={{ marginTop: mini ? 8 : 4 }}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {f.budget != null && (
          <Line x1={P} x2={W - P} y1={yv(f.budget)} y2={yv(f.budget)} stroke={colors.coral} strokeWidth={1.5} strokeDasharray="2 4" />
        )}
        {f.budget != null && !mini && (
          <SvgText x={P + 2} y={yv(f.budget) - 6} fontSize={11} fill={colors.coral} fontWeight="700">
            Budget {fmt(f.budget)}
          </SvgText>
        )}
        <Polygon points={`${P},${H - P} ${pts} ${lx},${H - P}`} fill={colors.indigo} opacity={0.1} />
        <Polyline points={pts} fill="none" stroke={colors.indigo} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <Line
          x1={lx}
          y1={ly}
          x2={x(f.dim)}
          y2={yv(f.projected)}
          stroke={over ? overColor : colors.indigo}
          strokeWidth={3}
          strokeDasharray="7 6"
          strokeLinecap="round"
        />
        <Circle cx={lx} cy={ly} r={5} fill={colors.indigo} stroke={colors.surface} strokeWidth={2} />
        <Circle cx={x(f.dim)} cy={yv(f.projected)} r={5} fill={colors.surface} stroke={over ? overColor : colors.indigo} strokeWidth={3} />
        {!mini && (
          <>
            <SvgText x={lx} y={H - 8} textAnchor="middle" fontSize={11} fill={colors.ink2}>
              {f.covDay} Oct
            </SvgText>
            <SvgText x={P} y={H - 8} fontSize={11} fill={colors.ink2}>
              1 Oct
            </SvgText>
            <SvgText x={W - P} y={H - 8} textAnchor="end" fontSize={11} fill={colors.ink2}>
              31 Oct
            </SvgText>
            <SvgText x={x(f.dim)} y={yv(f.projected) - 10} textAnchor="end" fontSize={12} fontWeight="800" fill={colors.ink}>
              {fmt(f.projected)}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

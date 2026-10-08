import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Ellipse, Line, Rect, Circle, G } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

export function Mascot({ size = 58 }: { size?: number }) {
  const { colors, dark } = useTheme();
  const shadowFill = dark ? 'rgba(0,0,0,.4)' : 'rgba(31,37,71,.16)';
  const h = Math.round((size * 82) / 80);

  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [bob]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  return (
    <Animated.View style={bobStyle}>
      <Svg width={size} height={h} viewBox="0 0 80 82">
        <Ellipse cx={40} cy={74} rx={15} ry={4} fill={shadowFill} />
        <G>
          <Line x1={40} y1={21} x2={40} y2={11} stroke={colors.indigo} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={40} cy={8} r={4} fill={colors.marigold} />
          <Rect x={17} y={21} width={46} height={41} rx={18} fill={colors.indigo} />
          <Rect x={23} y={29} width={34} height={23} rx={11} fill="#0E1030" />
          <Circle cx={33} cy={40} r={3.4} fill="#8CF5E0" />
          <Circle cx={47} cy={40} r={3.4} fill="#8CF5E0" />
          <Circle cx={26} cy={47} r={2.2} fill={colors.marigold} opacity={0.55} />
          <Circle cx={54} cy={47} r={2.2} fill={colors.marigold} opacity={0.55} />
          <Rect x={27} y={61} width={9} height={6} rx={3} fill={colors.indigo} />
          <Rect x={44} y={61} width={9} height={6} rx={3} fill={colors.indigo} />
          <Circle cx={15} cy={44} r={4.2} fill={colors.indigo} />
          <Circle cx={65} cy={44} r={4.2} fill={colors.indigo} />
        </G>
      </Svg>
    </Animated.View>
  );
}

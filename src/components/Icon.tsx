// SVG icon set, ported from the `I` object in finprofile.html.
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export type IconName = 'home' | 'list' | 'pie' | 'target' | 'chat' | 'mic' | 'send' | 'back' | 'l' | 'r' | 'down' | 'check' | 'moon' | 'sun' | 'plus';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color = 'currentColor', strokeWidth }: IconProps) {
  const sw = strokeWidth;
  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" stroke={color} strokeWidth={sw ?? 2} strokeLinejoin="round" />
        </Svg>
      );
    case 'list':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M8 6h12M8 12h12M8 18h12" stroke={color} strokeWidth={sw ?? 2} strokeLinecap="round" />
          <Circle cx={4} cy={6} r={1} fill={color} />
          <Circle cx={4} cy={12} r={1} fill={color} />
          <Circle cx={4} cy={18} r={1} fill={color} />
        </Svg>
      );
    case 'pie':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3v9h9a9 9 0 1 1-9-9z" stroke={color} strokeWidth={sw ?? 2} strokeLinejoin="round" />
          <Path d="M15 3.5A9 9 0 0 1 20.5 9H15z" stroke={color} strokeWidth={sw ?? 2} strokeLinejoin="round" />
        </Svg>
      );
    case 'target':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={sw ?? 2} />
          <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={sw ?? 2} />
          <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
      );
    case 'chat':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 5h16v11H9l-5 4z" stroke={color} strokeWidth={sw ?? 2} strokeLinejoin="round" />
        </Svg>
      );
    case 'mic':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 3h6a0 0 0 0 1 0 0v8a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3V3z" stroke={color} strokeWidth={sw ?? 2} strokeLinecap="round" />
          <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={color} strokeWidth={sw ?? 2} strokeLinecap="round" />
        </Svg>
      );
    case 'send':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={sw ?? 2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={sw ?? 2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'l':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={sw ?? 2.4} strokeLinecap="round" />
        </Svg>
      );
    case 'r':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={sw ?? 2.4} strokeLinecap="round" />
        </Svg>
      );
    case 'down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={sw ?? 2.4} strokeLinecap="round" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12.5l4.5 4.5L19 7" stroke={color} strokeWidth={sw ?? 3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'moon':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" stroke={color} strokeWidth={sw ?? 2} strokeLinejoin="round" />
        </Svg>
      );
    case 'sun':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={4.5} stroke={color} strokeWidth={sw ?? 2} />
          <Path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" stroke={color} strokeWidth={sw ?? 2} strokeLinecap="round" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={sw ?? 2.6} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

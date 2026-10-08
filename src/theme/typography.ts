// Typography scale ported from the prototype CSS.
// Font families map to the loaded @expo-google-fonts weights (see app/_layout.tsx).
import { TextStyle } from 'react-native';

// Loaded font family keys (must match useFonts map in app/_layout.tsx)
export const FONT = {
  bricolage500: 'Bricolage_500Medium',
  bricolage700: 'Bricolage_700Bold',
  bricolage800: 'Bricolage_800ExtraBold',
  figtree400: 'Figtree_400Regular',
  figtree500: 'Figtree_500Medium',
  figtree600: 'Figtree_600SemiBold',
  figtree700: 'Figtree_700Bold',
} as const;

// Reusable text style tokens. `num: true` callers add fontVariant tabular-nums at the component.
export const type: Record<string, TextStyle> = {
  displayXl: { fontFamily: FONT.bricolage800, fontSize: 48, lineHeight: 50, letterSpacing: -1.4 },
  displayLg: { fontFamily: FONT.bricolage800, fontSize: 32, letterSpacing: -0.6 },
  displayMd: { fontFamily: FONT.bricolage800, fontSize: 30, letterSpacing: -0.6, lineHeight: 33 },
  titleXl: { fontFamily: FONT.bricolage800, fontSize: 26, letterSpacing: -0.5, lineHeight: 29 },
  titleLg: { fontFamily: FONT.bricolage800, fontSize: 22, letterSpacing: -0.2 },
  numLg: { fontFamily: FONT.bricolage800, fontSize: 28, lineHeight: 32 },
  numMd: { fontFamily: FONT.bricolage800, fontSize: 22 },
  h3: { fontFamily: FONT.figtree700, fontSize: 16 },
  body: { fontFamily: FONT.figtree400, fontSize: 15, lineHeight: 22 },
  bodyMed: { fontFamily: FONT.figtree600, fontSize: 15 },
  sectionTitle: { fontFamily: FONT.figtree700, fontSize: 15 },
  input: { fontFamily: FONT.figtree500, fontSize: 16 },
  label: { fontFamily: FONT.figtree400, fontSize: 14 },
  labelMed: { fontFamily: FONT.figtree600, fontSize: 14 },
  caption: { fontFamily: FONT.figtree400, fontSize: 13 },
  captionMed: { fontFamily: FONT.figtree600, fontSize: 13 },
  captionSm: { fontFamily: FONT.figtree500, fontSize: 12.5 },
  captionSmBold: { fontFamily: FONT.figtree700, fontSize: 12.5 },
  micro: { fontFamily: FONT.figtree700, fontSize: 12 },
  nav: { fontFamily: FONT.figtree600, fontSize: 11.5 },
  tag: { fontFamily: FONT.figtree700, fontSize: 10.5 },
};

export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

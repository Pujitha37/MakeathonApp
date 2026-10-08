import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, Palette, shadow } from './tokens';
import { useStore } from '@/store/useStore';

interface ThemeCtx {
  colors: Palette;
  dark: boolean;
  shadow: typeof shadow;
}

const Ctx = createContext<ThemeCtx>({ colors: light, dark: false, shadow });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const override = useStore((s) => s.theme);
  const isDark = override ? override === 'dark' : system === 'dark';
  const value = useMemo<ThemeCtx>(() => ({ colors: isDark ? dark : light, dark: isDark, shadow }), [isDark]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}

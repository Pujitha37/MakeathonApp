// Ported from `toast()` / `#toast` in finprofile.html.
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

interface ToastOpts {
  label?: string;
  onPress?: () => void;
}

interface ToastApi {
  show: (message: string, undo?: ToastOpts) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<string | null>(null);
  const [undo, setUndo] = useState<ToastOpts | undefined>(undefined);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMsg(null));
  }, [opacity]);

  const show = useCallback(
    (message: string, u?: ToastOpts) => {
      setMsg(message);
      setUndo(u);
      clearTimeout(timer.current);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, 3200);
    },
    [hide, opacity],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {msg && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrap, { bottom: 150 + insets.bottom, opacity }]}
        >
          <View style={[styles.toast, { backgroundColor: colors.ink }]}>
            <AppText type="labelMed" color={colors.paper}>
              {msg}
            </AppText>
            {undo && (
              <Pressable
                onPress={() => {
                  undo.onPress?.();
                  hide();
                }}
              >
                <AppText type="labelMed" color={colors.marigold}>
                  {undo.label ?? 'Undo'}
                </AppText>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  toast: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
});

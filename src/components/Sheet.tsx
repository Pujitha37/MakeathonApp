// Global bottom-sheet host, replacing the prototype's single #sheet + #scrim pair.
// Call useSheet().open(<Content/>) from anywhere to present it; open() replaces any sheet
// already showing (matches the prototype's single-sheet-at-a-time model).
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

interface SheetApi {
  open: (content: React.ReactNode, snapPoints?: (string | number)[]) => void;
  close: () => void;
}

const SheetContext = createContext<SheetApi>({ open: () => {}, close: () => {} });
export const useSheet = () => useContext(SheetContext);

export function SheetProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const ref = useRef<BottomSheet>(null);
  const [content, setContent] = useState<React.ReactNode>(null);
  const [snapPoints, setSnapPoints] = useState<(string | number)[]>(['60%', '92%']);

  const open = useCallback((node: React.ReactNode, points?: (string | number)[]) => {
    setContent(node);
    setSnapPoints(points ?? ['60%', '92%']);
    requestAnimationFrame(() => ref.current?.snapToIndex(0));
  }, []);
  const close = useCallback(() => ref.current?.close(), []);

  const api = useMemo(() => ({ open, close }), [open, close]);

  return (
    <SheetContext.Provider value={api}>
      {children}
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => setContent(null)}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.line, width: 40 }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.45} />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={styles.inner}>{content}</BottomSheetScrollView>
      </BottomSheet>
    </SheetContext.Provider>
  );
}

const styles = StyleSheet.create({
  inner: {
    paddingHorizontal: space.screenX,
    paddingTop: 8,
    paddingBottom: 32,
  },
});

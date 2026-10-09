import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';

import { FONT } from '@/theme/typography';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { SheetProvider } from '@/components/Sheet';
import { ToastProvider } from '@/components/Toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [FONT.bricolage500]: BricolageGrotesque_500Medium,
    [FONT.bricolage700]: BricolageGrotesque_700Bold,
    [FONT.bricolage800]: BricolageGrotesque_800ExtraBold,
    [FONT.figtree400]: Figtree_400Regular,
    [FONT.figtree500]: Figtree_500Medium,
    [FONT.figtree600]: Figtree_600SemiBold,
    [FONT.figtree700]: Figtree_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <BottomSheetModalProvider>
          <ToastProvider>
            <SheetProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="financial" />
                <Stack.Screen name="personal" />
              </Stack>
            </SheetProvider>
          </ToastProvider>
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

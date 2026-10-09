import { Stack } from 'expo-router';

export default function FinancialLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="ask" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="forecast" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="advice" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="fraud-detection" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

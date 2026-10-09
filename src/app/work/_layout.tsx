import { Stack } from 'expo-router';

export default function WorkLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="email" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="calls" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

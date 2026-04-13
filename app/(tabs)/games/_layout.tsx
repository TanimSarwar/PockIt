import { Stack } from 'expo-router';

export default function GamesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="snake" />
      <Stack.Screen name="2048" />
      <Stack.Screen name="memory" />
    </Stack>
  );
}

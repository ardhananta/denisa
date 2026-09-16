import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="homepage" />
      <Stack.Screen name="mchat" />
      <Stack.Screen name="quick-answers" />
      <Stack.Screen name="assessment-result" />
    </Stack>
  );
}

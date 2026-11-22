import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { NotificationsBootstrap } from '@/components/NotificationsBootstrap';
import { useSession } from '@/store/session';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const signedIn = useSession((s) => s.user !== null);
  const hasHydrated = useSession((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated) SplashScreen.hideAsync();
  }, [hasHydrated]);

  // Keep the splash screen up until we know whether someone is signed in.
  if (!hasHydrated) return null;

  return (
    <>
      <StatusBar style="dark" />
      {signedIn && <NotificationsBootstrap />}
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="event/[id]" options={{ title: '', headerBackTitle: 'Back' }} />
          <Stack.Screen
            name="post/new"
            options={{ presentation: 'modal', title: 'Post free food' }}
          />
          <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

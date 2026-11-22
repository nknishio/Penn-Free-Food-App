import { Tabs } from 'expo-router/js-tabs';
import { useRouter } from 'expo-router';
import type { ColorValue } from 'react-native';

import { HeaderButton } from '@/components/HeaderButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/theme';

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Icon name={name} color={color} size={size} />;
  };
}

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerTitleAlign: 'center',
        headerTitleStyle: { color: colors.primary, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.background },
        headerLeft: () => (
          <HeaderButton
            icon="add"
            accessibilityLabel="Post free food"
            onPress={() => router.push('/post/new')}
          />
        ),
        headerRight: () => (
          <HeaderButton
            icon="bell"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/notifications')}
          />
        ),
      }}>
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: tabIcon('map') }} />
      <Tabs.Screen name="index" options={{ title: 'Feed', tabBarIcon: tabIcon('feed') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}

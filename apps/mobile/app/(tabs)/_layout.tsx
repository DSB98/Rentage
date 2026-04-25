import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarLabel: 'Search' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarLabel: 'Saved' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarLabel: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
    </Tabs>
  );
}

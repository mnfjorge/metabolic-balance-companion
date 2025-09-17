import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getActiveMealPlan } from '../../services/storage';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      const plan = await getActiveMealPlan();
      if (!plan) {
        router.replace('/welcome');
      }
    })();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="suggestions"
        options={{
          title: 'Meals',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="fork.knife" color={color} />,
        }}
      />
      <Tabs.Screen
        name="grocery-builder"
        options={{
          title: 'Groceries',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

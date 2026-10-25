import { Stack } from 'expo-router';
import React from 'react';
import { useAppSelector } from '@/store';

export default function AuthLayout() {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
        },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}

import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from '@/store';
import { restoreSessionThunk } from '@/features/auth/slice';
import { setDarkMode, setThemePreference } from '@/store/uiSlice';
import { loadThemePreference } from '@/lib/themePreference';
import { ToastProvider } from '@/components/ui/Toast';

SplashScreen.preventAutoHideAsync();

// Tính isDarkMode từ lựa chọn của người dùng + cài đặt Sáng/Tối của hệ thống
function ThemeSync() {
  const dispatch = useAppDispatch();
  const systemScheme = useColorScheme();
  const themePreference = useAppSelector((state) => state.ui.themePreference);
  const resolvedDark =
    themePreference === 'system' ? systemScheme === 'dark' : themePreference === 'dark';

  // Đồng bộ phần native (Alert, nền cửa sổ, theme DayNight) với lựa chọn trong app.
  // 'unspecified' = trả quyền quyết định về cho cài đặt hệ thống.
  useEffect(() => {
    Appearance.setColorScheme(themePreference === 'system' ? 'unspecified' : themePreference);
  }, [themePreference]);

  useEffect(() => {
    dispatch(setDarkMode(resolvedDark));
  }, [dispatch, resolvedDark]);

  // Một StatusBar duy nhất cho toàn app: icon sáng trên nền tối và ngược lại.
  // (Android edge-to-edge bỏ qua backgroundColor/translucent → nền do view gốc tô)
  return <StatusBar style={resolvedDark ? 'light' : 'dark'} />;
}

function RootNavigator() {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  useEffect(() => {
    // Khôi phục phiên đăng nhập (SecureStore) và cài đặt giao diện trước khi ẩn splash
    Promise.all([
      dispatch(restoreSessionThunk()),
      loadThemePreference().then((preference) => {
        dispatch(setThemePreference(preference));
      }),
    ]).finally(() => {
      SplashScreen.hideAsync();
    });
  }, [dispatch]);

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <ThemeSync />
      <ToastProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            // Trang bị che phía dưới stack tạm dừng vẽ lại cho tới khi quay về
            freezeOnBlur: true,
            contentStyle: {
              backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
            },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="assistant"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          {/* dangerouslySingular: mỗi món chỉ có 1 trang trong stack, mở lại món đang có → quay về trang đó */}
          <Stack.Screen name="recipe/[id]" dangerouslySingular={(_name, params) => String(params?.id ?? '')} options={{ headerShown: false }} />
          <Stack.Screen name="recipe/new" dangerouslySingular options={{ headerShown: false }} />
          <Stack.Screen name="recipe/[id]/edit" dangerouslySingular={(_name, params) => String(params?.id ?? '')} options={{ headerShown: false }} />
          <Stack.Screen name="cooking/[id]" dangerouslySingular={(_name, params) => String(params?.id ?? '')} options={{ headerShown: false }} />
        </Stack>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}

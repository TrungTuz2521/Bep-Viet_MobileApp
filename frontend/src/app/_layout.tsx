import { DarkTheme, DefaultTheme, ThemeProvider, Stack, usePathname } from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { AppState, Appearance, Keyboard } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from '@/store';
import { isSessionRefreshDue, restoreSessionThunk, verifySessionThunk } from '@/features/auth/slice';
import { setDarkMode, setThemePreference } from '@/store/uiSlice';
import { loadThemePreference } from '@/lib/themePreference';
import { ToastProvider } from '@/components/ui/Toast';

SplashScreen.preventAutoHideAsync();

// Tính isDarkMode từ lựa chọn Sáng / Tối của người dùng
function ThemeSync() {
  const dispatch = useAppDispatch();
  const themePreference = useAppSelector((state) => state.ui.themePreference);
  const resolvedDark = themePreference === 'dark';

  // Đồng bộ phần native (Alert, nền cửa sổ, theme DayNight) với lựa chọn trong app
  useEffect(() => {
    Appearance.setColorScheme(themePreference);
  }, [themePreference]);

  useEffect(() => {
    dispatch(setDarkMode(resolvedDark));
  }, [dispatch, resolvedDark]);

  // Một StatusBar duy nhất cho toàn app: icon sáng trên nền tối và ngược lại.
  // (Android edge-to-edge bỏ qua backgroundColor/translucent → nền do view gốc tô)
  return <StatusBar style={resolvedDark ? 'light' : 'dark'} />;
}

/**
 * Ẩn bàn phím mỗi khi đổi trang / đổi tab. Không ẩn thì bàn phím của ô đang nhập ở trang trước
 * vẫn mở đè lên trang mới. Component riêng, không vẽ gì → chỉ nó render lại khi đổi đường dẫn.
 */
function KeyboardDismissOnNavigate() {
  const pathname = usePathname();
  useEffect(() => {
    Keyboard.dismiss();
  }, [pathname]);
  return null;
}

/**
 * App quay lại từ nền (người dùng hay để app chạy ngầm nhiều ngày) → gia hạn phiên nếu
 * lần gần nhất đã quá 12 giờ. Đọc token lúc cần (store.getState) nên không gây render lại.
 */
function SessionKeeper() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const token = store.getState().auth.token;
      if (next === 'active' && token && isSessionRefreshDue()) {
        dispatch(verifySessionThunk(token));
      }
    });
    return () => sub.remove();
  }, [dispatch]);
  return null;
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
      <KeyboardDismissOnNavigate />
      <SessionKeeper />
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import type { ThemePreference } from '@/store/uiSlice';

const THEME_KEY = '@food_app_theme_preference';

// Chưa từng chọn (hoặc giá trị cũ 'system') → lấy theo cài đặt Sáng/Tối hiện tại của điện thoại
const fromDevice = (): ThemePreference => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

export const loadThemePreference = async (): Promise<ThemePreference> => {
  try {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : fromDevice();
  } catch (e) {
    console.warn('Lỗi đọc cài đặt giao diện:', e);
    return fromDevice();
  }
};

export const saveThemePreference = async (preference: ThemePreference): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_KEY, preference);
  } catch (e) {
    console.warn('Lỗi lưu cài đặt giao diện:', e);
  }
};

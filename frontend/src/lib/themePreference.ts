import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePreference } from '@/store/uiSlice';

const THEME_KEY = '@food_app_theme_preference';
const VALID: ThemePreference[] = ['system', 'light', 'dark'];

// Đọc lựa chọn giao diện đã lưu (mặc định: theo hệ thống)
export const loadThemePreference = async (): Promise<ThemePreference> => {
  try {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    return VALID.includes(stored as ThemePreference) ? (stored as ThemePreference) : 'system';
  } catch (e) {
    console.warn('Lỗi đọc cài đặt giao diện:', e);
    return 'system';
  }
};

export const saveThemePreference = async (preference: ThemePreference): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_KEY, preference);
  } catch (e) {
    console.warn('Lỗi lưu cài đặt giao diện:', e);
  }
};

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Appearance } from 'react-native';
import { PendingAction } from '@/features/auth/types';

// 'system' = theo cài đặt Sáng/Tối của điện thoại
export type ThemePreference = 'system' | 'light' | 'dark';

interface UIState {
  isDarkMode: boolean;
  themePreference: ThemePreference;
  pendingAction: PendingAction | null;
  returnTo: string | null;
}

const initialState: UIState = {
  // Khởi tạo theo hệ thống để không bị nháy trắng khi mở app ở chế độ tối
  isDarkMode: Appearance.getColorScheme() === 'dark',
  themePreference: 'system',
  pendingAction: null,
  returnTo: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Lưu hành động chờ thực thi khi bị chặn bởi Action Gate
    setPendingAction: (
      state,
      action: PayloadAction<{ action: PendingAction; returnTo: string }>
    ) => {
      state.pendingAction = action.payload.action;
      state.returnTo = action.payload.returnTo;
    },
    // Xóa hành động chờ sau khi đã xử lý xong
    clearPendingAction: (state) => {
      state.pendingAction = null;
      state.returnTo = null;
    },
    // Chuyển đổi Dark Mode
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    // Lựa chọn giao diện của người dùng (isDarkMode được tính lại ở ThemeSync)
    setThemePreference: (state, action: PayloadAction<ThemePreference>) => {
      state.themePreference = action.payload;
    },
  },
});

export const {
  setPendingAction,
  clearPendingAction,
  toggleDarkMode,
  setDarkMode,
  setThemePreference,
} = uiSlice.actions;
export default uiSlice.reducer;

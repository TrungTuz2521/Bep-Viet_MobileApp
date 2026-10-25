import { useAppSelector } from '@/store';

/**
 * Bảng màu dùng chung (light / dark cùng bộ key).
 * Giá trị light giữ ĐÚNG màu cũ của app → giao diện sáng không đổi;
 * dark dùng nền trong suốt nhẹ để các ô nhấn (banner, badge, hộp lỗi) không bị "chói" trên nền tối.
 */
export const lightColors = {
  // Màu chính: nền nút chính luôn dùng `primary`; `primaryPressed` cho trạng thái nhấn / viền
  primary: '#F97316',
  primaryPressed: '#EA580C',
  onPrimary: '#FFFFFF',

  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',

  // Ô nhấn màu cam (badge, banner thông tin)
  primaryTint: '#FFF7ED',
  primaryTintStrong: '#FFEDD5',
  primaryTintBorder: '#FED7AA',
  primaryText: '#EA580C',
  primaryTintText: '#C2410C',
  primaryTintTextStrong: '#9A3412',

  // Thành công / an toàn (banner lọc dị ứng, badge thành viên)
  successTint: '#ECFDF5',
  successTintBorder: '#A7F3D0',
  successText: '#065F46',
  successAccent: '#059669',

  // Lỗi / nguy hiểm (hộp lỗi, cảnh báo xóa, số ngày còn lại)
  dangerTint: '#FEE2E2',
  dangerTintBorder: '#FCA5A5',
  dangerTextStrong: '#991B1B',
  dangerText: '#B91C1C',
  dangerAccent: '#EF4444',

  // Cảnh báo nhẹ (bản nháp, chính sách thùng rác, thời gian bước)
  warningTint: '#FEF3C7',
  warningTintBorder: '#FDE68A',
  warningTextStrong: '#92400E',
  warningText: '#B45309',
  warningAccent: '#D97706',
};

export type ThemeColors = typeof lightColors;

export const darkColors: ThemeColors = {
  primary: '#F97316',
  primaryPressed: '#EA580C',
  onPrimary: '#FFFFFF',

  background: '#121212',
  surface: '#1E1E1E',
  surfaceMuted: '#27272A',
  border: '#2D2D2D',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',

  primaryTint: 'rgba(249, 115, 22, 0.14)',
  primaryTintStrong: 'rgba(249, 115, 22, 0.22)',
  primaryTintBorder: 'rgba(249, 115, 22, 0.32)',
  primaryText: '#FB923C',
  primaryTintText: '#FDBA74',
  primaryTintTextStrong: '#FED7AA',

  successTint: 'rgba(16, 185, 129, 0.14)',
  successTintBorder: 'rgba(16, 185, 129, 0.32)',
  successText: '#A7F3D0',
  successAccent: '#34D399',

  dangerTint: 'rgba(239, 68, 68, 0.14)',
  dangerTintBorder: 'rgba(239, 68, 68, 0.35)',
  dangerTextStrong: '#FECACA',
  dangerText: '#FCA5A5',
  dangerAccent: '#F87171',

  warningTint: 'rgba(245, 158, 11, 0.14)',
  warningTintBorder: 'rgba(245, 158, 11, 0.32)',
  warningTextStrong: '#FDE68A',
  warningText: '#FCD34D',
  warningAccent: '#FBBF24',
};

/** Màu thương hiệu (giống nhau ở 2 chế độ) — dùng được trong StyleSheet tĩnh */
export const brand = {
  primary: lightColors.primary,
  primaryPressed: lightColors.primaryPressed,
};

/** Bảng màu theo chế độ sáng/tối hiện tại của app (state.ui.isDarkMode) */
export const useThemeColors = (): ThemeColors => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  return isDarkMode ? darkColors : lightColors;
};

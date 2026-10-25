import { Platform, ViewStyle } from 'react-native';

/**
 * Bảng mức bóng đổ dùng chung cho toàn app:
 *  1 = thẻ, chip, ô nhập · 2 = nút chính · 6 = nút nổi (FAB) · 8 = lớp nổi (sheet, dialog, toast, thanh cố định)
 * iOS dùng shadow*; Android CHỈ dùng elevation (không dùng shadowColor màu → mỗi hãng vẽ một kiểu, loang lổ).
 */
export type ShadowLevel = 1 | 2 | 6 | 8;

const IOS_SHADOWS: Record<ShadowLevel, { height: number; opacity: number; radius: number }> = {
  1: { height: 1, opacity: 0.05, radius: 4 },
  2: { height: 2, opacity: 0.1, radius: 6 },
  6: { height: 4, opacity: 0.18, radius: 10 },
  8: { height: 6, opacity: 0.16, radius: 14 },
};

/**
 * @param level Mức bóng theo bảng trên
 * @param direction 'up' cho thanh cố định ở đáy màn hình (bóng hắt lên trên, chỉ iOS)
 */
export function shadow(level: ShadowLevel, direction: 'down' | 'up' = 'down'): ViewStyle {
  const s = IOS_SHADOWS[level];
  return Platform.select<ViewStyle>({
    android: { elevation: level },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: direction === 'up' ? -s.height : s.height },
      shadowOpacity: s.opacity,
      shadowRadius: s.radius,
    },
  });
}

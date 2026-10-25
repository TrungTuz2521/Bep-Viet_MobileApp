import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

// Giới hạn phóng to chữ theo cài đặt cỡ chữ hệ thống (Android/iOS) cho TOÀN app:
// người dùng vẫn được phóng to tới 120% nhưng bố cục không bị vỡ.
// Lưu ý: React 19 bỏ qua `Text.defaultProps` với function component → phải bọc component như dưới.
export const MAX_FONT_SCALE = 1.2;

/** Thay cho `Text` của react-native: mặc định maxFontSizeMultiplier = 1.2 (vẫn ghi đè được qua props) */
export const Text = React.forwardRef<React.ComponentRef<typeof RNText>, TextProps>((props, ref) => (
  <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} ref={ref} />
));
Text.displayName = 'AppText';

/** Thay cho `TextInput` của react-native: mặc định maxFontSizeMultiplier = 1.2 */
export const TextInput = React.forwardRef<React.ComponentRef<typeof RNTextInput>, TextInputProps>((props, ref) => (
  <RNTextInput maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} ref={ref} />
));
TextInput.displayName = 'AppTextInput';

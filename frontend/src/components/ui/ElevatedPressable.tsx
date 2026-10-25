import React, { useState } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { shadow, ShadowLevel } from '@/lib/shadows';

// Thuộc tính thuộc về LỚP NGOÀI (giữ bóng): vị trí, kích thước, nền, viền, hiệu ứng nhấn
const OUTER_KEYS = new Set([
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf',
  'width', 'height', 'minWidth', 'maxWidth', 'maxHeight', 'aspectRatio',
  'position', 'top', 'left', 'right', 'bottom', 'start', 'end', 'zIndex',
  'backgroundColor', 'opacity', 'transform',
]);
// Bóng do helper shadow() đảm nhận → bỏ khai báo bóng rời rạc nếu còn sót
const DROPPED_KEYS = new Set(['elevation', 'shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius', 'overflow']);

type StyleInput = StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);

export interface ElevatedPressableProps extends Omit<PressableProps, 'style'> {
  /** Mức bóng theo bảng trong lib/shadows.ts */
  level: ShadowLevel;
  style?: StyleInput;
}

/**
 * Pressable có bóng đổ, dùng thay cho <Pressable> khi cần cả elevation + ripple + bo góc.
 * Android không vẽ đúng khi elevation, overflow: 'hidden' và android_ripple nằm chung 1 view
 * (bóng bị cắt / mất), nên tách 2 lớp:
 *  - View ngoài: bóng, nền, viền, bo góc, kích thước, margin
 *  - Pressable trong: ripple, overflow: 'hidden', cùng bo góc, padding & bố cục nội dung
 */
export function ElevatedPressable({ level, style, onPressIn, onPressOut, children, ...rest }: ElevatedPressableProps) {
  const [pressed, setPressed] = useState(false);
  const resolved = typeof style === 'function' ? style({ pressed, hovered: false }) : style;
  const flat = (StyleSheet.flatten(resolved) || {}) as Record<string, unknown>;

  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  Object.entries(flat).forEach(([key, value]) => {
    if (DROPPED_KEYS.has(key)) return;
    if (OUTER_KEYS.has(key) || key.startsWith('margin') || key.startsWith('border')) outer[key] = value;
    else inner[key] = value;
  });

  // Lớp trong bo góc giống lớp ngoài để ripple không tràn ra ngoài góc
  const radius = {
    borderRadius: flat.borderRadius as number | undefined,
    borderTopLeftRadius: flat.borderTopLeftRadius as number | undefined,
    borderTopRightRadius: flat.borderTopRightRadius as number | undefined,
    borderBottomLeftRadius: flat.borderBottomLeftRadius as number | undefined,
    borderBottomRightRadius: flat.borderBottomRightRadius as number | undefined,
  };

  return (
    <View style={[outer as ViewStyle, shadow(level)]}>
      <Pressable
        {...rest}
        onPressIn={(e: GestureResponderEvent) => {
          setPressed(true);
          onPressIn?.(e);
        }}
        onPressOut={(e: GestureResponderEvent) => {
          setPressed(false);
          onPressOut?.(e);
        }}
        style={[inner as ViewStyle, radius, styles.inner]}>
        {children}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    overflow: 'hidden',
    flexGrow: 1,
  },
});

export default ElevatedPressable;

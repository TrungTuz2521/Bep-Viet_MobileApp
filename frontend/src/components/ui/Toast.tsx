import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';
import { shadow } from '@/lib/shadows';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  /** Nút hành động phụ, vd: "Hoàn tác" */
  actionLabel?: string;
  onAction?: () => void;
  /** Thời gian hiển thị (ms) */
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Đẩy toast lên trên tab bar / thanh hành động cố định ở đáy
const BOTTOM_OFFSET = 96;

const ICONS: Record<ToastType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { name: 'checkmark-circle', color: '#34D399' },
  error: { name: 'alert-circle', color: '#F87171' },
  info: { name: 'information-circle', color: '#FDBA74' },
};

/**
 * Thông báo nhẹ tự ẩn (Snackbar) thay cho Alert chặn thao tác.
 * Dùng: const { showToast } = useToast(); showToast({ message: 'Đã lưu', type: 'success' });
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const hideToast = useCallback(() => {
    clearTimer();
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [progress]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      clearTimer();
      setToast(options);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      hideTimer.current = setTimeout(
        hideToast,
        options.duration ?? (options.actionLabel ? 4000 : 2500)
      );
    },
    [progress, hideToast]
  );

  useEffect(() => clearTimer, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const icon = ICONS[toast?.type ?? 'info'];

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrapper,
            {
              bottom: insets.bottom + BOTTOM_OFFSET,
              opacity: progress,
              transform: [
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ],
            },
          ]}>
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              {
                backgroundColor: isDarkMode ? '#27272A' : '#1F2937',
                borderColor: isDarkMode ? '#3F3F46' : 'transparent',
              },
            ]}>
            <Ionicons name={icon.name} size={20} color={icon.color} />
            <Text style={styles.message} numberOfLines={3}>
              {toast.message}
            </Text>
            {toast.actionLabel && toast.onAction ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={toast.actionLabel}
                hitSlop={6}
                onPress={() => {
                  toast.onAction?.();
                  hideToast();
                }}
                style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
                <Text style={styles.actionText}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 480,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    ...shadow(8),
  },
  message: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    paddingVertical: 6,
  },
  actionBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  actionText: {
    color: '#FDBA74',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});

export default ToastProvider;

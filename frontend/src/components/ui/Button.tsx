import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useAppSelector } from '@/store';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#FDBA74' : '#F97316',
        };
      case 'secondary':
        return {
          backgroundColor: isDarkMode ? '#2D2D2D' : '#F3F4F6',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: disabled ? '#CBD5E1' : '#F97316',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#FCA5A5' : '#EF4444',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return { color: '#FFFFFF' };
      case 'outline':
        return { color: disabled ? '#94A3B8' : '#EA580C' };
      case 'secondary':
        return { color: isDarkMode ? '#F3F4F6' : '#1F2937' };
      case 'ghost':
        return { color: '#F97316' };
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 44; // Tối thiểu 44px theo quy chuẩn touch target
      case 'lg':
        return 54;
      default:
        return 48;
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { minHeight: getHeight() },
        getContainerStyle(),
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#F97316' : '#FFFFFF'}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              size === 'sm' && styles.textSm,
              size === 'lg' && styles.textLg,
              getTextStyle(),
              textStyle,
            ]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minWidth: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 13,
  },
  textLg: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Button;

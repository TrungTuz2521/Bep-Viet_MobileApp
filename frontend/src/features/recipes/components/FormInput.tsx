import React from 'react';
import { StyleSheet, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { useThemeColors } from '@/lib/theme';
import { lineHeightFor } from '@/lib/typography';

export interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Ô nhập của form công thức: nhãn + viền đỏ + dòng lỗi ngay dưới ô, màu theo dark mode */
export const FormInput = React.forwardRef<React.ComponentRef<typeof TextInput>, FormInputProps>(
  ({ label, error, containerStyle, style, multiline, ...props }, ref) => {
    const colors = useThemeColors();
    return (
      <View style={[styles.group, containerStyle]}>
        {label ? <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSecondary}
          multiline={multiline}
          style={[
            styles.input,
            multiline && styles.textArea,
            {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: error ? colors.dangerAccent : colors.border,
            },
            style,
          ]}
          {...props}
        />
        {error ? <Text style={[styles.error, { color: colors.dangerAccent }]}>{error}</Text> : null}
      </View>
    );
  }
);
FormInput.displayName = 'FormInput';

const styles = StyleSheet.create({
  group: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    fontWeight: '600',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
  },
});

export default FormInput;

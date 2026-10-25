import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useThemeColors } from '@/lib/theme';
import { lineHeightFor } from '@/lib/typography';
import type { TastePreferences } from '@/types/api';
import { TASTE_ROWS } from '../constants';

interface TastePickerProps {
  value: TastePreferences;
  onChange: (next: TastePreferences) => void;
}

/**
 * Chọn khẩu vị theo mức cho từng vị (cay / mặn / ngọt / dầu mỡ).
 * Mỗi hàng chọn tối đa 1 mức; chạm lại mức đang chọn để bỏ chọn ("không đặt").
 */
export function TastePicker({ value, onChange }: TastePickerProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {TASTE_ROWS.map((row) => {
        const selected = value[row.key];
        const hint = row.options.find((o) => o.value === selected)?.hint;
        return (
          <View key={row.key} style={styles.row}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
              {row.emoji}  {row.title}
            </Text>
            <View accessibilityRole="radiogroup" style={[styles.segment, { backgroundColor: colors.surfaceMuted }]}>
              {row.options.map((opt) => {
                const isOn = selected === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isOn }}
                    accessibilityLabel={`${row.title}: ${opt.label}`}
                    onPress={() => onChange({ ...value, [row.key]: isOn ? null : opt.value } as TastePreferences)}
                    style={({ pressed }) => [
                      styles.option,
                      isOn && { backgroundColor: colors.primary },
                      pressed && !isOn && styles.pressed,
                    ]}>
                    <Text
                      numberOfLines={2}
                      style={[styles.optionText, { color: isOn ? colors.onPrimary : colors.textSecondary }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {hint ? <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  row: {
    gap: 6,
  },
  rowTitle: {
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    fontWeight: '700',
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  option: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 9,
  },
  optionText: {
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
  },
  pressed: {
    opacity: 0.7,
  },
});

export default TastePicker;

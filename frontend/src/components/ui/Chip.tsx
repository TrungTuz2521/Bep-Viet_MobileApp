import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useAppSelector } from '@/store';
import { brand } from '@/lib/theme';
import { emojiText, lineHeightFor } from '@/lib/typography';

// Emoji đứng đầu nhãn (vd "⏱ < 15 phút", "🥗 Món Chay"): ký tự BMP hoặc cặp surrogate, kèm biến thể FE0F
const LEADING_EMOJI_RE = /^((?:[←-⯿]|[\uD83C-\uD83E][\uDC00-\uDFFF])️?)\s+([\s\S]+)$/;

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  isAllergy?: boolean; // Hiển thị màu đỏ dị ứng đặc thù
  icon?: React.ReactNode;
  onRemove?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  isAllergy = false,
  icon,
  onRemove,
}) => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // Tách emoji ra Text riêng có kích thước cố định → chip có emoji cao bằng chip không có emoji
  const emojiMatch = icon ? null : label.match(LEADING_EMOJI_RE);
  const emoji = emojiMatch?.[1];
  const textLabel = emojiMatch ? emojiMatch[2] : label;

  const getBackgroundColor = () => {
    if (isAllergy) {
      return selected ? '#EF4444' : isDarkMode ? '#3B1818' : '#FEE2E2';
    }
    if (selected) {
      return brand.primary;
    }
    return isDarkMode ? '#27272A' : '#F3F4F6';
  };

  const getTextColor = () => {
    if (isAllergy) {
      return selected ? '#FFFFFF' : '#EF4444';
    }
    if (selected) {
      return '#FFFFFF';
    }
    return isDarkMode ? '#E4E4E7' : '#374151';
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: getBackgroundColor() },
        pressed && styles.pressed,
      ]}>
      {icon}
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.text, { color: getTextColor() }]}>{textLabel}</Text>
      {onRemove && (
        <Pressable
          hitSlop={8}
          onPress={onRemove}
          style={styles.removeBtn}
          accessibilityLabel={`Xóa ${label}`}>
          <Text style={[styles.removeText, { color: getTextColor() }]}>×</Text>
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 44, // Chuẩn touch target
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 8,
    marginBottom: 8,
    marginTop: 5,
    gap: 6,
  },
  pressed: {
    opacity: 0.8,
  },
  emoji: emojiText(15),
  text: {
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    fontWeight: '500',
  },
  removeBtn: {
    marginLeft: 4,
    padding: 2,
  },
  removeText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 18,
  },
});

export default Chip;

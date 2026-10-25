import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/AppText';
import { useAppSelector } from '@/store';
import useRequireAuth from '@/hooks/useRequireAuth';
import Button from '@/components/ui/Button';
import { shadow } from '@/lib/shadows';
import { useThemeColors } from '@/lib/theme';
import { lineHeightFor } from '@/lib/typography';

export interface StickyActionBarProps {
  recipeId: number | string;
  recipeName: string;
  isSaved?: boolean;
  isOwner?: boolean;
  onBookmarkToggle: () => void;
  onStartCooking: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface ToolButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  onPress: () => void;
  accessibilityLabel: string;
}

/** Nút công cụ nhỏ có icon + chữ (Sửa / Lưu / Xóa) — cùng kích thước, chia đều 1 hàng */
function ToolButton({ icon, label, color, backgroundColor, borderColor, onPress, accessibilityLabel }: ToolButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.toolBtn, { backgroundColor, borderColor }, pressed && styles.pressed]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text numberOfLines={1} style={[styles.toolText, { color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  recipeId,
  recipeName,
  isSaved = false,
  isOwner = false,
  onBookmarkToggle,
  onStartCooking,
  onEdit,
  onDelete,
}) => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const colors = useThemeColors();
  const { requireAuth } = useRequireAuth();
  // Chừa đúng chiều cao home indicator / gesture bar của từng máy
  const insets = useSafeAreaInsets();

  const handleBookmark = () => {
    // Qua Action Gate
    requireAuth(() => {
      onBookmarkToggle();
    }, `/recipe/${recipeId}`);
  };

  const handleCooking = () => {
    // Qua Action Gate
    requireAuth(() => {
      onStartCooking();
    }, `/recipe/${recipeId}`);
  };

  const showOwnerTools = isOwner && onEdit && onDelete;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: isDarkMode ? '#18181B' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#27272A' : '#E5E7EB',
          paddingBottom: Math.max(insets.bottom, 14),
        },
      ]}>
      {showOwnerTools ? (
        <>
          {/* Món "Của tôi": hàng công cụ Sửa · Lưu · Xóa, bên dưới là nút Vào bếp rộng hết hàng */}
          <View style={styles.toolRow}>
            <ToolButton
              icon="create-outline"
              label="Sửa"
              color={colors.primaryText}
              backgroundColor={colors.primaryTint}
              borderColor={colors.primaryTintBorder}
              onPress={onEdit}
              accessibilityLabel={`Sửa công thức ${recipeName}`}
            />
            <ToolButton
              icon={isSaved ? 'bookmark' : 'bookmark-outline'}
              label={isSaved ? 'Đã lưu' : 'Lưu'}
              color={colors.primaryText}
              backgroundColor={colors.primaryTint}
              borderColor={colors.primaryTintBorder}
              onPress={handleBookmark}
              accessibilityLabel={isSaved ? 'Bỏ lưu công thức' : 'Lưu công thức'}
            />
            <ToolButton
              icon="trash-outline"
              label="Xóa"
              color={colors.dangerText}
              backgroundColor={colors.dangerTint}
              borderColor={colors.dangerTintBorder}
              onPress={onDelete}
              accessibilityLabel={`Xóa công thức ${recipeName}`}
            />
          </View>
          <Button
            title="Vào Bếp Ngay 🍳"
            onPress={handleCooking}
            variant="primary"
            size="lg"
            accessibilityLabel="Bắt đầu chế độ nấu ăn"
            style={styles.fullWidth}
          />
        </>
      ) : (
        <View style={styles.row}>
          {/* Nút Lưu / Bỏ lưu */}
          <Button
            title={isSaved ? 'Đã Lưu' : 'Lưu'}
            icon={
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isSaved ? '#FFFFFF' : '#EA580C'}
              />
            }
            onPress={handleBookmark}
            variant={isSaved ? 'secondary' : 'outline'}
            accessibilityLabel={isSaved ? 'Bỏ lưu công thức' : 'Lưu công thức'}
            style={styles.saveBtn}
          />

          {/* Nút Vào bếp (Cooking mode) */}
          <Button
            title="Vào Bếp Ngay 🍳"
            onPress={handleCooking}
            variant="primary"
            size="lg"
            accessibilityLabel="Bắt đầu chế độ nấu ăn"
            style={styles.cookBtn}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
    ...shadow(8, 'up'),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toolBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  toolText: {
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
  fullWidth: {
    width: '100%',
  },
  saveBtn: {
    minWidth: 100,
    flex: 0.35,
  },
  cookBtn: {
    flex: 0.65,
  },
});

export default StickyActionBar;

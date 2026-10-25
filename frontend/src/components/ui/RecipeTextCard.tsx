import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '@/types/api';
import { useAppSelector } from '@/store';
import { usePrefetch } from '@/store/apiSlice';
import { RecipeThumbnail } from './RecipeThumbnail';
import { shadow } from '@/lib/shadows';
import { useThemeColors } from '@/lib/theme';
import { recipeTasteBadges } from '@/features/preferences/constants';

export interface RecipeTextCardProps {
  recipe: Recipe;
  // Nhận lại chính recipe để màn cha truyền thẳng handler ổn định (không cần arrow function mỗi item)
  onPress: (recipe: Recipe) => void;
  onBookmarkPress?: (recipe: Recipe) => void;
  isSaved?: boolean;
}

const getDifficultyInfo = (diff: string | undefined, isDarkMode: boolean) => {
  switch (diff) {
    case 'medium':
      return { label: 'Vừa', bg: isDarkMode ? '#78350F' : '#FFFBEB', text: isDarkMode ? '#FCD34D' : '#D97706' };
    case 'hard':
      return { label: 'Khó', bg: isDarkMode ? '#7F1D1D' : '#FEF2F2', text: isDarkMode ? '#FCA5A5' : '#DC2626' };
    case 'easy':
    default:
      return { label: 'Dễ', bg: isDarkMode ? '#064E3B' : '#ECFDF5', text: isDarkMode ? '#6EE7B7' : '#059669' };
  }
};

const RecipeTextCardComponent: React.FC<RecipeTextCardProps> = ({
  recipe,
  onPress,
  onBookmarkPress,
  isSaved = false,
}) => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const colors = useThemeColors();
  const tasteBadges = recipeTasteBadges(recipe.taste);
  // Màu nhãn vị theo dark mode (lib/theme.ts)
  const tasteColors: Record<string, { bg: string; text: string }> = {
    spicy: { bg: colors.dangerTint, text: colors.dangerText },
    salty: { bg: colors.primaryTint, text: colors.primaryTintText },
    sweet: { bg: colors.warningTint, text: colors.warningText },
    fat: { bg: colors.surfaceMuted, text: colors.textSecondary },
  };
  // Tải trước chi tiết món ngay khi ngón tay chạm vào thẻ (trước khi nhả tay ~100-300ms)
  // → trang chi tiết thường có dữ liệu sẵn khi mở ra
  const prefetchRecipe = usePrefetch('getRecipeDetails');

  // Màn cha đã tự kiểm tra đăng nhập (requireAuth) trước khi lưu.
  // Không gọi useRequireAuth ở đây: hook đó theo dõi pathname nên mọi thẻ
  // sẽ render lại mỗi lần chuyển màn.
  const handleBookmark = (e: any) => {
    e.stopPropagation?.();
    onBookmarkPress?.(recipe);
  };

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const diffInfo = getDifficultyInfo(recipe.difficulty, isDarkMode);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem món ${recipe.name}`}
      onPress={() => onPress(recipe)}
      onPressIn={() => prefetchRecipe(recipe.id, { ifOlderThan: 60 })}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
        },
        pressed && styles.pressed,
      ]}>
      {/* Ảnh món; chưa có ảnh → ảnh mặc định theo loại món */}
      <View style={styles.thumbSlot}>
        <RecipeThumbnail
          name={recipe.name}
          imageUrl={recipe.image_url}
          categoryName={recipe.category?.name ?? (recipe as { category_name?: string }).category_name}
          isDarkMode={isDarkMode}
        />
      </View>

      {/* Nội dung thông tin món ăn */}
      <View style={styles.content}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            { color: isDarkMode ? '#F9FAFB' : '#111827' },
          ]}>
          {recipe.name}
        </Text>

        {/* Hàng metadata: Điểm phổ biến, Độ khó, Khẩu phần, Thời gian, Trạng thái */}
        <View style={styles.metaRow}>
          {recipe.popularity_score !== undefined && recipe.popularity_score !== null && (
            <View style={[styles.popularityBadge, { backgroundColor: isDarkMode ? '#3B1A04' : '#FFF7ED' }]}>
              <Ionicons name="flame" size={12} color="#F97316" />
              <Text style={styles.popularityText}>
                {Math.round(Number(recipe.popularity_score))}
              </Text>
            </View>
          )}

          <View style={[styles.diffBadge, { backgroundColor: diffInfo.bg }]}>
            <Text style={[styles.diffText, { color: diffInfo.text }]}>
              {diffInfo.label}
            </Text>
          </View>

          {Boolean(recipe.servings) && (
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={12} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              <Text style={[styles.metaText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                {recipe.servings} phần
              </Text>
            </View>
          )}

          {totalTime > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color="#F97316" />
              <Text style={[styles.metaText, { color: isDarkMode ? '#D1D5DB' : '#4B5563' }]}>
                {totalTime}p
              </Text>
            </View>
          )}

          {/* Nhãn vị nổi bật (ước tính từ định lượng công thức) */}
          {tasteBadges.map((b) => (
            <View key={b.key} style={[styles.tasteBadge, { backgroundColor: tasteColors[b.key].bg }]}>
              <Text style={[styles.tasteText, { color: tasteColors[b.key].text }]}>{b.text}</Text>
            </View>
          ))}

          {Boolean(recipe.visibility) && (
            <View style={[styles.statusBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <Text style={[styles.statusText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                {recipe.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Cột thao tác bên phải: Bookmark + Mũi tên */}
      <View style={styles.actions}>
        {onBookmarkPress && (
          <Pressable
            hitSlop={4}
            onPress={handleBookmark}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? `Bỏ lưu ${recipe.name}` : `Lưu ${recipe.name}`}
            style={({ pressed }) => [
              styles.bookmarkBtn,
              pressed && { opacity: 0.7 },
            ]}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? '#F97316' : isDarkMode ? '#9CA3AF' : '#6B7280'}
            />
          </Pressable>
        )}

        <Ionicons
          name="chevron-forward"
          size={18}
          color={isDarkMode ? '#52525B' : '#D1D5DB'}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    ...shadow(1),
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  thumbSlot: {
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  diffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 12,
    fontWeight: '700',
  },
  popularityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316',
  },
  tasteBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tasteText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 4,
  },
  // Vùng chạm 44x44 theo chuẩn HIG / Material
  bookmarkBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// memo: thẻ chỉ render lại khi recipe / isSaved / handler thực sự đổi
export const RecipeTextCard = React.memo(RecipeTextCardComponent);

export default RecipeTextCard;

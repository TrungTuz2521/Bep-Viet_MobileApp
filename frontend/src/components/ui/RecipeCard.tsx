import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Image } from 'expo-image';
import { Recipe } from '@/types/api';
import { useAppSelector } from '@/store';
import { shadow } from '@/lib/shadows';
import { ElevatedPressable } from '@/components/ui/ElevatedPressable';

export interface RecipeCardProps {
  recipe: Recipe;
  layout?: 'vertical' | 'horizontal';
  onPress: () => void;
  onBookmarkPress?: () => void;
  isSaved?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  layout = 'vertical',
  onPress,
  onBookmarkPress,
  isSaved = false,
}) => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  // Màn cha tự kiểm tra đăng nhập trước khi truyền onBookmarkPress
  const handleBookmark = (e: any) => {
    e.stopPropagation();
    onBookmarkPress?.();
  };

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const getDifficultyText = (diff?: string) => {
    switch (diff) {
      case 'easy':
        return 'Dễ';
      case 'medium':
        return 'Vừa';
      case 'hard':
        return 'Khó';
      default:
        return 'Dễ';
    }
  };

  if (layout === 'horizontal') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem công thức ${recipe.name}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.horizontalCard,
          {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDarkMode ? '#2D2D2D' : '#F3F4F6',
          },
          pressed && styles.pressed,
        ]}>
        <Image
          source={{ uri: recipe.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=300&q=80' }}
          style={styles.horizontalImage}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.horizontalContent}>
          <Text
            numberOfLines={2}
            style={[styles.name, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            {recipe.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.timeText}>⏱ {totalTime > 0 ? `${totalTime} phút` : '15 phút'}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.difficultyText}>{getDifficultyText(recipe.difficulty)}</Text>
          </View>
        </View>

        {/* Chỉ hiện nút lưu khi màn cha có xử lý (tránh nút bấm không phản hồi) */}
        {onBookmarkPress && (
          <Pressable
            hitSlop={12}
            onPress={handleBookmark}
            style={styles.bookmarkButton}
            accessibilityLabel={isSaved ? 'Bỏ lưu' : 'Lưu công thức'}>
            <Text style={[styles.bookmarkIcon, isSaved && styles.bookmarkActive]}>
              {isSaved ? '★' : '☆'}
            </Text>
          </Pressable>
        )}
      </Pressable>
    );
  }

  return (
    <ElevatedPressable
      level={1}
      accessibilityRole="button"
      accessibilityLabel={`Xem công thức ${recipe.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.verticalCard,
        {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          borderColor: isDarkMode ? '#2D2D2D' : '#F3F4F6',
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=500&q=80' }}
          style={styles.verticalImage}
          contentFit="cover"
          transition={300}
        />
        {/* Nút lưu nhanh (chỉ hiện khi màn cha có xử lý) */}
        {onBookmarkPress && (
          <Pressable
            hitSlop={10}
            onPress={handleBookmark}
            style={styles.floatingBookmark}
            accessibilityLabel={isSaved ? 'Bỏ lưu công thức' : 'Lưu công thức'}>
            <Text style={[styles.floatingBookmarkIcon, isSaved && styles.bookmarkActive]}>
              {isSaved ? '★' : '☆'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.verticalContent}>
        <Text
          numberOfLines={2}
          style={[styles.name, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
          {recipe.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.timeText}>⏱ {totalTime > 0 ? `${totalTime} phút` : '20 phút'}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.difficultyText}>{getDifficultyText(recipe.difficulty)}</Text>
        </View>
      </View>
    </ElevatedPressable>
  );
};

const styles = StyleSheet.create({
  verticalCard: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: 16,
    marginBottom: 8,
  },
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    ...shadow(1),
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 130,
  },
  verticalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  floatingBookmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBookmarkIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  bookmarkButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: {
    fontSize: 22,
    color: '#9CA3AF',
  },
  bookmarkActive: {
    color: '#F59E0B',
  },
  verticalContent: {
    padding: 12,
  },
  horizontalContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '600',
  },
  dot: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default RecipeCard;

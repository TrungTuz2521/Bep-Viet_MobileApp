import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/AppText';
import { FOOD_TINTS, getFoodVisual } from '@/lib/recipeDisplay';
import { emojiText } from '@/lib/typography';

export const RECIPE_THUMB_SIZE = 60;

export interface RecipeThumbnailProps {
  name: string;
  imageUrl?: string | null;
  categoryName?: string | null;
  isDarkMode: boolean;
  size?: number;
}

/**
 * Ảnh nhỏ đầu thẻ món. Có ảnh → hiện ảnh (mờ dần khi tải xong);
 * chưa có / ảnh lỗi → ô màu pastel + biểu tượng theo loại món (canh 🍲, bún 🍜, hải sản 🦐...).
 * Ô mặc định luôn nằm phía dưới nên lúc ảnh đang tải vẫn không bị trống.
 */
export const RecipeThumbnail: React.FC<RecipeThumbnailProps> = React.memo(
  ({ name, imageUrl, categoryName, isDarkMode, size = RECIPE_THUMB_SIZE }) => {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const visual = getFoodVisual(name, categoryName);
    const tint = FOOD_TINTS[visual.tint];
    const showImage = Boolean(imageUrl) && /^https?:\/\//i.test(imageUrl!) && failedUrl !== imageUrl;

    return (
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.24),
            backgroundColor: isDarkMode ? tint.dark : tint.light,
            borderColor: isDarkMode ? tint.borderDark : tint.borderLight,
          },
        ]}>
        <Text style={emojiText(Math.round(size * 0.47))}>{visual.emoji}</Text>
        {showImage && (
          <Image
            source={{ uri: imageUrl! }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            recyclingKey={imageUrl!}
            onError={() => setFailedUrl(imageUrl!)}
          />
        )}
      </View>
    );
  }
);
RecipeThumbnail.displayName = 'RecipeThumbnail';

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default RecipeThumbnail;

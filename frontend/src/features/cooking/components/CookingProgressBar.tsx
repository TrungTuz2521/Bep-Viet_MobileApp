import React from 'react';
import { StyleSheet, View } from 'react-native';
import { brand } from '@/lib/theme';

interface CookingProgressBarProps {
  /** Tỉ lệ hoàn thành từ 0 → 1 */
  progress: number;
  /** Chiều cao thanh tiến trình */
  height?: number;
}

/**
 * Thanh tiến trình nấu ăn gradient cam-vàng, hiển thị phần trăm hoàn thành Cooking Mode.
 */
export const CookingProgressBar: React.FC<CookingProgressBarProps> = ({
  progress,
  height = 6,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 100,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: brand.primary,
    borderRadius: 100,
  },
});

export default CookingProgressBar;

import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppSelector } from '@/store';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

// Một vòng lặp nhấp nháy opacity chạy trên native driver (không chiếm JS thread)
const usePulse = () => {
  const [opacity] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return opacity;
};

const useSkeletonColors = () => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  return {
    block: isDarkMode ? '#2E2E2E' : '#E5E7EB',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    border: isDarkMode ? '#2D2D2D' : '#E5E7EB',
  };
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const colors = useSkeletonColors();
  const opacity = usePulse();

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: colors.block,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Khối tĩnh: dùng bên trong một nhóm đã có chung animation
const Block: React.FC<SkeletonProps & { color: string }> = ({
  width = '100%',
  height = 14,
  borderRadius = 6,
  style,
  color,
}) => (
  <View
    style={[
      { width: width as any, height: height as any, borderRadius, backgroundColor: color },
      style,
    ]}
  />
);

export const RecipeCardSkeleton: React.FC = () => (
  <Animated.View style={styles.cardSkeleton}>
    <Skeleton width={200} height={130} borderRadius={16} />
    <Skeleton width={160} height={16} style={{ marginTop: 10 }} />
    <Skeleton width={100} height={12} style={{ marginTop: 6 }} />
  </Animated.View>
);

/**
 * Skeleton cho danh sách RecipeTextCard — giữ đúng kích thước thẻ thật
 * để khi dữ liệu về không bị "nhảy" bố cục.
 */
export const RecipeTextCardSkeletonList: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const colors = useSkeletonColors();
  const opacity = usePulse();

  return (
    <Animated.View
      style={{ opacity }}
      accessible
      accessibilityLabel="Đang tải danh sách món ăn"
      accessibilityRole="progressbar">
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={`text-card-skeleton-${idx}`}
          style={[styles.textCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Block color={colors.block} width={60} height={60} borderRadius={14} />
          <View style={styles.textCardContent}>
            <Block color={colors.block} width={idx % 2 === 0 ? '78%' : '62%'} height={16} />
            <View style={styles.textCardMetaRow}>
              <Block color={colors.block} width={36} height={16} />
              <Block color={colors.block} width={30} height={16} />
              <Block color={colors.block} width={52} height={16} />
            </View>
          </View>
          <Block color={colors.block} width={24} height={24} borderRadius={12} />
        </View>
      ))}
    </Animated.View>
  );
};

/** Skeleton cho trang chi tiết công thức (thẻ tóm tắt + nguyên liệu + các bước) */
export const RecipeDetailSkeleton: React.FC = () => {
  const colors = useSkeletonColors();
  const opacity = usePulse();
  const cardStyle = [styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }];

  return (
    <Animated.View
      style={[styles.detailContainer, { opacity }]}
      accessible
      accessibilityLabel="Đang tải chi tiết công thức"
      accessibilityRole="progressbar">
      <View style={cardStyle}>
        <View style={styles.detailHeroRow}>
          <Block color={colors.block} width={60} height={60} borderRadius={18} />
          <View style={styles.detailHeroInfo}>
            <Block color={colors.block} width={72} height={18} />
            <Block color={colors.block} width="90%" height={22} style={styles.mt8} />
            <Block color={colors.block} width="55%" height={14} style={styles.mt8} />
          </View>
        </View>
        <Block color={colors.block} width="100%" height={14} style={styles.mt16} />
        <Block color={colors.block} width="80%" height={14} style={styles.mt8} />
        <Block color={colors.block} width="100%" height={64} borderRadius={14} style={styles.mt16} />
      </View>

      {[5, 4].map((rows, sectionIdx) => (
        <View key={`detail-section-${sectionIdx}`} style={styles.mt24}>
          <Block color={colors.block} width={120} height={20} style={styles.mb10} />
          <View style={cardStyle}>
            {Array.from({ length: rows }).map((_, idx) => (
              <View key={`detail-row-${idx}`} style={styles.detailRow}>
                <Block color={colors.block} width={22} height={22} borderRadius={11} />
                <Block color={colors.block} width={idx % 2 === 0 ? '70%' : '55%'} height={14} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    width: 200,
    marginRight: 16,
    marginBottom: 8,
  },
  textCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  textCardContent: {
    flex: 1,
    gap: 8,
  },
  textCardMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  detailCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  detailHeroRow: {
    flexDirection: 'row',
    gap: 14,
  },
  detailHeroInfo: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
  },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  mt24: { marginTop: 24 },
  mb10: { marginBottom: 10 },
});

export default Skeleton;

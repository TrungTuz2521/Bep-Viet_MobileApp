import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shadow } from '@/lib/shadows';
import { brand } from '@/lib/theme';

interface CookingCompleteViewProps {
  /** Tên món ăn */
  recipeName: string;
  /** Tổng số bước */
  totalSteps: number;
  /** Số bước đã hoàn thành */
  completedCount: number;
  /** Callback quay lại chi tiết công thức */
  onBackToRecipe: () => void;
  /** Callback đóng cooking mode hoàn toàn */
  onDone: () => void;
}

/**
 * Màn hình kết thúc Cooking Mode - hiển thị thành công, chúc mừng.
 */
export const CookingCompleteView: React.FC<CookingCompleteViewProps> = ({
  recipeName,
  totalSteps,
  completedCount,
  onBackToRecipe,
  onDone,
}) => {
  const allDone = completedCount === totalSteps;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      {/* Biểu tượng thành công */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{allDone ? '🎉' : '👨‍🍳'}</Text>
      </View>

      <Text style={styles.title}>
        {allDone ? 'Hoàn Tất Xuất Sắc!' : 'Kết Thúc Nấu Ăn'}
      </Text>

      <Text style={styles.subtitle}>
        {allDone
          ? `Bạn đã hoàn thành tất cả ${totalSteps} bước cho món "${recipeName}". Chúc ngon miệng! 🍽`
          : `Bạn đã hoàn thành ${completedCount}/${totalSteps} bước cho món "${recipeName}".`}
      </Text>

      {/* Thống kê */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>Bước xong</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalSteps}</Text>
          <Text style={styles.statLabel}>Tổng bước</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Hoàn thành</Text>
        </View>
      </View>

      {/* Nút hành động */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={onBackToRecipe}
          style={({ pressed }) => [
            styles.btnOutline,
            pressed && styles.btnPressed,
          ]}
        >
          <Ionicons name="arrow-back" size={18} color="#F97316" />
          <Text style={styles.btnOutlineText}>Xem lại công thức</Text>
        </Pressable>

        <Pressable
          onPress={onDone}
          style={({ pressed }) => [
            styles.btnPrimary,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.btnPrimaryText}>Xong 👌</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 18,
    paddingHorizontal: 8,
    width: '100%',
    marginBottom: 36,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FB923C',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  btnOutlineText: {
    color: '#FB923C',
    fontSize: 15,
    fontWeight: '600',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: brand.primary,
    ...shadow(2),
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});

export default CookingCompleteView;

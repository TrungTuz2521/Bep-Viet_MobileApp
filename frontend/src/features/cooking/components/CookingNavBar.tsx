import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shadow } from '@/lib/shadows';
import { brand } from '@/lib/theme';

interface CookingNavBarProps {
  /** Có phải bước đầu tiên */
  isFirstStep: boolean;
  /** Có phải bước cuối cùng */
  isLastStep: boolean;
  /** Bước hiện tại đã hoàn thành chưa */
  isCurrentCompleted: boolean;
  /** Chuyển bước trước */
  onPrev: () => void;
  /** Chuyển bước kế tiếp */
  onNext: () => void;
  /** Hoàn tất nấu ăn (ở bước cuối) */
  onFinish: () => void;
}

/**
 * Thanh điều hướng cố định dưới cùng cho Cooking Mode.
 * Nút lớn, dễ bấm khi tay ướt, tối ưu cho trải nghiệm nấu ăn.
 */
export const CookingNavBar: React.FC<CookingNavBarProps> = ({
  isFirstStep,
  isLastStep,
  isCurrentCompleted,
  onPrev,
  onNext,
  onFinish,
}) => {
  // Chừa chỗ cho home indicator iOS / thanh điều hướng Android
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 18) }]}>
      {/* Nút Trước */}
      <Pressable
        disabled={isFirstStep}
        onPress={onPrev}
        style={({ pressed }) => [
          styles.navBtn,
          styles.prevBtn,
          isFirstStep && styles.navBtnDisabled,
          pressed && !isFirstStep && styles.navBtnPressed,
        ]}
        accessibilityLabel="Bước trước"
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={isFirstStep ? 'rgba(255,255,255,0.2)' : '#F9FAFB'}
        />
        <Text
          style={[
            styles.navBtnText,
            isFirstStep && styles.navBtnTextDisabled,
          ]}
        >
          Trước
        </Text>
      </Pressable>

      {/* Nút Tiếp / Hoàn tất */}
      {isLastStep ? (
        <Pressable
          onPress={onFinish}
          style={({ pressed }) => [
            styles.navBtn,
            styles.finishBtn,
            pressed && styles.finishBtnPressed,
          ]}
          accessibilityLabel="Hoàn tất nấu ăn"
        >
          <Ionicons name="checkmark-done" size={24} color="#FFFFFF" />
          <Text style={styles.finishBtnText}>Hoàn Tất 🎉</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={onNext}
          style={({ pressed }) => [
            styles.navBtn,
            styles.nextBtn,
            pressed && styles.nextBtnPressed,
          ]}
          accessibilityLabel="Bước tiếp theo"
        >
          <Text style={styles.nextBtnText}>Tiếp theo</Text>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 24,
  },
  navBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
  navBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  prevBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flex: 0.4,
  },
  nextBtn: {
    backgroundColor: brand.primary,
    flex: 0.6,
    ...shadow(2),
  },
  nextBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  finishBtn: {
    backgroundColor: '#22C55E',
    flex: 0.6,
    ...shadow(2),
  },
  finishBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default CookingNavBar;

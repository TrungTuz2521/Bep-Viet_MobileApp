import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { brand } from '@/lib/theme';

interface StepIndicatorDotsProps {
  /** Tổng số bước */
  totalSteps: number;
  /** Index bước hiện tại */
  currentIndex: number;
  /** Các bước đã hoàn thành */
  completedSteps: Set<number>;
  /** Gọi khi bấm vào dot */
  onDotPress?: (index: number) => void;
}

/**
 * Dãy chấm tròn chỉ bước hiện tại trong Cooking Mode.
 * - Xanh lá = đã hoàn thành
 * - Cam sáng = đang ở bước hiện tại
 * - Xám mờ = chưa tới
 */
export const StepIndicatorDots: React.FC<StepIndicatorDotsProps> = ({
  totalSteps,
  currentIndex,
  completedSteps,
  onDotPress,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const isCurrent = i === currentIndex;
        const isCompleted = completedSteps.has(i);

        return (
          <Pressable
            key={`dot-${i}`}
            hitSlop={6}
            onPress={() => onDotPress?.(i)}
            accessibilityLabel={`Bước ${i + 1}${isCurrent ? ', đang xem' : ''}${isCompleted ? ', hoàn thành' : ''}`}
          >
            <View
              style={[
                styles.dot,
                isCurrent && styles.dotCurrent,
                isCompleted && !isCurrent && styles.dotCompleted,
              ]}
            >
              {isCompleted && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrent: {
    width: 28,
    height: 12,
    borderRadius: 6,
    backgroundColor: brand.primary,
  },
  dotCompleted: {
    backgroundColor: '#22C55E',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
});

export default StepIndicatorDots;

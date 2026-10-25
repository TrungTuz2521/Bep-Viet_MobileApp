import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';

interface CookingStepCardProps {
  /** Số thứ tự bước (1-indexed) */
  stepNumber: number;
  /** Tổng số bước */
  totalSteps: number;
  /** Nội dung hướng dẫn */
  instruction: string;
  /** Thời gian (giây), tuỳ chọn */
  timerSeconds?: number | null;
  /** Bước đã hoàn thành chưa */
  isCompleted: boolean;
  /** Toggle hoàn thành bước này */
  onToggleComplete: () => void;
}

/**
 * Thẻ hiển thị 1 bước nấu ăn trong Cooking Mode.
 * Chữ cực lớn, dễ đọc khi vừa nấu vừa nhìn, nền tối.
 */
export const CookingStepCard: React.FC<CookingStepCardProps> = ({
  stepNumber,
  totalSteps,
  instruction,
  timerSeconds,
  isCompleted,
  onToggleComplete,
}) => {
  const formatTime = (secs: number): string => {
    if (secs >= 3600) {
      const h = Math.floor(secs / 3600);
      const m = Math.round((secs % 3600) / 60);
      return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
    }
    if (secs >= 60) {
      const m = Math.round(secs / 60);
      return `${m} phút`;
    }
    return `${secs} giây`;
  };

  return (
    <View style={styles.container}>
      {/* Badge số bước */}
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            Bước {stepNumber}/{totalSteps}
          </Text>
        </View>

        {/* Nút đánh dấu hoàn thành */}
        <Pressable
          hitSlop={10}
          onPress={onToggleComplete}
          style={[styles.checkBtn, isCompleted && styles.checkBtnCompleted]}
          accessibilityLabel={isCompleted ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
        >
          <Ionicons
            name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={28}
            color={isCompleted ? '#22C55E' : 'rgba(255, 255, 255, 0.4)'}
          />
          <Text style={[styles.checkText, isCompleted && styles.checkTextDone]}>
            {isCompleted ? 'Xong!' : 'Hoàn thành'}
          </Text>
        </Pressable>
      </View>

      {/* Timer chip nếu có */}
      {timerSeconds != null && timerSeconds > 0 && (
        <View style={styles.timerChip}>
          <Text style={styles.timerIcon}>⏱</Text>
          <Text style={styles.timerText}>{formatTime(timerSeconds)}</Text>
        </View>
      )}

      {/* Nội dung hướng dẫn - FONT CỰC LỚN */}
      <Text
        style={[
          styles.instruction,
          isCompleted && styles.instructionCompleted,
        ]}
      >
        {instruction}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  stepBadgeText: {
    color: '#FB923C',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  checkBtnCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  checkText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  checkTextDone: {
    color: '#22C55E',
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 24,
  },
  timerIcon: {
    fontSize: 20,
  },
  timerText: {
    color: '#FB923C',
    fontSize: 18,
    fontWeight: '700',
  },
  instruction: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 42,
    letterSpacing: 0.2,
  },
  instructionCompleted: {
    color: 'rgba(249, 250, 251, 0.45)',
    textDecorationLine: 'line-through',
  },
});

export default CookingStepCard;

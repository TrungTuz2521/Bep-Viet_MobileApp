import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { brand } from '@/lib/theme';

interface CookingStepListDrawerProps {
  /** Tất cả các bước */
  steps: {
    step_number: number;
    instruction: string;
    timer_seconds?: number | null;
  }[];
  /** Index bước hiện tại */
  currentIndex: number;
  /** Set các bước đã hoàn thành */
  completedSteps: Set<number>;
  /** Callback khi chọn bước */
  onSelectStep: (index: number) => void;
  /** Callback đóng drawer */
  onClose: () => void;
}

/**
 * Danh sách tổng quan tất cả các bước (mở từ nút "Xem tất cả").
 * Hiển thị dạng overlay tối trên màn hình Cooking Mode.
 */
export const CookingStepListDrawer: React.FC<CookingStepListDrawerProps> = ({
  steps,
  currentIndex,
  completedSteps,
  onSelectStep,
  onClose,
}) => {
  const formatTime = (secs: number): string => {
    if (secs >= 60) {
      return `${Math.round(secs / 60)} phút`;
    }
    return `${secs} giây`;
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.drawer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📋 Tất Cả Các Bước</Text>
          <Pressable
            hitSlop={8}
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Đóng"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Danh sách bước cuộn được */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {steps.map((step, index) => {
            const isCurrent = index === currentIndex;
            const isCompleted = completedSteps.has(index);

            return (
              <Pressable
                key={`drawer-step-${index}`}
                onPress={() => {
                  onSelectStep(index);
                  onClose();
                }}
                style={[
                  styles.stepItem,
                  isCurrent && styles.stepItemCurrent,
                  isCompleted && styles.stepItemCompleted,
                ]}
              >
                {/* Số bước */}
                <View
                  style={[
                    styles.stepNumberCircle,
                    isCurrent && styles.stepNumberCurrent,
                    isCompleted && styles.stepNumberCompleted,
                  ]}
                >
                  {isCompleted ? (
                    <Text style={styles.checkMark}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.stepNumberText,
                        isCurrent && styles.stepNumberTextCurrent,
                      ]}
                    >
                      {step.step_number}
                    </Text>
                  )}
                </View>

                {/* Nội dung */}
                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepInstruction,
                      isCompleted && styles.stepInstructionDone,
                    ]}
                    numberOfLines={2}
                  >
                    {step.instruction}
                  </Text>
                  {step.timer_seconds != null && step.timer_seconds > 0 && (
                    <Text style={styles.stepTimer}>
                      ⏱ {formatTime(step.timer_seconds)}
                    </Text>
                  )}
                </View>

                {/* Mũi tên nếu đang ở bước này */}
                {isCurrent && (
                  <Text style={styles.currentArrow}>▶</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepItemCurrent: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  stepItemCompleted: {
    opacity: 0.7,
  },
  stepNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberCurrent: {
    backgroundColor: brand.primary,
  },
  stepNumberCompleted: {
    backgroundColor: '#22C55E',
  },
  stepNumberText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '700',
  },
  stepNumberTextCurrent: {
    color: '#FFFFFF',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
  },
  stepInstructionDone: {
    color: 'rgba(229, 231, 235, 0.5)',
    textDecorationLine: 'line-through',
  },
  stepTimer: {
    color: '#FB923C',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  currentArrow: {
    color: '#F97316',
    fontSize: 12,
  },
});

export default CookingStepListDrawer;

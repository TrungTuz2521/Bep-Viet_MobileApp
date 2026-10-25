import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';
import { Step } from '@/types/api';
import { shadow } from '@/lib/shadows';
import { useThemeColors } from '@/lib/theme';

export interface StepListProps {
  steps: Step[];
}

export const StepList: React.FC<StepListProps> = ({ steps }) => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // Màu nhấn theo dark mode (lib/theme.ts)
  const colors = useThemeColors();

  if (!steps || steps.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
        Chưa có các bước hướng dẫn cụ thể.
      </Text>
    );
  }

  const formatTimerText = (seconds?: number | null) => {
    if (!seconds) return null;
    const mins = Math.round(seconds / 60);
    return mins > 0 ? `⏱ ${mins} phút` : `⏱ ${seconds} giây`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="flame-outline" size={20} color="#F97316" />
        <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
          Các Bước Chế Biến ({steps.length} bước)
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        {steps.map((step, idx) => {
          const timerText = formatTimerText(step.timer_seconds);

          return (
            <View
              key={`step-${step.id || idx}`}
              style={[
                styles.stepCard,
                {
                  backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                  borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
                },
              ]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepBadge, { backgroundColor: colors.primaryTint, borderColor: colors.primaryTintBorder }, { backgroundColor: colors.primaryTint, borderColor: colors.primaryTintBorder }]}>
                  <Text style={[styles.stepBadgeText, { color: colors.primaryTintText }, { color: colors.primaryTintText }]}>Bước {step.step_number || idx + 1}</Text>
                </View>

                {/* Chip thời gian nổi bật dạng TEXT - KHÔNG đếm ngược */}
                {timerText && (
                  <View style={[styles.timerChip, { backgroundColor: colors.warningTint, borderColor: colors.warningTintBorder }, { backgroundColor: colors.warningTint, borderColor: colors.warningTintBorder }]}>
                    <Text style={[styles.timerText, { color: colors.warningText }, { color: colors.warningText }]}>{timerText}</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.instruction,
                  { color: isDarkMode ? '#E5E7EB' : '#374151' },
                ]}>
                {step.instruction}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  stepsContainer: {
    gap: 12,
  },
  stepCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    ...shadow(1),
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  timerChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  instruction: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyText: {
    fontStyle: 'italic',
    paddingVertical: 12,
  },
});

export default StepList;

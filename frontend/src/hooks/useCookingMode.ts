import { useCallback, useMemo, useState } from 'react';
import { Step } from '@/types/api';

export interface CookingModeState {
  /** Bước hiện tại (0-indexed) */
  currentStepIndex: number;
  /** Tổng số bước */
  totalSteps: number;
  /** Bước hiện tại */
  currentStep: Step | null;
  /** Tiến trình hoàn thành (0 → 1) */
  progress: number;
  /** Có phải bước đầu tiên */
  isFirstStep: boolean;
  /** Có phải bước cuối cùng */
  isLastStep: boolean;
  /** Danh sách bước đã check hoàn thành */
  completedSteps: Set<number>;
  /** Bước hiện tại đã hoàn thành chưa */
  isCurrentStepCompleted: boolean;
}

export interface CookingModeActions {
  /** Chuyển sang bước tiếp theo */
  goNext: () => void;
  /** Quay lại bước trước */
  goPrev: () => void;
  /** Nhảy đến bước bất kỳ */
  goToStep: (index: number) => void;
  /** Đánh dấu bước hiện tại hoàn thành */
  toggleCompleteCurrentStep: () => void;
  /** Reset toàn bộ tiến trình */
  resetProgress: () => void;
}

/**
 * Hook quản lý trạng thái Cooking Mode (từng bước một).
 * Dùng cho màn hình nấu ăn toàn màn hình Sprint 5.
 */
export function useCookingMode(steps: Step[]): [CookingModeState, CookingModeActions] {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] ?? null;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const progress = useMemo(() => {
    if (totalSteps <= 1) return completedSteps.size > 0 ? 1 : 0;
    return completedSteps.size / totalSteps;
  }, [completedSteps.size, totalSteps]);

  const isCurrentStepCompleted = completedSteps.has(currentStepIndex);

  const goNext = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSteps) {
        setCurrentStepIndex(index);
      }
    },
    [totalSteps]
  );

  const toggleCompleteCurrentStep = useCallback(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(currentStepIndex)) {
        next.delete(currentStepIndex);
      } else {
        next.add(currentStepIndex);
      }
      return next;
    });
  }, [currentStepIndex]);

  const resetProgress = useCallback(() => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
  }, []);

  const state: CookingModeState = {
    currentStepIndex,
    totalSteps,
    currentStep,
    progress,
    isFirstStep,
    isLastStep,
    completedSteps,
    isCurrentStepCompleted,
  };

  const actions: CookingModeActions = {
    goNext,
    goPrev,
    goToStep,
    toggleCompleteCurrentStep,
    resetProgress,
  };

  return [state, actions];
}

export default useCookingMode;

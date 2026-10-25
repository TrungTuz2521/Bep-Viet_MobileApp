import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { useCookingMode } from '@/hooks/useCookingMode';
import { useAppSelector } from '@/store';
import { useGetRecipeDetailsQuery, useFinishCookingMutation } from '@/store/apiSlice';
import {
  CookingHeader,
  CookingStepCard,
  CookingNavBar,
  StepIndicatorDots,
  CookingStepListDrawer,
  CookingCompleteView,
} from '@/features/cooking/components';

import { Step } from '@/types/api';
import { MOCK_RECIPES } from '@/lib/mockData';
import { brand } from '@/lib/theme';

const TAG = 'CookingModeScreen';

// ─── Giữ màn hình sáng trong suốt thời gian nấu ─────────────────────────────
function KeepAwake() {
  useEffect(() => {
    activateKeepAwakeAsync(TAG);
    return () => {
      deactivateKeepAwake(TAG);
    };
  }, []);
  return null;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CookingModeScreen() {
  const router = useSafeRouter(); // chặn bấm liên tiếp mở trùng trang
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId || '');

  // Lấy chi tiết công thức (bao gồm steps)
  const {
    data: recipeData,
    isLoading,
    isError,
  } = useGetRecipeDetailsQuery(id, { skip: !id });

  const fallbackRecipe = React.useMemo(() => {
    if (!id) return null;
    return MOCK_RECIPES.find((r) => String(r.id) === String(id) || r.slug === id);
  }, [id]);

  const recipe = recipeData?.data || fallbackRecipe;
  const steps: Step[] = recipe?.steps ?? [];

  // Hook quản lý trạng thái Cooking Mode
  const [state, actions] = useCookingMode(steps);
  const {
    currentStepIndex,
    totalSteps,
    currentStep,
    progress,
    isFirstStep,
    isLastStep,
    completedSteps,
    isCurrentStepCompleted,
  } = state;
  const { goNext, goPrev, goToStep, toggleCompleteCurrentStep } = actions;

  // Trạng thái UI cục bộ
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [finishCooking] = useFinishCookingMutation();

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleExit = useCallback(() => {
    router.back();
  }, [router]);

  const handleNext = useCallback(() => {
    if (!isCurrentStepCompleted) {
      toggleCompleteCurrentStep();
    }
    goNext();
  }, [isCurrentStepCompleted, toggleCompleteCurrentStep, goNext]);

  const handleFinish = useCallback(() => {
    if (!isCurrentStepCompleted) {
      toggleCompleteCurrentStep();
    }
    setIsFinished(true);
    if (isAuthenticated && recipe?.id) {
      finishCooking(recipe.id).unwrap().catch((err) => {
        console.warn('Lỗi lưu lịch sử nấu:', err);
      });
    }
  }, [isCurrentStepCompleted, toggleCompleteCurrentStep, isAuthenticated, recipe, finishCooking]);

  const handleBackToRecipe = useCallback(() => {
    router.back();
  }, [router]);

  const handleDone = useCallback(() => {
    router.back();
  }, [router]);

  // ── Loading & Error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <KeepAwake />
        {/* Nền chế độ nấu luôn tối → icon status bar luôn sáng */}
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Đang tải công thức...</Text>
      </View>
    );
  }

  if (isError || !recipe) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar style="light" />
        <Text style={styles.errorIcon}>😵</Text>
        <Text style={styles.errorTitle}>Không tải được công thức</Text>
        <Pressable onPress={handleExit} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  // ── Màn hình hoàn tất ──────────────────────────────────────────────────────
  if (isFinished) {
    return (
      <View style={styles.screen}>
        <KeepAwake />
        {/* Nền chế độ nấu luôn tối → icon status bar luôn sáng */}
        <StatusBar style="light" />
        <CookingCompleteView
          recipeName={recipe.name}
          totalSteps={totalSteps}
          completedCount={completedSteps.size}
          onBackToRecipe={handleBackToRecipe}
          onDone={handleDone}
        />
      </View>
    );
  }

  // ── Cooking Mode chính ─────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <KeepAwake />
      {/* Nền chế độ nấu luôn tối → icon status bar luôn sáng */}
      <StatusBar style="light" />

      {/* Header */}
      <CookingHeader
        recipeName={recipe.name}
        progress={progress}
        completedCount={completedSteps.size}
        totalSteps={totalSteps}
        onExit={handleExit}
        onOpenStepList={() => setShowDrawer(true)}
        onAskAssistant={() =>
          router.push({
            pathname: '/assistant',
            params: {
              recipeId: String(recipe.id),
              recipeName: recipe.name,
              step: String(currentStepIndex + 1),
            },
          } as any)
        }
      />

      {/* Vùng hiển thị bước hiện tại */}
      <View style={styles.stepArea}>
        {currentStep ? (
          <CookingStepCard
            stepNumber={currentStep.step_number}
            instruction={currentStep.instruction}
            timerSeconds={currentStep.timer_seconds}
            totalSteps={totalSteps}
            isCompleted={isCurrentStepCompleted}
            onToggleComplete={toggleCompleteCurrentStep}
          />
        ) : (
          <View style={styles.noStepContainer}>
            <Text style={styles.noStepText}>
              Công thức này chưa có bước hướng dẫn chi tiết.
            </Text>
          </View>
        )}
      </View>

      {/* Chấm chỉ vị */}
      {totalSteps > 0 && (
        <StepIndicatorDots
          totalSteps={totalSteps}
          currentIndex={currentStepIndex}
          completedSteps={completedSteps}
          onDotPress={goToStep}
        />
      )}

      {/* Thanh điều hướng dưới cùng */}
      <CookingNavBar
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        isCurrentCompleted={isCurrentStepCompleted}
        onPrev={goPrev}
        onNext={handleNext}
        onFinish={handleFinish}
      />

      {/* Drawer xem tất cả bước */}
      {showDrawer && (
        <CookingStepListDrawer
          steps={steps}
          currentIndex={currentStepIndex}
          completedSteps={completedSteps}
          onSelectStep={goToStep}
          onClose={() => setShowDrawer(false)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  centerScreen: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  stepArea: {
    flex: 1,
  },
  noStepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noStepText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 64,
  },
  errorTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: brand.primary,
  },
  errorBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

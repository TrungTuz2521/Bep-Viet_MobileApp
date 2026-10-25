import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CookingProgressBar from './CookingProgressBar';

interface CookingHeaderProps {
  /** Tên món ăn đang nấu */
  recipeName: string;
  /** Tỉ lệ hoàn thành (0 → 1) */
  progress: number;
  /** Số bước đã hoàn thành */
  completedCount: number;
  /** Tổng số bước */
  totalSteps: number;
  /** Callback thoát Cooking Mode */
  onExit: () => void;
  /** Callback mở drawer xem tất cả bước */
  onOpenStepList: () => void;
  /** Callback mở trợ lý AI hỏi về món / bước đang nấu */
  onAskAssistant?: () => void;
}

/**
 * Header cố định trên cùng của Cooking Mode.
 * Hiển thị tên món, tiến trình, nút thoát và nút xem tất cả bước.
 */
export const CookingHeader: React.FC<CookingHeaderProps> = ({
  recipeName,
  progress,
  completedCount,
  totalSteps,
  onExit,
  onOpenStepList,
  onAskAssistant,
}) => {
  // Đẩy header xuống dưới notch / Dynamic Island / status bar theo inset thật của máy
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Row 1: Nút thoát + Tên món + Nút xem tất cả */}
      <View style={styles.topRow}>
        <Pressable
          hitSlop={8}
          onPress={onExit}
          style={styles.exitBtn}
          accessibilityLabel="Thoát chế độ nấu ăn"
        >
          <Ionicons name="close" size={22} color="#EF4444" />
        </Pressable>

        <Text style={styles.recipeName} numberOfLines={1}>
          {recipeName}
        </Text>

        {onAskAssistant && (
          <Pressable
            hitSlop={8}
            onPress={onAskAssistant}
            style={[styles.listBtn, styles.askBtn]}
            accessibilityLabel="Hỏi trợ lý AI về bước đang nấu"
          >
            <Ionicons name="sparkles" size={20} color="#FDBA74" />
          </Pressable>
        )}

        <Pressable
          hitSlop={8}
          onPress={onOpenStepList}
          style={styles.listBtn}
          accessibilityLabel="Xem tất cả các bước"
        >
          <Ionicons name="list" size={20} color="#F9FAFB" />
        </Pressable>
      </View>

      {/* Row 2: Thanh tiến trình + text phần trăm */}
      <View style={styles.progressRow}>
        <CookingProgressBar progress={progress} height={5} />
        <Text style={styles.progressText}>
          {completedCount}/{totalSteps} bước đã xong
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  exitBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  recipeName: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  listBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressRow: {
    gap: 6,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  askBtn: {
    backgroundColor: 'rgba(249, 115, 22, 0.16)',
  },
});

export default CookingHeader;

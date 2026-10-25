import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';

interface CookingTimerChipProps {
  /** Thời gian tính bằng giây */
  seconds: number;
}

/**
 * Chip hiển thị thời gian của bước nấu ăn dạng TEXT tĩnh (không đếm ngược).
 * Giao diện tối, chữ lớn, nổi bật trên nền đen.
 */
export const CookingTimerChip: React.FC<CookingTimerChipProps> = ({ seconds }) => {
  const formatTime = (totalSeconds: number): string => {
    if (totalSeconds >= 3600) {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.round((totalSeconds % 3600) / 60);
      return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
    }
    if (totalSeconds >= 60) {
      const m = Math.round(totalSeconds / 60);
      return `${m} phút`;
    }
    return `${totalSeconds} giây`;
  };

  return (
    <View style={styles.chip}>
      <Text style={styles.icon}>⏱</Text>
      <Text style={styles.text}>{formatTime(seconds)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
    marginVertical: 12,
  },
  icon: {
    fontSize: 22,
  },
  text: {
    color: '#FB923C',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default CookingTimerChip;

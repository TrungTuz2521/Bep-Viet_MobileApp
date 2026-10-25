import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { brand } from '@/lib/theme';
import { lineHeightFor } from '@/lib/typography';

export interface ListMarkerProps {
  /** Vị trí trong danh sách (bắt đầu từ 0). Không truyền → hiện chấm tròn. */
  index?: number;
  isDarkMode: boolean;
}

export const LIST_MARKER_SIZE = 36;

/**
 * Dấu đầu dòng thống nhất cho mọi danh sách món ăn:
 * ô bo góc nền cam nhạt + số thứ tự (hoặc chấm tròn khi danh sách không có thứ tự).
 * Cùng kích thước ở mọi màn → các dòng luôn thẳng hàng, nhìn đồng bộ.
 */
export const ListMarker: React.FC<ListMarkerProps> = React.memo(({ index, isDarkMode }) => {
  const hasNumber = typeof index === 'number';

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.marker,
        {
          backgroundColor: isDarkMode ? 'rgba(249, 115, 22, 0.14)' : '#FFF7ED',
          borderColor: isDarkMode ? 'rgba(249, 115, 22, 0.28)' : '#FED7AA',
        },
      ]}>
      {hasNumber ? (
        <Text
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.number, { color: isDarkMode ? '#FB923C' : '#EA580C' }]}>
          {index + 1}
        </Text>
      ) : (
        <View style={styles.dot} />
      )}
    </View>
  );
});

ListMarker.displayName = 'ListMarker';

const styles = StyleSheet.create({
  marker: {
    width: LIST_MARKER_SIZE,
    height: LIST_MARKER_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    paddingHorizontal: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.primary,
  },
});

export default ListMarker;

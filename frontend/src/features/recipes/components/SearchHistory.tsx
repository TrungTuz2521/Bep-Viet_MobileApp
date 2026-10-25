import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';

export interface SearchHistoryProps {
  history: string[];
  onSelect: (keyword: string) => void;
  onRemove: (keyword: string) => void;
  onClearAll: () => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onRemove,
  onClearAll,
}) => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  if (!history || history.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="time-outline" size={16} color="#F97316" />
          <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Lịch sử tìm kiếm
          </Text>
        </View>
        <Pressable
          hitSlop={8}
          onPress={onClearAll}
          accessibilityLabel="Xóa toàn bộ lịch sử tìm kiếm">
          <Text style={styles.clearText}>Xóa tất cả</Text>
        </Pressable>
      </View>

      <View style={styles.chipContainer}>
        {history.map((term, index) => (
          <View
            key={`history-${index}`}
            style={[
              styles.chip,
              {
                backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6',
              },
            ]}>
            <Pressable
              style={styles.chipTextBtn}
              onPress={() => onSelect(term)}
              accessibilityLabel={`Tìm lại ${term}`}>
              <Text
                style={[
                  styles.chipText,
                  { color: isDarkMode ? '#E4E4E7' : '#374151' },
                ]}>
                {term}
              </Text>
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => onRemove(term)}
              style={styles.removeBtn}
              accessibilityLabel={`Xóa từ khóa ${term}`}>
              <Ionicons
                name="close"
                size={14}
                color={isDarkMode ? '#A1A1AA' : '#9CA3AF'}
              />
            </Pressable>
          </View>
        ))}
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
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 34,
  },
  chipTextBtn: {
    paddingRight: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  removeBtn: {
    padding: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchHistory;

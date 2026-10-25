import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';

export interface IngredientItem {
  amount?: string | number;
  unit?: string;
  ingredient?: {
    id: string | number;
    name: string;
  };
}

export interface IngredientListProps {
  ingredients: IngredientItem[];
  servings?: number;
}

export const IngredientList: React.FC<IngredientListProps> = ({
  ingredients,
  servings = 4,
}) => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // State lưu các nguyên liệu đã được người dùng tick chuẩn bị xong
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = ingredients?.length || 0;

  if (!ingredients || ingredients.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
        Chưa có thông tin nguyên liệu chi tiết.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tiêu đề & Tiến độ chuẩn bị */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="basket-outline" size={20} color="#F97316" />
          <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Nguyên Liệu
          </Text>
          <Text style={[styles.servingsText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            ({servings} khẩu phần)
          </Text>
        </View>

        <Text style={styles.counterText}>
          Đã chuẩn bị {completedCount}/{totalCount}
        </Text>
      </View>

      {/* Danh sách từng nguyên liệu kèm checkbox */}
      <View
        style={[
          styles.listCard,
          {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
          },
        ]}>
        {ingredients.map((item, idx) => {
          const isChecked = !!checkedItems[idx];
          const name = item.ingredient?.name || 'Nguyên liệu';
          const amount = item.amount ? `${item.amount} ${item.unit || ''}`.trim() : '';

          return (
            <Pressable
              key={`ing-${idx}`}
              onPress={() => toggleCheck(idx)}
              style={({ pressed }) => [
                styles.itemRow,
                idx !== ingredients.length - 1 && styles.borderBottom,
                { borderBottomColor: isDarkMode ? '#27272A' : '#F3F4F6' },
                pressed && styles.pressed,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
              accessibilityLabel={`${name}, ${amount}`}>
              <Ionicons
                name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={isChecked ? '#10B981' : isDarkMode ? '#71717A' : '#9CA3AF'}
              />

              <Text
                style={[
                  styles.itemName,
                  { color: isDarkMode ? '#F9FAFB' : '#111827' },
                  isChecked && styles.itemCheckedText,
                ]}>
                {name}
              </Text>

              {amount.length > 0 && (
                <Text
                  style={[
                    styles.itemAmount,
                    { color: isChecked ? '#9CA3AF' : '#F97316' },
                    isChecked && styles.itemCheckedText,
                  ]}>
                  {amount}
                </Text>
              )}
            </Pressable>
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
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  servingsText: {
    fontSize: 13,
  },
  counterText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemCheckedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  emptyText: {
    fontStyle: 'italic',
    paddingVertical: 12,
  },
});

export default IngredientList;

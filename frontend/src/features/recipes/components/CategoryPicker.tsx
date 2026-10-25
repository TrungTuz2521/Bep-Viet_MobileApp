import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { useThemeColors } from '@/lib/theme';
import { lineHeightFor } from '@/lib/typography';
import { useGetCategoriesQuery } from '@/store/apiSlice';

export const MAX_RECIPE_CATEGORIES = 5;

interface CategoryPickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Chọn danh mục cho món (nhiều lựa chọn, tối đa 5).
 * Hiện danh mục con, nhóm theo danh mục gốc (Loại món, Nguyên liệu chính, Vùng miền...).
 */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const colors = useThemeColors();
  const { data, isLoading } = useGetCategoriesQuery();

  const groups = useMemo(() => {
    const all = data?.data ?? [];
    const roots = all.filter((c) => !c.parent_category_id);
    return roots
      .map((root) => ({
        id: String(root.id),
        name: root.name,
        children: all.filter((c) => String(c.parent_category_id) === String(root.id)),
      }))
      .filter((g) => g.children.length > 0);
  }, [data]);

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (value.length < MAX_RECIPE_CATEGORIES) onChange([...value, id]);
  };

  if (isLoading) return <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />;

  return (
    <View style={styles.container}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Đã chọn {value.length}/{MAX_RECIPE_CATEGORIES} · giúp món hiện khi lọc theo danh mục
      </Text>
      {groups.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text style={[styles.groupTitle, { color: colors.textPrimary }]}>{group.name}</Text>
          <View style={styles.chipGrid}>
            {group.children.map((c) => {
              const id = String(c.id);
              return <Chip key={id} label={c.name} selected={value.includes(id)} onPress={() => toggle(id)} />;
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  loader: {
    marginVertical: 8,
  },
  hint: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
  },
  group: {
    gap: 6,
  },
  groupTitle: {
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    fontWeight: '700',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default CategoryPicker;

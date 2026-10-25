import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { useDebounce } from '@/hooks/useDebounce';
import { useThemeColors } from '@/lib/theme';
import { lineHeightFor } from '@/lib/typography';
import { useGetAllergyOptionsQuery, useSearchIngredientsQuery } from '@/store/apiSlice';
import type { IngredientOption } from '@/types/api';

interface AllergyPickerProps {
  /** Nhóm dị ứng đã chọn (Hải sản có vỏ, Trứng...) */
  groupIds: string[];
  onGroupIdsChange: (ids: string[]) => void;
  /** Nguyên liệu lẻ đã chọn từ kho */
  ingredients: IngredientOption[];
  onIngredientsChange: (items: IngredientOption[]) => void;
}

/**
 * Chọn dị ứng: theo NHÓM (lấy từ DB) + từng NGUYÊN LIỆU LẺ trong kho 500+ nguyên liệu.
 * Món chứa bất kỳ nguyên liệu nào thuộc nhóm / nguyên liệu đã chọn sẽ bị ẩn hoàn toàn.
 */
export function AllergyPicker({ groupIds, onGroupIdsChange, ingredients, onIngredientsChange }: AllergyPickerProps) {
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const term = useDebounce(search.trim(), 300);

  const { data: groupsData, isLoading: loadingGroups } = useGetAllergyOptionsQuery();
  const groups = groupsData?.data ?? [];
  const { data: resultData, isFetching: searching } = useSearchIngredientsQuery(term, { skip: term.length === 0 });
  const selectedIngredientIds = new Set(ingredients.map((i) => i.id));
  const results = (resultData?.data ?? []).filter((i) => !selectedIngredientIds.has(i.id));

  const toggleGroup = (id: string) =>
    onGroupIdsChange(groupIds.includes(id) ? groupIds.filter((g) => g !== id) : [...groupIds, id]);

  const addIngredient = (item: IngredientOption) => {
    onIngredientsChange([...ingredients, item]);
    setSearch('');
  };

  // Liệt kê nguyên liệu sẽ bị tránh của các nhóm đã chọn (minh bạch phạm vi lọc)
  const avoidedNames = groups
    .filter((g) => groupIds.includes(g.id))
    .flatMap((g) => g.ingredients ?? []);

  return (
    <View style={styles.container}>
      <Text style={[styles.subTitle, { color: colors.textPrimary }]}>Nhóm dị ứng phổ biến</Text>
      <View style={styles.chipGrid}>
        {loadingGroups ? (
          <ActivityIndicator size="small" color={colors.dangerAccent} style={styles.loader} />
        ) : (
          groups.map((g) => (
            <Chip
              key={g.id}
              label={`${g.icon ? `${g.icon} ` : ''}${g.label}`}
              selected={groupIds.includes(g.id)}
              isAllergy
              onPress={() => toggleGroup(g.id)}
            />
          ))
        )}
      </View>

      {avoidedNames.length > 0 && (
        <View style={[styles.avoidBox, { backgroundColor: colors.dangerTint, borderColor: colors.dangerTintBorder }]}>
          <Text style={[styles.avoidText, { color: colors.dangerText }]}>
            Sẽ tránh {avoidedNames.length} nguyên liệu: {[...new Set(avoidedNames)].join(', ')}
          </Text>
        </View>
      )}

      <Text style={[styles.subTitle, { color: colors.textPrimary }]}>Nguyên liệu khác</Text>
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm trong kho nguyên liệu (vd: tỏi, nấm, dứa)..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.textPrimary }]}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Tìm nguyên liệu dị ứng"
        />
        {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {term.length > 0 && !searching && (
        <View style={styles.chipGrid}>
          {results.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Không có nguyên liệu &quot;{term}&quot; trong kho.
            </Text>
          ) : (
            results.map((item) => (
              <Chip key={item.id} label={`+ ${item.name}`} onPress={() => addIngredient(item)} />
            ))
          )}
        </View>
      )}

      {ingredients.length > 0 && (
        <View style={styles.chipGrid}>
          {ingredients.map((item) => (
            <Chip
              key={item.id}
              label={item.name}
              selected
              isAllergy
              onPress={() => onIngredientsChange(ingredients.filter((i) => i.id !== item.id))}
              onRemove={() => onIngredientsChange(ingredients.filter((i) => i.id !== item.id))}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  subTitle: {
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    fontWeight: '700',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loader: {
    marginVertical: 8,
  },
  avoidBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  avoidText: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  empty: {
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    paddingVertical: 4,
  },
});

export default AllergyPicker;

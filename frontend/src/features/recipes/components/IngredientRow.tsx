import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useWatch, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import { Text } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { useDebounce } from '@/hooks/useDebounce';
import { useThemeColors } from '@/lib/theme';
import { lineHeightFor } from '@/lib/typography';
import { useSearchIngredientsQuery } from '@/store/apiSlice';
import type { RecipeFormData } from '../schemas';
import { FormInput } from './FormInput';

interface IngredientRowProps {
  index: number;
  control: Control<RecipeFormData>;
  setValue: UseFormSetValue<RecipeFormData>;
  errors: FieldErrors<RecipeFormData>;
  onRemove: () => void;
  onInputFocus: () => void;
}

/**
 * Một dòng nguyên liệu (2 hàng: tên + nút xoá / lượng + đơn vị).
 * Gõ tên → gợi ý từ kho nguyên liệu; chọn gợi ý thì món gắn đúng nguyên liệu trong kho
 * → bộ lọc dị ứng nhận diện chính xác.
 */
export function IngredientRow({ index, control, setValue, errors, onRemove, onInputFocus }: IngredientRowProps) {
  const colors = useThemeColors();
  const name = useWatch({ control, name: `ingredients.${index}.name` }) ?? '';
  const ingredientId = useWatch({ control, name: `ingredients.${index}.ingredient_id` });
  const [focused, setFocused] = useState(false);

  const term = useDebounce(name.trim(), 250);
  const showSuggestions = focused && !ingredientId && term.length > 0;
  const { data, isFetching } = useSearchIngredientsQuery(term, { skip: !showSuggestions });
  const suggestions = showSuggestions ? (data?.data ?? []).slice(0, 6) : [];

  const rowErrors = errors.ingredients?.[index];

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.line}>
        <Controller
          control={control}
          name={`ingredients.${index}.name`}
          render={({ field }) => (
            <FormInput
              ref={field.ref}
              containerStyle={styles.flex}
              placeholder="Tên nguyên liệu (vd: Thịt gà)"
              value={field.value}
              onChangeText={(text) => {
                field.onChange(text);
                // Sửa tên sau khi chọn gợi ý → bỏ liên kết với kho, backend tự khớp lại theo tên
                if (ingredientId) setValue(`ingredients.${index}.ingredient_id`, undefined);
              }}
              onFocus={() => {
                setFocused(true);
                onInputFocus();
              }}
              onBlur={() => {
                setFocused(false);
                field.onBlur();
              }}
              error={rowErrors?.name?.message}
              accessibilityLabel={`Tên nguyên liệu ${index + 1}`}
            />
          )}
        />
        <Pressable
          onPress={onRemove}
          hitSlop={4}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel={`Xóa nguyên liệu ${index + 1}`}>
          <Ionicons name="trash-outline" size={18} color={colors.dangerAccent} />
        </Pressable>
      </View>

      {ingredientId ? (
        <View style={styles.matched}>
          <Ionicons name="checkmark-circle" size={14} color={colors.successAccent} />
          <Text style={[styles.matchedText, { color: colors.successAccent }]}>Có trong kho nguyên liệu</Text>
        </View>
      ) : null}

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((item) => (
            <Chip
              key={item.id}
              label={item.name}
              onPress={() => {
                setValue(`ingredients.${index}.name`, item.name, { shouldValidate: true });
                setValue(`ingredients.${index}.ingredient_id`, String(item.id));
              }}
            />
          ))}
        </View>
      )}
      {showSuggestions && !isFetching && suggestions.length === 0 && term === name.trim() && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Chưa có trong kho, sẽ thêm nguyên liệu mới khi lưu.
        </Text>
      )}

      <View style={styles.line}>
        <Controller
          control={control}
          name={`ingredients.${index}.amount`}
          render={({ field }) => (
            <FormInput
              ref={field.ref}
              containerStyle={styles.flex}
              placeholder="Lượng (vd: 200, 0,5, 1/2)"
              keyboardType="numbers-and-punctuation"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onFocus={onInputFocus}
              error={rowErrors?.amount?.message}
              accessibilityLabel={`Lượng nguyên liệu ${index + 1}`}
            />
          )}
        />
        <Controller
          control={control}
          name={`ingredients.${index}.unit`}
          render={({ field }) => (
            <FormInput
              ref={field.ref}
              containerStyle={styles.unit}
              placeholder="Đơn vị (g, ml)"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onFocus={onInputFocus}
              accessibilityLabel={`Đơn vị nguyên liệu ${index + 1}`}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  unit: {
    width: 120,
  },
  deleteBtn: {
    width: 44,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matched: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchedText: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    fontWeight: '600',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hint: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
  },
});

export default IngredientRow;

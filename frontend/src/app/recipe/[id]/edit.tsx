import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Text } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useAppSelector } from '@/store';
import { useGetRecipeDetailsQuery, useUpdateMyRecipeMutation } from '@/store/apiSlice';
import { useThemeColors } from '@/lib/theme';
import { recipeToFormData } from '@/features/recipes/schemas';
import { RecipeForm, type RecipePayload } from '@/features/recipes/components/RecipeForm';

export default function EditRecipeScreen() {
  const router = useSafeRouter();
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAppSelector((state) => state.auth.user);

  // Luôn lấy bản mới nhất trước khi sửa (tránh sửa trên dữ liệu cache cũ)
  const { data, isFetching, isError, refetch } = useGetRecipeDetailsQuery(id ?? '', {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });
  const [updateRecipe, { isLoading: isUpdating }] = useUpdateMyRecipeMutation();
  const recipe = data?.data;

  const handleSubmit = async (payload: RecipePayload) => {
    if (!id) return;
    try {
      await updateRecipe({ id, data: payload }).unwrap();
      Alert.alert('Thành công', 'Đã cập nhật công thức.');
      router.back();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.data?.message || 'Cập nhật công thức thất bại');
      throw err; // để form mở khoá nút Lưu cho lần thử lại
    }
  };

  if (isFetching && !recipe) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.message, { color: colors.textSecondary }]}>Đang tải thông tin công thức...</Text>
      </View>
    );
  }

  const isOwner = Boolean(recipe && currentUser && String(recipe.owner_user_id) === String(currentUser.id));
  if (isError || !recipe || !isOwner) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {isError || !recipe ? 'Không tải được công thức.' : 'Bạn chỉ có thể sửa công thức của chính mình.'}
        </Text>
        {isError ? <Button title="Thử lại" variant="outline" onPress={refetch} /> : null}
        <Button title="Quay lại" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <RecipeForm
      // Chỉ khởi tạo form khi đã có dữ liệu mới nhất
      key={isFetching ? 'loading' : String(recipe.updated_at ?? recipe.id)}
      title="Chỉnh sửa công thức"
      submitLabel="Lưu thay đổi"
      initialValues={recipeToFormData(recipe)}
      submitting={isUpdating}
      onBack={() => router.back()}
      onSubmit={handleSubmit}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
});

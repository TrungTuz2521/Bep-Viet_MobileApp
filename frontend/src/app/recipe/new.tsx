import React from 'react';
import { Alert } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCreateMyRecipeMutation } from '@/store/apiSlice';
import { NEW_RECIPE_DEFAULTS } from '@/features/recipes/schemas';
import { RecipeForm, type RecipePayload } from '@/features/recipes/components/RecipeForm';

// v2: cấu trúc form mới (thời gian dạng chữ, hẹn giờ theo phút, danh mục, chế độ hiển thị)
const DRAFT_KEY = '@food_app_recipe_draft_v2';
const LEGACY_DRAFT_KEY = '@food_app_recipe_draft_new';
AsyncStorage.removeItem(LEGACY_DRAFT_KEY).catch(() => {});

export default function NewRecipeScreen() {
  const router = useSafeRouter();
  const [createRecipe, { isLoading }] = useCreateMyRecipeMutation();

  const handleSubmit = async (payload: RecipePayload) => {
    try {
      await createRecipe(payload).unwrap();
      Alert.alert(
        'Đã lưu công thức',
        payload.visibility === 'public'
          ? 'Món của bạn đã được công khai và có trong Thư viện.'
          : 'Món đã được lưu riêng tư trong Thư viện. Bạn có thể bật Công khai khi sửa món.'
      );
      // dismissTo: đóng màn tạo, quay về tab Thư viện sẵn có (không tạo trang mới)
      router.dismissTo('/(tabs)/library');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.data?.message || 'Không thể tạo công thức lúc này');
      throw err; // giữ bản nháp khi lưu thất bại
    }
  };

  return (
    <RecipeForm
      title="Tạo công thức mới"
      submitLabel="Lưu công thức"
      initialValues={NEW_RECIPE_DEFAULTS}
      submitting={isLoading}
      onBack={() => router.back()}
      onSubmit={handleSubmit}
      draftKey={DRAFT_KEY}
    />
  );
}

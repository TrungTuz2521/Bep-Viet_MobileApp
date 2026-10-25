import apiClient from './apiClient';
import { API_ENDPOINTS } from '@/constants/api';
import { ApiResponse, Recipe, SavedRecipeItem } from '@/types/api';

export interface CreateRecipePayload {
  name: string;
  slug: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  image_url?: string;
  diet_type?: string;
  ingredients?: Array<{
    ingredient_id: number;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  steps?: Array<{
    step_number: number;
    instruction: string;
    timer_seconds?: number;
  }>;
}

export const libraryService = {
  // Lấy danh sách công thức đã lưu (Saved Recipes)
  async getSavedRecipes(): Promise<SavedRecipeItem[]> {
    const res = await apiClient.get<ApiResponse<SavedRecipeItem[]>>(API_ENDPOINTS.LIBRARY.SAVED);
    return res.data.data || [];
  },

  // Lưu công thức
  async saveRecipe(recipeId: number): Promise<ApiResponse> {
    const res = await apiClient.post<ApiResponse>(API_ENDPOINTS.LIBRARY.SAVE, {
      recipe_id: recipeId,
    });
    return res.data;
  },

  // Bỏ lưu công thức
  async unsaveRecipe(recipeId: number): Promise<ApiResponse> {
    const res = await apiClient.delete<ApiResponse>(API_ENDPOINTS.LIBRARY.UNSAVE(recipeId));
    return res.data;
  },

  // Lấy danh sách công thức do người dùng tự tạo
  async getMyRecipes(): Promise<Recipe[]> {
    const res = await apiClient.get<ApiResponse<Recipe[]>>(API_ENDPOINTS.LIBRARY.MY_RECIPES);
    return res.data.data || [];
  },

  // Tạo công thức mới của riêng mình
  async createMyRecipe(payload: CreateRecipePayload): Promise<Recipe> {
    const res = await apiClient.post<ApiResponse<Recipe>>(API_ENDPOINTS.LIBRARY.CREATE_MY_RECIPE, payload);
    return res.data.data!;
  },

  // Cập nhật công thức của mình
  async updateMyRecipe(id: number, payload: Partial<CreateRecipePayload>): Promise<ApiResponse> {
    const res = await apiClient.put<ApiResponse>(API_ENDPOINTS.LIBRARY.UPDATE_MY_RECIPE(id), payload);
    return res.data;
  },

  // Xóa công thức (soft delete)
  async deleteMyRecipe(id: number): Promise<ApiResponse> {
    const res = await apiClient.delete<ApiResponse>(API_ENDPOINTS.LIBRARY.DELETE_MY_RECIPE(id));
    return res.data;
  },

  // Khôi phục công thức đã xóa
  async restoreMyRecipe(id: number): Promise<ApiResponse> {
    const res = await apiClient.post<ApiResponse>(API_ENDPOINTS.LIBRARY.RESTORE_MY_RECIPE(id));
    return res.data;
  },
};

export default libraryService;

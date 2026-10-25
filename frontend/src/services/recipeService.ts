import apiClient from './apiClient';
import { API_ENDPOINTS } from '@/constants/api';
import { ApiResponse, DiscoverRecipesData, Recipe } from '@/types/api';

export interface SearchRecipeParams {
  query?: string;
  max_time?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  diet_type?: string;
  ingredient_ids?: string | number[];
  category_ids?: string | number[];
}

export const recipeService = {
  // Lấy danh sách khám phá (phổ biến, nấu nhanh, gợi ý theo khẩu vị)
  async getDiscover(): Promise<DiscoverRecipesData> {
    const res = await apiClient.get<ApiResponse<DiscoverRecipesData>>(API_ENDPOINTS.RECIPES.DISCOVER);
    return res.data.data!;
  },

  // Tìm kiếm và lọc công thức
  async searchRecipes(params: SearchRecipeParams): Promise<Recipe[]> {
    const queryParams: Record<string, any> = { ...params };
    if (Array.isArray(params.ingredient_ids)) {
      queryParams.ingredient_ids = params.ingredient_ids.join(',');
    }
    if (Array.isArray(params.category_ids)) {
      queryParams.category_ids = params.category_ids.join(',');
    }

    const res = await apiClient.get<ApiResponse<Recipe[]>>(API_ENDPOINTS.RECIPES.SEARCH, {
      params: queryParams,
    });
    return res.data.data || [];
  },

  // Xem chi tiết công thức bằng slug
  async getRecipeDetails(slug: string): Promise<Recipe> {
    const res = await apiClient.get<ApiResponse<Recipe>>(API_ENDPOINTS.RECIPES.DETAILS(slug));
    return res.data.data!;
  },

  // Đánh dấu hoàn thành nấu ăn
  async finishCooking(recipeId: number | string): Promise<ApiResponse> {
    const res = await apiClient.post<ApiResponse>(API_ENDPOINTS.RECIPES.FINISH_COOKING(recipeId));
    return res.data;
  },
};

export default recipeService;

import apiClient from './apiClient';
import { API_ENDPOINTS } from '@/constants/api';
import { ApiResponse, UserPreferences } from '@/types/api';

export interface UpdatePreferencesPayload {
  preferred_diet_type?: string;
  preferred_tastes?: string;
  allergy_ingredient_ids?: string[];
  favorite_category_ids?: string[];
}

export const userService = {
  // Lấy sở thích ẩm thực và dị ứng của user
  async getPreferences(): Promise<UserPreferences> {
    const res = await apiClient.get<ApiResponse<UserPreferences>>(API_ENDPOINTS.USER.PREFERENCES);
    return res.data.data!;
  },

  // Cập nhật sở thích và dị ứng
  async updatePreferences(payload: UpdatePreferencesPayload): Promise<ApiResponse> {
    const res = await apiClient.put<ApiResponse>(API_ENDPOINTS.USER.PREFERENCES, payload);
    return res.data;
  },
};

export default userService;

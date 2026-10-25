import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { AxiosRequestConfig, AxiosError } from 'axios';
import axiosInstance from '@/lib/axios';
import { ApiResponse, AllergyOption, CategoryOption, DiscoverRecipesData, IngredientOption, Recipe, SavedRecipeItem, User, UserPreferences } from '@/types/api';

// Custom axiosBaseQuery theo đặc tả RTK Query
const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
      headers?: AxiosRequestConfig['headers'];
      /** Ghi đè thời gian chờ mặc định (10s), vd tải ảnh qua mạng di động */
      timeout?: number;
    },
    unknown,
    unknown
  > =>
  async ({ url, method = 'get', data, params, headers, timeout }) => {
    try {
      const result = await axiosInstance({
        url,
        method,
        data,
        params,
        headers,
        ...(timeout ? { timeout } : {}),
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError<any>;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

// Số món mỗi trang ở trang chủ (phân trang từ server)
export const HOME_PAGE_SIZE = 20;

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Recipe', 'SavedRecipe', 'MyRecipe', 'Profile', 'Preferences'],
  endpoints: (builder) => ({
    // 1. Khám phá (Discover)
    getDiscover: builder.query<ApiResponse<DiscoverRecipesData>, void>({
      query: () => ({ url: '/recipes/discover', method: 'get' }),
      providesTags: ['Recipe'],
    }),

    // 1.1 Danh mục món ăn
    getCategories: builder.query<ApiResponse<Array<{ id: string | number; name: string; slug: string; parent_category_id?: string | null; recipe_count?: number }>>, void>({
      query: () => ({ url: '/recipes/categories', method: 'get' }),
      providesTags: ['Recipe'],
    }),

    // 1.2 Danh sách món trang chủ — phân trang vô hạn (20 món/trang).
    // Thay cho tải 500 món một lần (đo: 2-17s qua DB ở xa → ~0.2-0.5s mỗi trang).
    getRecipesPage: builder.infiniteQuery<ApiResponse<Recipe[]>, { category_ids?: string }, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const totalPages = lastPage.pagination?.total_pages ?? 0;
          return lastPageParam < totalPages ? lastPageParam + 1 : undefined;
        },
      },
      query: ({ queryArg, pageParam }) => ({
        url: '/recipes/search',
        method: 'get',
        params: { ...queryArg, page: pageParam, limit: HOME_PAGE_SIZE },
      }),
      providesTags: ['Recipe'],
    }),

    // 2. Tìm kiếm món ăn
    searchRecipes: builder.query<ApiResponse<Recipe[]>, { query?: string; max_time?: number; difficulty?: string; diet_type?: string; category_ids?: string; limit?: number; page?: number; taste_filter?: 'off' }>({
      query: (params) => ({ url: '/recipes/search', method: 'get', params }),
      providesTags: ['Recipe'],
    }),

    // 3. Thông tin tài khoản
    getProfile: builder.query<ApiResponse<User>, void>({
      query: () => ({ url: '/auth/profile', method: 'get' }),
      providesTags: ['Profile'],
    }),

    // 4. Danh sách công thức đã lưu (Chỉ đọc)
    getSavedRecipes: builder.query<ApiResponse<SavedRecipeItem[]>, void>({
      query: () => ({ url: '/library/saved', method: 'get' }),
      providesTags: ['SavedRecipe'],
    }),

    // 5. Lưu công thức
    // Chỉ invalidate 'SavedRecipe' (không tải lại toàn bộ danh sách món) +
    // cập nhật lạc quan để icon bookmark đổi ngay, tự hoàn tác nếu API lỗi
    saveRecipe: builder.mutation<ApiResponse, string | number>({
      query: (recipeId) => ({
        url: '/library/saved',
        method: 'post',
        data: { recipe_id: recipeId },
      }),
      invalidatesTags: ['SavedRecipe'],
      async onQueryStarted(recipeId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          apiSlice.util.updateQueryData('getSavedRecipes', undefined, (draft) => {
            if (!draft?.data) return;
            const exists = draft.data.some(
              (item) => String(item.recipe_id || item.recipe?.id) === String(recipeId)
            );
            // Bản ghi tạm (chưa có chi tiết món) — sẽ được thay bằng dữ liệu thật khi refetch
            if (!exists) draft.data.unshift({ recipe_id: recipeId } as SavedRecipeItem);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    // 6. Bỏ lưu công thức (cập nhật lạc quan tương tự)
    unsaveRecipe: builder.mutation<ApiResponse, string | number>({
      query: (recipeId) => ({
        url: `/library/saved/${recipeId}`,
        method: 'delete',
      }),
      invalidatesTags: ['SavedRecipe'],
      async onQueryStarted(recipeId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          apiSlice.util.updateQueryData('getSavedRecipes', undefined, (draft) => {
            if (!draft?.data) return;
            draft.data = draft.data.filter(
              (item) => String(item.recipe_id || item.recipe?.id) !== String(recipeId)
            );
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    // 7. Công thức Của tôi (CRUD)
    getMyRecipes: builder.query<ApiResponse<Recipe[]>, void>({
      query: () => ({ url: '/library/my', method: 'get' }),
      providesTags: ['MyRecipe'],
    }),

    // 8. Chi tiết công thức theo ID hoặc Slug
    // Không để GET đếm lượt xem: dữ liệu có thể được tải trước (chạm vào thẻ) hoặc dùng ở chế độ nấu.
    // Màn chi tiết tự gọi trackRecipeView khi người dùng thật sự mở trang.
    getRecipeDetails: builder.query<ApiResponse<Recipe>, string | number>({
      query: (idOrSlug) => ({
        url: `/recipes/${idOrSlug}`,
        method: 'get',
        headers: { 'X-Skip-View-Tracking': '1' },
      }),
      providesTags: (_result, _error, id) => [{ type: 'Recipe', id }],
    }),

    // 8.1 Ghi nhận 1 lượt xem công thức (server trả 204 ngay, xử lý ở nền)
    trackRecipeView: builder.mutation<void, string | number>({
      query: (id) => ({ url: `/recipes/${id}/view`, method: 'post' }),
    }),

    // 9. Lấy sở thích và dị ứng của người dùng
    getPreferences: builder.query<ApiResponse<UserPreferences>, void>({
      query: () => ({ url: '/user/preferences', method: 'get' }),
      providesTags: ['Preferences'],
    }),

    // 10. Cập nhật sở thích & danh sách dị ứng cứng
    updatePreferences: builder.mutation<ApiResponse, any>({
      query: (data) => ({
        url: '/user/preferences',
        method: 'put',
        data,
      }),
      invalidatesTags: ['Preferences', 'Recipe'],
    }),

    // 10.1. Lấy danh sách allergy options từ DB (ingredients thật với UUID)
    getAllergyOptions: builder.query<ApiResponse<AllergyOption[]>, void>({
      query: () => ({ url: '/user/allergy-options', method: 'get' }),
    }),

    // 10.1b. Tìm nguyên liệu trong kho (chọn dị ứng từng nguyên liệu); search rỗng → nguyên liệu phổ biến
    searchIngredients: builder.query<ApiResponse<IngredientOption[]>, string>({
      query: (search) => ({ url: '/user/ingredients', method: 'get', params: { search, limit: 20 } }),
    }),

    // 10.2. Lấy danh sách category options từ DB
    getCategoryOptions: builder.query<ApiResponse<CategoryOption[]>, void>({
      query: () => ({ url: '/user/category-options', method: 'get' }),
    }),

    // 11. Thêm công thức Của tôi
    createMyRecipe: builder.mutation<ApiResponse<Recipe>, any>({
      query: (data) => ({
        url: '/library/my',
        method: 'post',
        data,
      }),
      invalidatesTags: ['MyRecipe', 'Recipe'],
    }),

    // 12. Cập nhật công thức Của tôi
    updateMyRecipe: builder.mutation<ApiResponse, { id: number | string; data: any }>({
      query: ({ id, data }) => ({
        url: `/library/my/${id}`,
        method: 'put',
        data,
      }),
      invalidatesTags: ['MyRecipe', 'Recipe'],
    }),

    // 12b. Tải ảnh món ăn (base64) → URL công khai trên Supabase Storage
    uploadRecipeImage: builder.mutation<ApiResponse<{ url: string }>, { base64: string; mime_type?: string }>({
      query: (data) => ({
        url: '/library/upload-image',
        method: 'post',
        data,
        timeout: 60000,
      }),
    }),

    // 13. Xóa công thức (Soft delete vào Thùng rác)
    deleteMyRecipe: builder.mutation<ApiResponse, number | string>({
      query: (id) => ({
        url: `/library/my/${id}`,
        method: 'delete',
      }),
      invalidatesTags: ['MyRecipe', 'Recipe'],
    }),

    // 14. Khôi phục công thức từ Thùng rác
    restoreMyRecipe: builder.mutation<ApiResponse, number | string>({
      query: (id) => ({
        url: `/library/my/${id}/restore`,
        method: 'post',
      }),
      invalidatesTags: ['MyRecipe', 'Recipe'],
    }),

    // 15. Lấy danh sách công thức trong Thùng rác
    getTrashRecipes: builder.query<ApiResponse<Recipe[]>, void>({
      query: () => ({ url: '/library/trash', method: 'get' }),
      providesTags: ['MyRecipe'],
    }),

    // 16. Đổi mật khẩu
    changePassword: builder.mutation<ApiResponse, { oldPassword: string; newPassword: string }>({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'put',
        data,
      }),
    }),

    // 17. Xóa tài khoản (2 bước, lưu trữ 30 ngày)
    deleteAccount: builder.mutation<ApiResponse, { password: string }>({
      query: (data) => ({
        url: '/auth/account',
        method: 'delete',
        data,
      }),
    }),

    // 18. Trợ lý ẩm thực AI (Sprint 6 - Chatbot Discovery Assistant)
    askChatbot: builder.mutation<ApiResponse<Recipe[]> & { intent?: any; message?: string }, { query: string }>({
      query: (body) => ({
        url: '/chatbot/discover',
        method: 'post',
        data: body,
      }),
    }),

    // 18.1 Trợ lý hỏi đáp nhiều lượt: gửi kèm lịch sử chat (+ ngữ cảnh món nếu hỏi từ trang chi tiết / chế độ nấu)
    chatAssistant: builder.mutation<
      ApiResponse<Recipe[]> & { mode?: 'ai' | 'basic'; suggestions?: string[] },
      { messages: { role: 'user' | 'assistant'; text: string }[]; recipe_id?: string; step?: number }
    >({
      query: (body) => ({
        url: '/chatbot/chat',
        method: 'post',
        data: body,
      }),
    }),

    // 19. Đánh dấu đã nấu xong (Lưu lịch sử & tăng lượt nấu)
    finishCooking: builder.mutation<ApiResponse, string | number>({
      query: (id) => ({
        url: `/recipes/${id}/finish-cooking`,
        method: 'post',
      }),
      invalidatesTags: ['Recipe'],
    }),
  }),
});

export const {
  usePrefetch,
  useGetRecipesPageInfiniteQuery,
  useTrackRecipeViewMutation,
  useGetDiscoverQuery,
  useGetCategoriesQuery,
  useSearchRecipesQuery,
  useGetProfileQuery,
  useGetSavedRecipesQuery,
  useSaveRecipeMutation,
  useUnsaveRecipeMutation,
  useGetMyRecipesQuery,
  useGetRecipeDetailsQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useGetAllergyOptionsQuery,
  useSearchIngredientsQuery,
  useGetCategoryOptionsQuery,
  useCreateMyRecipeMutation,
  useUpdateMyRecipeMutation,
  useUploadRecipeImageMutation,
  useDeleteMyRecipeMutation,
  useRestoreMyRecipeMutation,
  useGetTrashRecipesQuery,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useAskChatbotMutation,
  useChatAssistantMutation,
  useFinishCookingMutation,
} = apiSlice;


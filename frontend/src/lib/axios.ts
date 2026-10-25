import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { API_BASE_URL } from '@/constants/api';
import { secureStorage } from './storage';
import { MOCK_DISCOVER, MOCK_RECIPES, MOCK_USER } from './mockData';
import { Recipe } from '@/types/api';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Cho phép bật Mock adapter nếu cần chạy hoàn toàn độc lập (set EXPO_PUBLIC_USE_MOCK=true)
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

if (USE_MOCK) {
  const mock = new MockAdapter(axiosInstance, { delayResponse: 400 });

  mock.onGet('/health').reply(200, {
    success: true,
    message: 'Backend Mock đang hoạt động tốt',
  });

  mock.onPost('/auth/login').reply((config) => {
    const { email } = JSON.parse(config.data || '{}');
    return [
      200,
      {
        success: true,
        message: 'Đăng nhập thành công',
        token: 'mock_jwt_token_sample_1234567890',
        data: { ...MOCK_USER, email: email || MOCK_USER.email },
      },
    ];
  });

  mock.onPost('/auth/register').reply((config) => {
    const { email, name } = JSON.parse(config.data || '{}');
    return [
      201,
      {
        success: true,
        message: 'Đăng ký thành công',
        token: 'mock_jwt_token_sample_1234567890',
        data: { ...MOCK_USER, email, name },
      },
    ];
  });

  mock.onGet('/auth/profile').reply(200, {
    success: true,
    data: MOCK_USER,
  });

  mock.onGet('/recipes/discover').reply(200, {
    success: true,
    data: MOCK_DISCOVER,
  });

  mock.onGet('/recipes/search').reply((config) => {
    const params = config.params || {};
    let filtered = [...MOCK_RECIPES];

    if (params.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (params.difficulty) {
      filtered = filtered.filter((r) => r.difficulty === params.difficulty);
    }
    if (params.max_time) {
      filtered = filtered.filter(
        (r) => (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0) <= Number(params.max_time)
      );
    }

    return [200, { success: true, data: filtered }];
  });

  // Mock chi tiết công thức
  mock.onGet(new RegExp('^/recipes/[0-9a-zA-Z_-]+$')).reply((config) => {
    const parts = (config.url || '').split('/');
    const idOrSlug = parts[parts.length - 1];
    const found = MOCK_RECIPES.find(
      (r) => String(r.id) === idOrSlug || r.slug === idOrSlug
    );
    if (found) {
      return [200, { success: true, data: found }];
    }
    return [200, { success: true, data: MOCK_RECIPES[0] }];
  });

  // Mock sở thích & dị ứng
  let mockPreferences = {
    preferred_diet_type: 'omnivore',
    preferred_tastes: 'Đậm đà, ít ngọt',
    allergy_ingredient_ids: [] as string[], // UUID strings từ DB
    favorite_category_ids: [] as string[], // UUID strings từ DB
  };

  mock.onGet('/user/preferences').reply(200, {
    success: true,
    data: mockPreferences,
  });

  mock.onPut('/user/preferences').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    mockPreferences = { ...mockPreferences, ...data };
    return [200, { success: true, message: 'Cập nhật sở thích thành công', data: mockPreferences }];
  });

  // Mock lưu & bỏ lưu công thức
  let mockSavedIds: (string | number)[] = [1];

  mock.onGet('/library/saved').reply(() => {
    const savedRecipes = MOCK_RECIPES.filter((r) => mockSavedIds.includes(r.id)).map((r) => ({
      user_id: 1,
      recipe_id: r.id,
      recipe: r,
    }));
    return [200, { success: true, data: savedRecipes }];
  });

  mock.onPost('/library/saved').reply((config) => {
    const { recipe_id } = JSON.parse(config.data || '{}');
    if (recipe_id && !mockSavedIds.includes(Number(recipe_id))) {
      mockSavedIds.push(Number(recipe_id));
    }
    return [200, { success: true, message: 'Đã lưu công thức' }];
  });

  mock.onDelete(new RegExp('^/library/saved/\\d+$')).reply((config) => {
    const parts = (config.url || '').split('/');
    const id = Number(parts[parts.length - 1]);
    mockSavedIds = mockSavedIds.filter((item) => item !== id);
    return [200, { success: true, message: 'Đã bỏ lưu công thức' }];
  });

  // Mock Công thức Của tôi & Thùng rác
  let mockMyRecipes: Recipe[] = [MOCK_RECIPES[0], MOCK_RECIPES[3]];
  let mockTrashRecipes: any[] = [];

  mock.onGet('/library/my').reply(() => [200, { success: true, data: mockMyRecipes }]);

  mock.onPost('/library/my').reply((config) => {
    const payload = JSON.parse(config.data || '{}');
    const newR: Recipe = {
      ...payload,
      id: Date.now(),
      slug: payload.slug || `recipe-${Date.now()}`,
      owner_user_id: 1,
      image_url: payload.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    };
    mockMyRecipes.unshift(newR);
    return [201, { success: true, message: 'Đã tạo công thức thành công', data: newR }];
  });

  mock.onPut(new RegExp('^/library/my/\\d+$')).reply((config) => {
    const parts = (config.url || '').split('/');
    const id = Number(parts[parts.length - 1]);
    const payload = JSON.parse(config.data || '{}');
    mockMyRecipes = mockMyRecipes.map((r) => (r.id === id ? { ...r, ...payload } : r));
    return [200, { success: true, message: 'Cập nhật công thức thành công' }];
  });

  mock.onDelete(new RegExp('^/library/my/\\d+$')).reply((config) => {
    const parts = (config.url || '').split('/');
    const id = Number(parts[parts.length - 1]);
    const found = mockMyRecipes.find((r) => r.id === id);
    if (found) {
      mockMyRecipes = mockMyRecipes.filter((r) => r.id !== id);
      mockTrashRecipes.push({
        ...found,
        deleted_at: new Date().toISOString(),
      });
    }
    return [200, { success: true, message: 'Đã chuyển vào thùng rác' }];
  });

  mock.onGet('/library/trash').reply(() => [200, { success: true, data: mockTrashRecipes }]);

  mock.onPost(new RegExp('^/library/my/\\d+/restore$')).reply((config) => {
    const parts = (config.url || '').split('/');
    const id = Number(parts[parts.length - 2]);
    const found = mockTrashRecipes.find((r) => r.id === id);
    if (found) {
      mockTrashRecipes = mockTrashRecipes.filter((r) => r.id !== id);
      mockMyRecipes.unshift(found);
    }
    return [200, { success: true, message: 'Đã khôi phục công thức' }];
  });

  // Mock Đổi mật khẩu
  mock.onPut('/auth/change-password').reply((config) => {
    const { oldPassword, newPassword } = JSON.parse(config.data || '{}');
    if (!oldPassword || !newPassword) {
      return [400, { success: false, message: 'Vui lòng nhập đầy đủ mật khẩu' }];
    }
    return [200, { success: true, message: 'Đổi mật khẩu thành công' }];
  });

  // Mock Xóa tài khoản
  mock.onDelete('/auth/account').reply((config) => {
    const { password } = JSON.parse(config.data || '{}');
    if (!password) {
      return [400, { success: false, message: 'Mật khẩu là bắt buộc' }];
    }
    return [200, { success: true, message: 'Tài khoản đã được xóa (lưu giữ 30 ngày)' }];
  });

  // Mock Hoàn tất nấu ăn
  mock.onPost(new RegExp('^/recipes/[0-9a-zA-Z_-]+/finish-cooking$')).reply(() => {
    return [200, { success: true, message: 'Hoàn tất nấu ăn và ghi nhận lịch sử thành công' }];
  });

  // Mock Trợ lý AI (Chatbot Discovery)
  mock.onPost('/chatbot/discover').reply((config) => {
    const { query } = JSON.parse(config.data || '{}');
    const q = (query || '').toLowerCase();
    let recipes = [...MOCK_RECIPES];
    if (q.includes('gà')) {
      recipes = recipes.filter((r) => r.name.toLowerCase().includes('gà'));
    } else if (q.includes('bò')) {
      recipes = recipes.filter((r) => r.name.toLowerCase().includes('bò'));
    } else if (q.includes('chay')) {
      recipes = recipes.filter((r) => r.diet_type === 'vegetarian');
    }
    if (recipes.length === 0) {
      recipes = [MOCK_RECIPES[0], MOCK_RECIPES[1]];
    }

    const ingredients: string[] = [];
    if (q.includes('gà')) ingredients.push('gà');
    if (q.includes('bò')) ingredients.push('thịt bò');
    if (q.includes('sả')) ingredients.push('sả');

    return [
      200,
      {
        success: true,
        message: `Dựa trên yêu cầu "${query}", mình gợi ý ${recipes.length} món ngon phù hợp cho bạn:`,
        intent: {
          ingredients: ingredients.length > 0 ? ingredients : undefined,
          max_time: q.includes('30') ? 30 : null,
          difficulty: q.includes('dễ') ? 'easy' : null,
        },
        data: recipes,
      },
    ];
  });

  mock.onAny().passThrough();
}

// Request Interceptor: Tự động đính kèm Bearer token từ secureStorage
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await secureStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Bắt lỗi 401 & xử lý đăng xuất an toàn
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ success?: boolean; message?: string }>) => {
    if (error.response?.status === 401) {
      console.warn('Phiên đăng nhập hết hạn (401), đang xóa token...');
      await secureStorage.clearAll();
      // Bắn sự kiện hoặc callback đăng xuất
      if (typeof window !== 'undefined' && (window as any).__onAuthLogout) {
        (window as any).__onAuthLogout();
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

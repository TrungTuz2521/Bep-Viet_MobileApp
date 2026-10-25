import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants/api';
import { storage } from '@/utils/storage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Tự động gán JWT Token vào Header nếu có
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi tập trung & Token hết hạn (401)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<{ success?: boolean; message?: string }>) => {
    if (error.response) {
      // Khi token hết hạn hoặc không hợp lệ (401)
      if (error.response.status === 401) {
        // Tự động xóa thông tin đăng nhập cũ
        await storage.clearAuth();
      }
    } else if (error.request) {
      // Không kết nối được tới server (Network Error / Timeout)
      console.warn('Network Error: Không thể kết nối tới máy chủ backend tại', API_BASE_URL);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

import apiClient from './apiClient';
import { API_ENDPOINTS } from '@/constants/api';
import { ApiResponse, AuthResponse, User } from '@/types/api';
import { storage } from '@/utils/storage';

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  avatar_url?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export const authService = {
  // Kiểm tra kết nối tới Backend
  async checkHealth(): Promise<ApiResponse> {
    const res = await apiClient.get<ApiResponse>(API_ENDPOINTS.HEALTH);
    return res.data;
  },

  // Đăng ký tài khoản
  async register(payload: RegisterPayload): Promise<ApiResponse<User>> {
    const res = await apiClient.post<ApiResponse<User>>(API_ENDPOINTS.AUTH.REGISTER, payload);
    return res.data;
  },

  // Đăng nhập tài khoản & tự lưu token vào storage
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, payload);
    const { token, data: user } = res.data;

    if (token) {
      await storage.setToken(token);
    }
    if (user) {
      await storage.setUser(user);
    }

    return res.data;
  },

  // Lấy thông tin user hiện tại
  async getProfile(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.PROFILE);
    if (res.data.data) {
      await storage.setUser(res.data.data);
    }
    return res.data.data!;
  },

  // Cập nhật thông tin profile
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await apiClient.put<ApiResponse<User>>(API_ENDPOINTS.AUTH.PROFILE, payload);
    if (res.data.data) {
      await storage.setUser(res.data.data);
    }
    return res.data.data!;
  },

  // Đổi mật khẩu
  async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse> {
    const res = await apiClient.put<ApiResponse>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
    return res.data;
  },

  // Xóa tài khoản
  async deleteAccount(password: string): Promise<ApiResponse> {
    const res = await apiClient.delete<ApiResponse>(API_ENDPOINTS.AUTH.DELETE_ACCOUNT, {
      data: { password },
    });
    await storage.clearAuth();
    return res.data;
  },

  // Đăng xuất
  async logout(): Promise<void> {
    await storage.clearAuth();
  },
};

export default authService;

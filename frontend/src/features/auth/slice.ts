import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from './types';
import { User } from '@/types/api';
import { secureStorage } from '@/lib/storage';
import axiosInstance from '@/lib/axios';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Thời điểm gia hạn phiên gần nhất (để khi app quay lại từ nền chỉ gia hạn khi đã lâu)
let lastVerifiedAt = 0;
export const SESSION_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
export const isSessionRefreshDue = () => Date.now() - lastVerifiedAt > SESSION_REFRESH_INTERVAL_MS;

// 1.1 Xác thực + GIA HẠN phiên ở nền (không chặn màn hình khởi động):
// token còn hạn → server cấp token mới 30 ngày + hồ sơ mới nhất.
// Nhờ vậy còn mở app ít nhất 1 lần / 30 ngày thì không bao giờ bị đăng xuất.
export const verifySessionThunk = createAsyncThunk(
  'auth/verifySession',
  async (token: string) => {
    lastVerifiedAt = Date.now();
    const headers = { Authorization: `Bearer ${token}` };
    try {
      let liveUser: User | null = null;
      let newToken: string | null = null;
      try {
        const res = await axiosInstance.post('/auth/refresh', null, { headers });
        liveUser = res.data.data || null;
        newToken = res.data.token || null;
      } catch (e: any) {
        // Server bản cũ chưa có /auth/refresh → chỉ xác thực như trước
        if (e?.response?.status !== 404) throw e;
        const res = await axiosInstance.get('/auth/profile', { headers });
        liveUser = res.data.data || null;
      }
      if (newToken) await secureStorage.setToken(newToken);
      if (liveUser) await secureStorage.setUser(liveUser);
      return { user: liveUser, token: newToken, expired: false };
    } catch (e: any) {
      // 401/403: token hết hạn hoặc tài khoản bị khóa → đăng xuất.
      // Lỗi mạng (offline): giữ phiên đã lưu.
      const status = e?.response?.status;
      const expired = status === 401 || status === 403;
      if (expired) await secureStorage.clearAll();
      else lastVerifiedAt = 0; // lỗi mạng → lần mở app / quay lại sau thử gia hạn tiếp
      return { user: null, token: null, expired };
    }
  }
);

// 1. Phục hồi phiên đăng nhập khi khởi động app
// Có user đã lưu → vào app NGAY (chỉ đọc bộ nhớ máy), xác thực token ở nền.
// Trước đây splash phải chờ gọi /auth/profile (tới 10s timeout nếu mất mạng).
export const restoreSessionThunk = createAsyncThunk(
  'auth/restoreSession',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = await secureStorage.getToken();
      const storedUser = await secureStorage.getUser();

      if (!token) return null;

      if (storedUser) {
        dispatch(verifySessionThunk(token));
        return { token, user: storedUser };
      }

      // Có token nhưng chưa có user lưu → bắt buộc chờ lấy profile
      try {
        const res = await axiosInstance.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const liveUser = res.data.data;
        if (!liveUser) {
          await secureStorage.clearAll();
          return null;
        }
        await secureStorage.setUser(liveUser);
        dispatch(verifySessionThunk(token));
        return { token, user: liveUser };
      } catch {
        await secureStorage.clearAll();
        return null;
      }
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

// 2. Thunk đăng nhập
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/login', payload);
      const { token, data: user } = res.data;
      if (token) await secureStorage.setToken(token);
      if (user) await secureStorage.setUser(user);
      lastVerifiedAt = Date.now();
      return { token, user };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      return rejectWithValue(msg);
    }
  }
);

// 3. Thunk đăng ký
export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: { email: string; password: string; name: string }, { rejectWithValue }) => {
    try {
      await axiosInstance.post('/auth/register', payload);
      // Tự động đăng nhập sau khi tạo tài khoản
      const loginRes = await axiosInstance.post('/auth/login', {
        email: payload.email,
        password: payload.password,
      });
      const { token, data: user } = loginRes.data;
      if (token) await secureStorage.setToken(token);
      if (user) await secureStorage.setUser(user);
      lastVerifiedAt = Date.now();
      return { token, user };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại';
      return rejectWithValue(msg);
    }
  }
);

import { apiSlice } from '@/store/apiSlice';

// 4. Thunk đăng xuất
export const logoutThunk = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  await secureStorage.clearAll();
  dispatch(apiSlice.util.resetApiState());
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    // Cập nhật thông tin người dùng (vd sau khi đổi ảnh đại diện)
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // restoreSession
    builder
      .addCase(restoreSessionThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      })
      .addCase(restoreSessionThunk.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })
      // Kết quả xác thực nền — bỏ qua nếu người dùng đã đổi phiên (đăng xuất / đăng nhập tài khoản khác)
      .addCase(verifySessionThunk.fulfilled, (state, action) => {
        if (state.token !== action.meta.arg) return;
        if (action.payload.expired) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        } else {
          if (action.payload.user) state.user = action.payload.user;
          if (action.payload.token) state.token = action.payload.token;
        }
      });

    // login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Đăng nhập thất bại';
      });

    // register
    builder
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Đăng ký thất bại';
      });

    // logout
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });
  },
});

export const { clearAuthError, setCredentials, setUser } = authSlice.actions;
export default authSlice.reducer;

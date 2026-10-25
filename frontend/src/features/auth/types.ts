import { User } from '@/types/api';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PendingAction {
  type: string;
  payload?: any;
  title?: string; // Tên hành động để hiển thị toast/thông báo nếu cần
}

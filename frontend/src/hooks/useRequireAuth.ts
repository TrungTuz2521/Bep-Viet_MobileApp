import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store';
import { setPendingAction } from '@/store/uiSlice';
import { PendingAction } from '@/features/auth/types';

/**
 * ACTION GATE HOOK
 * Không theo dõi đường dẫn hiện tại (usePathname): hook được dùng ở cả 3 tab, nếu theo dõi thì
 * MỖI lần chuyển trang cả 3 tab (kèm danh sách món) đều vẽ lại đúng lúc chạy hiệu ứng → giật.
 * Màn gọi truyền returnTo (đường dẫn quay lại sau khi đăng nhập).
 * Dùng chung cho mọi nút và hành động yêu cầu đăng nhập (Lưu, Thêm công thức, Vào bếp, v.v.).
 * - Nếu đã đăng nhập: Thực thi action ngay lập tức.
 * - Nếu là Khách: Tự động lưu pendingAction và đường dẫn hiện tại (returnTo) vào Redux uiSlice,
 *   sau đó chuyển hướng sang màn hình /(auth)/login.
 */
export const useRequireAuth = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const requireAuth = useCallback(
    (
      action: PendingAction | (() => void | Promise<void>),
      customReturnTo?: string
    ) => {
      if (isAuthenticated) {
        // Đã đăng nhập -> Thực thi ngay
        if (typeof action === 'function') {
          return action();
        }
        return;
      }

      // Chưa đăng nhập (Guest) -> Kích hoạt Action Gate
      const currentPath = customReturnTo || '/';
      const pending: PendingAction =
        typeof action === 'function'
          ? { type: 'GENERIC_CALLBACK', title: 'Hành động yêu cầu đăng nhập' }
          : action;

      dispatch(
        setPendingAction({
          action: pending,
          returnTo: currentPath,
        })
      );

      // Điều hướng người dùng tới màn hình đăng nhập
      router.push('/(auth)/login');
    },
    [isAuthenticated, router, dispatch]
  );

  return {
    requireAuth,
    isAuthenticated,
  };
};

export default useRequireAuth;

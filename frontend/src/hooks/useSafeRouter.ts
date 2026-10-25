import { useMemo } from 'react';
import { useRouter } from 'expo-router';

// Thời gian khoá sau mỗi lần chuyển trang (≈ thời lượng hiệu ứng chuyển màn)
const NAV_LOCK_MS = 600;

// Khoá dùng chung toàn app: bấm nhanh món A rồi món B (hai thẻ khác nhau)
// cũng chỉ mở một trang
let lockedUntil = 0;

function acquireNavLock() {
  const now = Date.now();
  if (now < lockedUntil) return false;
  lockedUntil = now + NAV_LOCK_MS;
  return true;
}

/**
 * Giống useRouter() nhưng push/navigate bỏ qua các lần bấm liên tiếp trong lúc
 * đang chuyển trang → không bị chồng nhiều trang giống nhau khi chạm nhiều lần.
 * back/replace giữ nguyên hành vi gốc.
 */
export function useSafeRouter() {
  const router = useRouter();
  return useMemo(
    () => ({
      ...router,
      push: ((...args) => {
        if (acquireNavLock()) router.push(...args);
      }) as typeof router.push,
      navigate: ((...args) => {
        if (acquireNavLock()) router.navigate(...args);
      }) as typeof router.navigate,
    }),
    [router]
  );
}

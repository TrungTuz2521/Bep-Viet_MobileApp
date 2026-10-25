import { useEffect, useState } from 'react';
import { useNavigation } from 'expo-router';

// Dự phòng khi không nhận được sự kiện kết thúc chuyển trang (vd mở lại từ deep link, tắt hiệu ứng)
const FALLBACK_MS = 450;

/**
 * Trả về true sau khi hiệu ứng chuyển trang (push) chạy xong.
 * Dùng để hoãn vẽ phần nặng của màn mới: luồng JS rảnh trong lúc hiệu ứng chạy → chuyển trang mượt.
 */
export function useAfterTransition() {
  const navigation = useNavigation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const done = () => setReady(true);
    const timer = setTimeout(done, FALLBACK_MS);
    // 'transitionEnd' của native stack; kiểu sự kiện khác nhau giữa navigator nên ép kiểu
    const unsubscribe = (navigation as any).addListener?.('transitionEnd', (e: any) => {
      if (!e?.data?.closing) done();
    });
    return () => {
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, [navigation, ready]);

  return ready;
}

export default useAfterTransition;

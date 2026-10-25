import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Trả về true khi bàn phím đang mở.
 * Dùng để bỏ khoảng safe area đáy khi bàn phím đã che home indicator.
 */
export const useKeyboardVisible = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // iOS có sự kiện "Will" giúp cập nhật trước khi animation bàn phím chạy
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
};

export default useKeyboardVisible;

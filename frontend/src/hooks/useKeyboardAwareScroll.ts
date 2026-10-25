import { useEffect, useRef } from 'react';
import { Keyboard, NativeScrollEvent, NativeSyntheticEvent, ScrollView, TextInput } from 'react-native';

// Khoảng hở giữa đáy ô nhập và mép trên vùng nhìn thấy (bàn phím / thanh nút đáy)
const GAP = 24;

/**
 * Tự cuộn ScrollView để ô đang nhập không bị bàn phím che.
 * - Khi bàn phím mở: cuộn ô đang focus lên trên bàn phím.
 * - Khi chuyển sang ô khác lúc bàn phím đang mở: gọi onInputFocus trong onFocus của ô đó.
 * Dùng kèm KeyboardAvoidingView (padding) để ScrollView co lại phía trên bàn phím.
 */
export function useKeyboardAwareScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureFocusedVisible = () => {
    const kbTop = keyboardTop.current;
    const input = TextInput.State.currentlyFocusedInput() as any;
    const scroll = scrollRef.current as any;
    if (kbTop === null || !input?.measureInWindow || !scroll?.measureInWindow) return;

    scroll.measureInWindow((_sx: number, sy: number, _sw: number, sh: number) => {
      // Đáy vùng nhìn thấy = đáy ScrollView (đã co nhờ KeyboardAvoidingView) hoặc mép bàn phím
      const visibleBottom = Math.min(sy + sh, kbTop);
      input.measureInWindow((_x: number, y: number, _w: number, h: number) => {
        // Cuộn đủ để thấy đáy ô, nhưng không đẩy đầu ô (ô nhiều dòng cao) ra khỏi mép trên
        const overlap = Math.min(y + h + GAP - visibleBottom, y - sy - GAP);
        if (overlap > 0) {
          scrollRef.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
        } else if (y < sy) {
          // Ô bị khuất phía trên (vd sau khi xoá dòng) → kéo xuống cho thấy
          scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current - (sy - y) - GAP), animated: true });
        }
      });
    });
  };

  const schedule = (delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(ensureFocusedVisible, delay);
  };

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      keyboardTop.current = e.endCoordinates.screenY;
      // Chờ KeyboardAvoidingView co ScrollView xong rồi mới đo
      schedule(120);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
    });
    return () => {
      show.remove();
      hide.remove();
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  /** Gắn vào onFocus của mỗi ô nhập (bàn phím đang mở thì sự kiện mở bàn phím không bắn lại) */
  const onInputFocus = () => schedule(60);

  return { scrollRef, onScroll, onInputFocus };
}

export default useKeyboardAwareScroll;

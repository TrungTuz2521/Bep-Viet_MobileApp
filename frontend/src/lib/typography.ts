import { StyleSheet, TextStyle } from 'react-native';

/**
 * Quy ước chữ dùng chung.
 * Android: khi tắt includeFontPadding thì BẮT BUỘC có lineHeight rõ ràng (~1.35 × cỡ chữ),
 * nếu không dấu tiếng Việt chồng tầng (Ệ, Ố, Ữ, Ỷ) bị cắt ở mép trên/dưới.
 */
export const LINE_HEIGHT_RATIO = 1.35;

export const lineHeightFor = (fontSize: number) => Math.round(fontSize * LINE_HEIGHT_RATIO);

/**
 * Emoji đứng riêng (icon trong chip, nút, FAB, minh họa): cố định cỡ chữ, chiều cao dòng và bề rộng
 * để emoji (font Noto Color Emoji trên Android cao hơn chữ thường) không làm lệch chiều cao dòng.
 */
export const emojiText = (size: number): TextStyle => ({
  fontSize: size,
  lineHeight: Math.round(size * 1.25),
  width: Math.round(size * 1.3),
  textAlign: 'center',
  includeFontPadding: false,
});

/** Các kiểu chữ dùng sẵn cho component mới */
export const typography = StyleSheet.create({
  title: { fontSize: 22, lineHeight: lineHeightFor(22), fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: lineHeightFor(18), fontWeight: '700' },
  body: { fontSize: 15, lineHeight: lineHeightFor(15) },
  bodySmall: { fontSize: 13, lineHeight: lineHeightFor(13) },
  label: { fontSize: 14, lineHeight: lineHeightFor(14), fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: lineHeightFor(12) },
});

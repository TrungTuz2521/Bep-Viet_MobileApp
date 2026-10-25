// Biểu tượng + màu nền theo LOẠI MÓN (dùng cho ảnh mặc định của thẻ món & trang chi tiết)

export type FoodTint = 'amber' | 'yellow' | 'pink' | 'sky' | 'orange' | 'rose' | 'green' | 'stone';

export interface FoodVisual {
  emoji: string;
  tint: FoodTint;
}

/** Nền pastel cho ô ảnh mặc định: [sáng, tối] */
export const FOOD_TINTS: Record<FoodTint, { light: string; dark: string; borderLight: string; borderDark: string }> = {
  amber: { light: '#FEF3C7', dark: 'rgba(245, 158, 11, 0.16)', borderLight: '#FDE68A', borderDark: 'rgba(245, 158, 11, 0.28)' },
  yellow: { light: '#FEF9C3', dark: 'rgba(234, 179, 8, 0.16)', borderLight: '#FEF08A', borderDark: 'rgba(234, 179, 8, 0.28)' },
  pink: { light: '#FCE7F3', dark: 'rgba(236, 72, 153, 0.16)', borderLight: '#FBCFE8', borderDark: 'rgba(236, 72, 153, 0.28)' },
  sky: { light: '#E0F2FE', dark: 'rgba(14, 165, 233, 0.16)', borderLight: '#BAE6FD', borderDark: 'rgba(14, 165, 233, 0.28)' },
  orange: { light: '#FFEDD5', dark: 'rgba(249, 115, 22, 0.16)', borderLight: '#FED7AA', borderDark: 'rgba(249, 115, 22, 0.28)' },
  rose: { light: '#FFE4E6', dark: 'rgba(244, 63, 94, 0.16)', borderLight: '#FECDD3', borderDark: 'rgba(244, 63, 94, 0.28)' },
  green: { light: '#DCFCE7', dark: 'rgba(34, 197, 94, 0.16)', borderLight: '#BBF7D0', borderDark: 'rgba(34, 197, 94, 0.28)' },
  stone: { light: '#F5F5F4', dark: 'rgba(168, 162, 158, 0.16)', borderLight: '#E7E5E4', borderDark: 'rgba(168, 162, 158, 0.28)' },
};

// Thứ tự quan trọng: loại món (bún, cháo, cuốn...) xét TRƯỚC nguyên liệu (bò, gà...)
// → "Bún bò Huế" ra 🍜, "Gỏi cuốn tôm" ra 🌯, "Gỏi bò" ra 🥗, "Cá kho tộ" ra 🐟
const RULES: { words: string[]; visual: FoodVisual }[] = [
  // Món nước xét đầu tiên: "Lẩu mắm", "Lẩu cá nước dừa" vẫn là lẩu
  { words: ['bánh canh'], visual: { emoji: '🍜', tint: 'yellow' } },
  { words: ['lẩu'], visual: { emoji: '🍲', tint: 'amber' } },
  { words: ['cháo'], visual: { emoji: '🥣', tint: 'amber' } },
  { words: ['canh', 'súp', 'soup'], visual: { emoji: '🍲', tint: 'amber' } },
  // Đồ chấm / dưa muối xét trước món chính: "Nước chấm bún chả" là nước chấm, không phải món bún
  { words: ['dưa góp', 'dưa cải', 'dưa muối', 'dưa chua', 'cà muối', 'muối chua', 'muối xổi', 'kim chi', 'củ kiệu'], visual: { emoji: '🥒', tint: 'green' } },
  { words: ['nước chấm', 'nước mắm', 'mắm', 'muối', 'tương', 'sốt', 'nước sốt', 'xì dầu'], visual: { emoji: '🧂', tint: 'amber' } },
  { words: ['sinh tố', 'nước ép', 'trà', 'cà phê', 'sữa chua', 'nước uống', 'đồ uống', 'giải khát', 'rau má', 'nước chanh', 'nước sâm', 'nước lá', 'nước mía', 'nước dừa', 'sữa', 'đá me', 'soda'], visual: { emoji: '🥤', tint: 'sky' } },
  { words: ['chè', 'flan', 'kem', 'tráng miệng', 'thạch', 'rau câu', 'sương sáo'], visual: { emoji: '🍮', tint: 'pink' } },
  // "Khoai mì" là củ sắn (không phải mì), "Cá cơm" là cá (không phải cơm)
  { words: ['khoai'], visual: { emoji: '🍠', tint: 'orange' } },
  { words: ['cá cơm'], visual: { emoji: '🐟', tint: 'sky' } },
  { words: ['cuốn', 'chả giò', 'nem rán', 'ram', 'bò bía'], visual: { emoji: '🌯', tint: 'green' } },
  { words: ['bánh mì'], visual: { emoji: '🥖', tint: 'orange' } },
  { words: ['bún', 'phở', 'mì', 'miến', 'hủ tiếu', 'hủ tíu', 'bánh canh', 'cao lầu'], visual: { emoji: '🍜', tint: 'yellow' } },
  { words: ['xôi'], visual: { emoji: '🍙', tint: 'stone' } },
  { words: ['cơm'], visual: { emoji: '🍚', tint: 'stone' } },
  { words: ['bánh'], visual: { emoji: '🥟', tint: 'yellow' } },
  { words: ['gỏi', 'nộm', 'salad'], visual: { emoji: '🥗', tint: 'green' } },
  { words: ['tôm', 'cua', 'ghẹ', 'ốc', 'mực', 'nghêu', 'sò', 'hến', 'hàu', 'hải sản', 'bạch tuộc'], visual: { emoji: '🦐', tint: 'sky' } },
  { words: ['cá', 'lươn'], visual: { emoji: '🐟', tint: 'sky' } },
  { words: ['gà', 'vịt', 'ngan', 'chim', 'cánh', 'đùi'], visual: { emoji: '🍗', tint: 'orange' } },
  { words: ['bò'], visual: { emoji: '🥩', tint: 'rose' } },
  { words: ['heo', 'lợn', 'sườn', 'ba chỉ', 'thịt', 'giò', 'chả', 'lòng'], visual: { emoji: '🍖', tint: 'rose' } },
  { words: ['trứng', 'đậu hũ', 'đậu phụ', 'tàu hũ'], visual: { emoji: '🍳', tint: 'yellow' } },
  { words: ['rau', 'chay', 'nấm', 'cải', 'bí', 'đậu', 'dưa'], visual: { emoji: '🥗', tint: 'green' } },
  { words: ['nướng', 'xiên'], visual: { emoji: '🍢', tint: 'orange' } },
  { words: ['chiên', 'rán', 'kho', 'rim', 'xào'], visual: { emoji: '🥘', tint: 'orange' } },
];

const DEFAULT_VISUAL: FoodVisual = { emoji: '🍽️', tint: 'stone' };

// So khớp theo TỪ (không phải chuỗi con): "cá" không khớp "các", "trà" không khớp "trái"
const hasWord = (text: string, word: string) => ` ${text} `.includes(` ${word} `);

/** Biểu tượng + màu nền phù hợp theo tên món (và tên danh mục nếu có) */
export const getFoodVisual = (name: string = '', categoryName?: string | null): FoodVisual => {
  const text = name.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  for (const rule of RULES) {
    if (rule.words.some((w) => hasWord(text, w))) return rule.visual;
  }
  if (categoryName) {
    const fromCategory = getFoodVisual(categoryName);
    if (fromCategory !== DEFAULT_VISUAL) return fromCategory;
  }
  return DEFAULT_VISUAL;
};

// Icon ẩm thực phù hợp theo tên món (dùng chung cho thẻ món & trang chi tiết)
export const getFoodIcon = (name: string = '') => getFoodVisual(name).emoji;

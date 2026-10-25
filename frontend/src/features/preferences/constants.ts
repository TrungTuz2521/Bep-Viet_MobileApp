import type { RecipeTaste, TastePreferences } from '@/types/api';

export const EMPTY_TASTES: TastePreferences = { spicy: null, salty: null, sweet: null, oily: null };

type TasteKey = keyof TastePreferences;

export interface TasteRow {
  key: TasteKey;
  emoji: string;
  title: string;
  options: { value: string; label: string; hint: string }[];
}

/**
 * Khẩu vị theo mức (ngưỡng tính trên 1 khẩu phần, ước tính từ định lượng công thức).
 * Lựa chọn kiểu "tránh" (Không ăn cay, Ăn nhạt, Ít ngọt, Ít dầu mỡ) → ẩn món không hợp;
 * lựa chọn kiểu "thích" → chỉ đưa món hợp lên đầu.
 */
export const TASTE_ROWS: TasteRow[] = [
  {
    key: 'spicy',
    emoji: '🌶',
    title: 'Độ cay',
    options: [
      { value: 'none', label: 'Không ăn cay', hint: 'Ẩn món có ớt, sa tế, tương ớt' },
      { value: 'mild', label: 'Cay nhẹ', hint: 'Ưu tiên món cay nhẹ' },
      { value: 'love', label: 'Thích cay', hint: 'Ưu tiên món cay' },
    ],
  },
  {
    key: 'salty',
    emoji: '🧂',
    title: 'Độ mặn',
    options: [
      { value: 'light', label: 'Ăn nhạt', hint: 'Ẩn món đậm/mặn (trên ~1.200 mg natri/khẩu phần)' },
      { value: 'normal', label: 'Bình thường', hint: 'Không lọc theo độ mặn' },
      { value: 'rich', label: 'Đậm đà', hint: 'Ưu tiên món đậm vị' },
    ],
  },
  {
    key: 'sweet',
    emoji: '🍬',
    title: 'Độ ngọt',
    options: [
      { value: 'less', label: 'Ít ngọt', hint: 'Ẩn món ngọt (trên ~10 g đường/khẩu phần)' },
      { value: 'normal', label: 'Bình thường', hint: 'Không lọc theo độ ngọt' },
      { value: 'love', label: 'Thích ngọt', hint: 'Ưu tiên món ngọt' },
    ],
  },
  {
    key: 'oily',
    emoji: '💧',
    title: 'Dầu mỡ',
    options: [
      { value: 'less', label: 'Ít dầu mỡ', hint: 'Ẩn món nhiều béo (trên ~18 g chất béo/khẩu phần)' },
      { value: 'normal', label: 'Bình thường', hint: 'Không lọc theo độ béo' },
    ],
  },
];

/** Chế độ ăn (lọc riêng, khác khẩu vị) — khớp enum preferred_diet_type ở backend */
export const DIET_OPTIONS = [
  { id: 'omnivore', label: '🍽 Ăn mặn (mọi món)' },
  { id: 'vegetarian', label: '🥗 Ăn chay' },
  { id: 'vegan', label: '🌱 Thuần chay' },
  { id: 'pescatarian', label: '🐟 Chay có cá' },
  { id: 'keto', label: '🥑 Keto ít tinh bột' },
];

/** Khẩu vị kiểu "tránh" đang bật (dùng để báo người dùng ở màn Tìm kiếm) */
export function activeAvoidLabels(t?: Partial<TastePreferences> | null): string[] {
  if (!t) return [];
  const labels: string[] = [];
  if (t.spicy === 'none') labels.push('Không ăn cay');
  if (t.salty === 'light') labels.push('Ăn nhạt');
  if (t.sweet === 'less') labels.push('Ít ngọt');
  if (t.oily === 'less') labels.push('Ít dầu mỡ');
  return labels;
}

/** Nhãn vị hiển thị trên thẻ món (chỉ hiện vị nổi bật để thẻ gọn) */
export function recipeTasteBadges(taste?: RecipeTaste | null): { key: string; text: string }[] {
  if (!taste) return [];
  const badges: { key: string; text: string }[] = [];
  if (taste.spicy === 2) badges.push({ key: 'spicy', text: '🌶 Cay' });
  else if (taste.spicy === 1) badges.push({ key: 'spicy', text: '🌶 Cay nhẹ' });
  if (taste.salty === 3) badges.push({ key: 'salty', text: '🧂 Đậm' });
  if (taste.sweet === 3) badges.push({ key: 'sweet', text: '🍬 Ngọt' });
  if (taste.fat === 3) badges.push({ key: 'fat', text: '💧 Nhiều béo' });
  return badges;
}

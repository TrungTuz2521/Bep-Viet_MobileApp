import { z } from 'zod';
import type { Recipe } from '@/types/api';

/** "0,5" → 0.5 · "1/2" → 0.5 · "1 1/2" → 1.5 · "200" → 200; không hợp lệ → null (khớp backend) */
export function parseAmount(value: string): number | null {
  const s = String(value ?? '').trim().replace(',', '.');
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return Number(m[3]) > 0 ? Number(m[1]) + Number(m[2]) / Number(m[3]) : null;
  m = s.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (m) return Number(m[2]) > 0 ? Number(m[1]) / Number(m[2]) : null;
  if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 ? n : null;
}

const isBlank = (v?: string | null) => !v || v.trim().length === 0;

/** Ô số nguyên (để trống = 0); trả lỗi khi gõ chữ hoặc vượt giới hạn */
const intField = (label: string, min: number, max: number) =>
  z.string().refine((v) => {
    if (isBlank(v)) return min === 0;
    return /^\d+$/.test(v.trim()) && Number(v) >= min && Number(v) <= max;
  }, min > 0 ? `${label}: nhập số từ ${min} đến ${max}` : `${label}: nhập số từ 0 đến ${max}`);

export const recipeIngredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
  unit: z.string().optional(),
  /** Có khi người dùng chọn từ gợi ý kho nguyên liệu */
  ingredient_id: z.string().optional(),
});

export const recipeStepSchema = z.object({
  instruction: z.string(),
  /** Hẹn giờ cho bước (phút), để trống = không hẹn giờ */
  timer_minutes: z.string(),
});

export const recipeFormSchema = z
  .object({
    name: z.string().refine((v) => v.trim().length >= 3, 'Tên món ăn phải từ 3 ký tự trở lên'),
    description: z.string().optional(),
    prep_time_minutes: intField('Chuẩn bị', 0, 1440),
    cook_time_minutes: intField('Nấu', 0, 1440),
    servings: intField('Khẩu phần', 1, 100),
    image_url: z.string().optional(),
    visibility: z.enum(['public', 'private']),
    category_ids: z.array(z.string()),
    ingredients: z.array(recipeIngredientSchema),
    steps: z.array(recipeStepSchema),
  })
  .superRefine((data, ctx) => {
    // Dòng nguyên liệu để trống hoàn toàn → bỏ qua (không chặn nút Lưu)
    let validIngredients = 0;
    data.ingredients.forEach((ing, i) => {
      if (isBlank(ing.name) && isBlank(ing.amount)) return;
      if (isBlank(ing.name)) {
        ctx.addIssue({ code: 'custom', path: ['ingredients', i, 'name'], message: 'Nhập tên nguyên liệu' });
        return;
      }
      if (isBlank(ing.amount)) {
        ctx.addIssue({ code: 'custom', path: ['ingredients', i, 'amount'], message: 'Nhập lượng' });
        return;
      }
      if (parseAmount(ing.amount) === null) {
        ctx.addIssue({ code: 'custom', path: ['ingredients', i, 'amount'], message: 'Lượng là số (vd: 200, 0,5, 1/2)' });
        return;
      }
      validIngredients += 1;
    });
    if (validIngredients === 0) {
      ctx.addIssue({ code: 'custom', path: ['ingredients'], message: 'Cần ít nhất 1 nguyên liệu có tên và lượng' });
    }

    let validSteps = 0;
    data.steps.forEach((st, i) => {
      if (!isBlank(st.timer_minutes) && !(/^\d+$/.test(st.timer_minutes.trim()) && Number(st.timer_minutes) <= 600)) {
        ctx.addIssue({ code: 'custom', path: ['steps', i, 'timer_minutes'], message: 'Số phút từ 0 đến 600' });
      }
      if (!isBlank(st.instruction)) validSteps += 1;
    });
    if (validSteps === 0) {
      ctx.addIssue({ code: 'custom', path: ['steps'], message: 'Cần ít nhất 1 bước chế biến' });
    }
  });

export type RecipeFormData = z.infer<typeof recipeFormSchema>;

export const EMPTY_INGREDIENT = { name: '', amount: '', unit: '' };
export const EMPTY_STEP = { instruction: '', timer_minutes: '' };

/** Giá trị mặc định khi tạo món mới: RIÊNG TƯ cho tới khi người dùng bật công khai */
export const NEW_RECIPE_DEFAULTS: RecipeFormData = {
  name: '',
  description: '',
  prep_time_minutes: '15',
  cook_time_minutes: '20',
  servings: '4',
  image_url: '',
  visibility: 'private',
  category_ids: [],
  ingredients: [{ ...EMPTY_INGREDIENT }],
  steps: [{ ...EMPTY_STEP }],
};

const numText = (n?: number | null) => (n === undefined || n === null ? '' : String(n));
// DECIMAL từ Postgres về dạng "200.00" → "200", "0.50" → "0,5"
const amountText = (v?: string | number) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(Math.round(n * 100) / 100).replace('.', ',');
};

/** Chi tiết món (API) → dữ liệu form sửa */
export function recipeToFormData(recipe: Recipe & { recipe_categories?: { category_id?: string }[] }): RecipeFormData {
  return {
    name: recipe.name ?? '',
    description: recipe.description ?? '',
    prep_time_minutes: numText(recipe.prep_time_minutes),
    cook_time_minutes: numText(recipe.cook_time_minutes),
    servings: numText(recipe.servings) || '1',
    image_url: recipe.image_url ?? '',
    visibility: recipe.visibility === 'public' ? 'public' : 'private',
    category_ids: (recipe.recipe_categories ?? [])
      .map((rc) => rc.category_id)
      .filter((v): v is string => Boolean(v)),
    ingredients: recipe.recipe_ingredients?.length
      ? recipe.recipe_ingredients.map((ing) => ({
          name: ing.ingredient?.name ?? '',
          amount: amountText(ing.amount),
          unit: ing.unit ?? '',
          ingredient_id: ing.ingredient?.id ? String(ing.ingredient.id) : undefined,
        }))
      : [{ ...EMPTY_INGREDIENT }],
    steps: recipe.steps?.length
      ? recipe.steps.map((st) => ({
          instruction: st.instruction ?? '',
          timer_minutes: st.timer_seconds ? String(Math.round(st.timer_seconds / 60)) : '',
        }))
      : [{ ...EMPTY_STEP }],
  };
}

/** Dữ liệu form → body gửi API tạo / sửa (bỏ dòng trống) */
export function formDataToPayload(data: RecipeFormData) {
  const toInt = (v: string) => (isBlank(v) ? 0 : Number(v));
  return {
    name: data.name.trim(),
    description: data.description?.trim() ?? '',
    prep_time_minutes: toInt(data.prep_time_minutes),
    cook_time_minutes: toInt(data.cook_time_minutes),
    servings: toInt(data.servings) || 1,
    // Chỉ gửi ảnh đã tải lên server (https); đường dẫn trong máy bị bỏ
    image_url: /^https?:\/\//i.test(data.image_url ?? '') ? data.image_url : null,
    visibility: data.visibility,
    category_ids: data.category_ids,
    ingredients: data.ingredients
      .filter((ing) => !isBlank(ing.name))
      .map((ing) => ({
        ingredient_id: ing.ingredient_id,
        name: ing.name.trim(),
        quantity: parseAmount(ing.amount) ?? 1,
        unit: ing.unit?.trim() || 'phần',
      })),
    steps: data.steps
      .filter((st) => !isBlank(st.instruction))
      .map((st, idx) => ({
        step_order: idx + 1,
        instruction: st.instruction.trim(),
        timer_seconds: isBlank(st.timer_minutes) ? 0 : Number(st.timer_minutes) * 60,
      })),
  };
}

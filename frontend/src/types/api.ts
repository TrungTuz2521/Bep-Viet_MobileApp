export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  pagination?: PaginationMeta;
}

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: 'user' | 'admin' | string;
  status: 'active' | 'inactive' | string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  data: User;
}

export interface Ingredient {
  id: string | number;
  name: string;
  category?: string;
  amount?: string | number;
  unit?: string;
}

export interface Step {
  id: string | number;
  step_number: number;
  instruction: string;
  timer_seconds?: number | null;
  media_url?: string | null;
}

export interface Recipe {
  id: string | number;
  name: string;
  slug: string;
  image_url?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  diet_type?: 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'pescatarian' | string | null;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  calories?: number | null;
  taste?: RecipeTaste | null;
  popularity_score?: number | string;
  save_count?: number;
  servings?: number;
  description?: string;
  status?: 'draft' | 'published' | 'archived' | string;
  visibility?: 'public' | 'private' | string;
  created_at?: string;
  updated_at?: string;
  owner_user_id?: string | number | null;
  category?: {
    id: string | number;
    name: string;
  };
  recipe_ingredients?: Array<{
    amount?: string | number;
    unit?: string;
    ingredient?: Ingredient;
  }>;
  steps?: Step[];
  is_saved?: boolean;
}

export interface DiscoverRecipesData {
  popular: Recipe[];
  quick_meals: Recipe[];
  recommended?: Recipe[];
  all_recipes?: Recipe[];
}

export interface SavedRecipeItem {
  id?: string | number;
  user_id: string | number;
  recipe_id: string | number;
  created_at?: string;
  recipe: Recipe;
}

export interface UserPreferences {
  preferred_diet_type?: string;
  preferred_tastes?: string;
  taste_preferences?: TastePreferences;
  /** Dị ứng theo nhóm */
  allergy_group_ids?: string[];
  /** Dị ứng từng nguyên liệu lẻ */
  allergy_ingredient_ids?: string[];
  allergies?: IngredientOption[];
  favorite_category_ids?: string[];
}

/** Nhóm dị ứng lấy từ DB (Hải sản có vỏ, Trứng, Sữa...) */
export interface AllergyOption {
  id: string;
  slug?: string;
  label: string;
  icon?: string | null;
  ingredient_count?: number;
  /** Tên các nguyên liệu trong nhóm */
  ingredients?: string[];
}

/** Nguyên liệu trong kho (để chọn dị ứng lẻ) */
export interface IngredientOption {
  id: string;
  name: string;
}

/** Khẩu vị theo mức — null = không đặt */
export interface TastePreferences {
  spicy: 'none' | 'mild' | 'love' | null;
  salty: 'light' | 'normal' | 'rich' | null;
  sweet: 'less' | 'normal' | 'love' | null;
  oily: 'less' | 'normal' | null;
}

/** Mức vị ước tính của món (recipe_taste_profile) */
export interface RecipeTaste {
  spicy: number | null; // 0 không cay · 1 cay nhẹ · 2 cay
  salty: number | null; // 1 nhạt · 2 vừa · 3 đậm/mặn
  sweet: number | null; // 1 ít ngọt · 2 vừa · 3 ngọt
  fat: number | null; // 1 ít béo · 2 vừa · 3 nhiều béo
  sour?: number | null;
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface ChatbotDiscoverRequest {
  query: string;
}

export interface ChatbotDiscoverResponse {
  answer: string;
  recommended_recipes?: Recipe[];
  matched_ingredients?: string[];
}

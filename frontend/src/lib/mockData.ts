import { DiscoverRecipesData, Recipe, User } from '@/types/api';

export const MOCK_USER: User = {
  id: 1,
  name: 'Đầu Bếp Hoàng Minh',
  email: 'test@example.com',
  role: 'user',
  status: 'active',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
};

export interface ThemeCategory {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export const MOCK_THEMES: ThemeCategory[] = [
  { id: 1, name: 'Món Xào Đưa Cơm', icon: '🥘', description: 'Đậm đà, nóng hổi cho bữa tối' },
  { id: 2, name: 'Canh Thanh Nhiệt', icon: '🍲', description: 'Giải nhiệt mùa hè mát lành' },
  { id: 3, name: 'Healthy & Eat Clean', icon: '🥗', description: 'Giàu đạm, ít dầu mỡ' },
  { id: 4, name: 'Món Kho Đậm Vị', icon: '🥩', description: 'Hao cơm chuẩn hương vị mẹ nấu' },
  { id: 5, name: 'Ăn Chay Thanh Tịnh', icon: '🌱', description: '100% thuần thực vật tươi ngon' },
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 1,
    name: 'Gà kho gừng chuẩn vị Bắc',
    slug: 'ga-kho-gung-chuan-vi-bac',
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    difficulty: 'easy',
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    popularity_score: 95,
    save_count: 142,
    servings: 4,
    description: 'Món ăn đậm đà, thơm lừng vị gừng tươi, rất hao cơm trong những ngày se lạnh hoặc bữa cơm gia đình đầm ấm.',
    owner_user_id: 1, // Để test công thức "Của tôi"
    category: { id: 4, name: 'Món Kho' },
    recipe_ingredients: [
      { amount: '500', unit: 'g', ingredient: { id: 1, name: 'Thịt gà ta' } },
      { amount: '50', unit: 'g', ingredient: { id: 2, name: 'Gừng tươi thái sợi' } },
      { amount: '2', unit: 'củ', ingredient: { id: 3, name: 'Hành tím băm' } },
      { amount: '2', unit: 'muỗng canh', ingredient: { id: 4, name: 'Nước mắm ngon' } },
      { amount: '1', unit: 'muỗng cà phê', ingredient: { id: 5, name: 'Tiêu xay' } },
      { amount: '1', unit: 'muỗng canh', ingredient: { id: 6, name: 'Đường cát vàng' } },
    ],
    steps: [
      { id: 1, step_number: 1, instruction: 'Sơ chế thịt gà sạch sẽ, chặt miếng vừa ăn. Gừng cạo vỏ, thái sợi chỉ.', timer_seconds: 300 },
      { id: 2, step_number: 2, instruction: 'Ướp thịt gà với 2 muỗng nước mắm, tiêu, hành tím băm và một nửa chỗ gừng trong 15 phút.', timer_seconds: 900 },
      { id: 3, step_number: 3, instruction: 'Cho chút dầu vào chảo, thêm 1 muỗng đường thắng màu cánh gián đẹp mắt.', timer_seconds: 180 },
      { id: 4, step_number: 4, instruction: 'Trút thịt gà vào đảo nhanh tay trên lửa lớn đến khi thịt săn lại và lên màu vàng nâu.', timer_seconds: 300 },
      { id: 5, step_number: 5, instruction: 'Thêm nửa bát nước ấm cùng phần gừng còn lại, hạ lửa liu riu kho trong 15 phút đến khi nước sốt sánh kẹo.', timer_seconds: 900 },
    ],
  },
  {
    id: 2,
    name: 'Bò lúc lắc khoai tây giòn',
    slug: 'bo-luc-lac-khoai-tay-gion',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    difficulty: 'medium',
    prep_time_minutes: 15,
    cook_time_minutes: 12,
    popularity_score: 88,
    save_count: 98,
    servings: 2,
    description: 'Thịt thăn bò mềm ngọt mọng nước, xào xém cạnh cùng ớt chuông, hành tây và sốt bơ tỏi tiêu đen đậm đà.',
    owner_user_id: 2,
    category: { id: 1, name: 'Món Xào' },
    recipe_ingredients: [
      { amount: '350', unit: 'g', ingredient: { id: 7, name: 'Thịt thăn bò' } },
      { amount: '1', unit: 'quả', ingredient: { id: 8, name: 'Ớt chuông đỏ & xanh' } },
      { amount: '1/2', unit: 'củ', ingredient: { id: 9, name: 'Hành tây' } },
      { amount: '15', unit: 'g', ingredient: { id: 10, name: 'Bơ lạt' } },
      { amount: '2', unit: 'muỗng canh', ingredient: { id: 11, name: 'Xì dầu & Dầu hào' } },
      { amount: '200', unit: 'g', ingredient: { id: 12, name: 'Khoai tây chiên' } },
    ],
    steps: [
      { id: 6, step_number: 1, instruction: 'Thịt bò cắt khối vuông 2x2cm, ướp cùng tỏi băm, dầu hào, xì dầu và tiêu xay.', timer_seconds: 600 },
      { id: 7, step_number: 2, instruction: 'Ớt chuông và hành tây cắt miếng vuông tương đương kích thước thịt bò.', timer_seconds: 240 },
      { id: 8, step_number: 3, instruction: 'Làm nóng chảo với lửa lớn, cho thịt bò vào xào nhanh 2 phút cho xém cạnh rồi trút ra đĩa.', timer_seconds: 120 },
      { id: 9, step_number: 4, instruction: 'Phi thơm bơ tỏi, cho rau củ vào đảo giòn rồi cho bò vào lắc đều tay trong 1 phút.', timer_seconds: 60 },
    ],
  },
  {
    id: 3,
    name: 'Canh chua cá lóc Nam Bộ',
    slug: 'canh-chua-ca-loc-nam-bo',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    difficulty: 'medium',
    prep_time_minutes: 15,
    cook_time_minutes: 15,
    popularity_score: 92,
    save_count: 120,
    servings: 4,
    description: 'Vị chua thanh mát của me tươi, ngọt bùi của cá lóc đồng và hương thơm ngát của ngò gai, bắp chuối.',
    owner_user_id: 3,
    category: { id: 2, name: 'Canh' },
    recipe_ingredients: [
      { amount: '1', unit: 'con (600g)', ingredient: { id: 13, name: 'Cá lóc tươi' } },
      { amount: '50', unit: 'g', ingredient: { id: 14, name: 'Vắt me chua' } },
      { amount: '1/4', unit: 'quả', ingredient: { id: 15, name: 'Dứa (thơm)' } },
      { amount: '2', unit: 'quả', ingredient: { id: 16, name: 'Cà chua' } },
      { amount: '100', unit: 'g', ingredient: { id: 17, name: 'Đậu bắp & Dọc mùng' } },
      { amount: '1', unit: 'mớ', ingredient: { id: 18, name: 'Rau ngò gai, ngổ' } },
    ],
    steps: [
      { id: 10, step_number: 1, instruction: 'Cá lóc cạo sạch vảy, rửa muối và chanh khử tanh, cắt khúc vừa ăn.', timer_seconds: 600 },
      { id: 11, step_number: 2, instruction: 'Dầm me với nước ấm để lấy nước cốt chua.', timer_seconds: 180 },
      { id: 12, step_number: 3, instruction: 'Đun sôi nước, cho cá vào nấu chín tới, vớt bọt liên tục để nước trong.', timer_seconds: 400 },
      { id: 13, step_number: 4, instruction: 'Thêm dứa, cà chua, đậu bắp và dọc mùng. Nêm nước cốt me, đường, nước mắm vừa miệng.', timer_seconds: 300 },
      { id: 14, step_number: 5, instruction: 'Tắt bếp, rắc rau om, ngò gai và ớt thái lát lên trên.', timer_seconds: 60 },
    ],
  },
  {
    id: 4,
    name: 'Salad ức gà sốt mè rang',
    slug: 'salad-uc-ga-sot-me-rang',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    difficulty: 'easy',
    prep_time_minutes: 10,
    cook_time_minutes: 8,
    popularity_score: 85,
    save_count: 75,
    servings: 1,
    description: 'Món ăn thanh đạm, giàu đạm sạch, ít calo, cực kỳ thích hợp cho chế độ ăn kiêng giữ dáng và bữa trưa nhanh nhẹn.',
    owner_user_id: 1, // Cũng thuộc user hiện tại
    category: { id: 3, name: 'Eat Clean' },
    recipe_ingredients: [
      { amount: '200', unit: 'g', ingredient: { id: 19, name: 'Ức gà phi lê' } },
      { amount: '100', unit: 'g', ingredient: { id: 20, name: 'Rau xà lách Romaine' } },
      { amount: '6', unit: 'quả', ingredient: { id: 21, name: 'Cà chua bi' } },
      { amount: '1/2', unit: 'quả', ingredient: { id: 22, name: 'Dưa leo' } },
      { amount: '3', unit: 'muỗng canh', ingredient: { id: 23, name: 'Sốt mè rang Kewpie' } },
    ],
    steps: [
      { id: 15, step_number: 1, instruction: 'Ức gà ướp chút muối tiêu, áp chảo chín vàng hai mặt trong 7 phút.', timer_seconds: 420 },
      { id: 16, step_number: 2, instruction: 'Rau xà lách rửa sạch để ráo, xé miếng vừa ăn. Cà chua bi cắt đôi, dưa leo thái lát.', timer_seconds: 300 },
      { id: 17, step_number: 3, instruction: 'Ức gà thái lát xéo, bày lên đĩa rau củ và rưới sốt mè rang thơm phức lên thưởng thức.', timer_seconds: 120 },
    ],
  },
];

export const MOCK_DISCOVER: DiscoverRecipesData = {
  popular: MOCK_RECIPES.slice(0, 3),
  quick_meals: [MOCK_RECIPES[0], MOCK_RECIPES[3]],
  recommended: [MOCK_RECIPES[1], MOCK_RECIPES[2]],
};

export const APP_CONFIG = {
  APP_NAME: 'Cẩm Nang Nấu Ăn',
  DEFAULT_LANGUAGE: 'vi',
  MIN_TOUCH_TARGET: 44,
  MAX_WIDTH: 768,
  RETENTION_DAYS: 30,
};

export const COLOR_TOKENS = {
  primary: '#F97316',
  primaryDark: '#EA580C',
  amber: '#F59E0B',
  allergyRed: '#EF4444',
  successGreen: '#10B981',
  darkBackground: '#121212',
  darkCard: '#1E1E1E',
  lightBackground: '#FAFAFA',
  lightCard: '#FFFFFF',
};

export const UI_STRINGS = {
  GUEST_MODE_NOTICE: 'Bạn đang dùng chế độ Khách',
  LOGIN_REQUIRED_TITLE: 'Yêu cầu đăng nhập',
  LOGIN_REQUIRED_SUBTITLE: 'Hãy đăng nhập để lưu công thức, tạo món riêng và vào bếp nấu nướng!',
  LOGIN_BUTTON: 'Đăng nhập',
  REGISTER_BUTTON: 'Đăng ký',
  LOGOUT_BUTTON: 'Đăng xuất',
  ALLERGY_FILTER_ACTIVE: 'Đang tự động lọc theo danh sách dị ứng của bạn',
  FALLBACK_BANNER: 'Chưa đủ dữ liệu để gợi ý riêng cho bạn — đây là các món phổ biến phù hợp với sở thích của bạn.',
  EMPTY_SAVED_RECIPES: 'Bạn chưa lưu món ăn nào. Hãy khám phá và lưu những món yêu thích nhé!',
  EMPTY_MY_RECIPES: 'Bạn chưa tạo công thức nào. Hãy chia sẻ món tủ của bạn ngay hôm nay!',
  EMPTY_SEARCH: 'Không tìm thấy món ăn phù hợp. Thử từ khóa khác hoặc hỏi trợ lý AI!',
  RETRY: 'Thử lại',
  COOKING_TIME_TEXT: (mins: number) => `⏱ ${mins} phút`,
  DIFFICULTY_EASY: 'Dễ',
  DIFFICULTY_MEDIUM: 'Vừa',
  DIFFICULTY_HARD: 'Khó',
};

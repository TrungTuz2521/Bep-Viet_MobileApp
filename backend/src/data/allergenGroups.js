/**
 * NHÓM DỊ ỨNG — danh sách nguyên liệu ĐÃ DUYỆT THỦ CÔNG theo kho 511 nguyên liệu trong DB.
 * Nguyên tắc: thà lọc dư còn hơn bỏ sót (vd: Dầu hào chứa hàu + đậu nành + bột mì; Nước mắm làm từ cá).
 * Dùng tên CHÍNH XÁC (không dùng từ khóa) để tránh khớp nhầm: "Cá mè"/"Nấm mèo" ≠ mè, "Hàu sữa" ≠ sữa,
 * "Bánh phở" (gạo) ≠ gluten, "Hạt điều màu"/"Dầu điều" (hạt nhuộm màu) ≠ hạt điều.
 *
 * Thêm nguyên liệu mới vào nhóm: bổ sung tên vào `members` rồi chạy
 *   node scripts/allergy_taste_setup.js seed
 * Người dùng đã chọn nhóm sẽ tự được lọc thêm nguyên liệu mới.
 */
module.exports = [
  {
    slug: 'shellfish',
    name: 'Hải sản có vỏ & nhuyễn thể',
    icon: '🦐',
    members: [
      'Tôm', 'Tôm càng', 'Tôm khô', 'Tép', 'Mắm tôm', 'Muối tôm', 'Mắm ruốc', 'Bánh phồng tôm',
      'Cua biển', 'Cua đồng', 'Thịt cua', 'Gạch cua', 'Ghẹ', 'Bánh đa cua', 'Mắm cáy',
      'Mực', 'Mực ống', 'Khô mực', 'Bạch tuộc',
      'Hàu', 'Hàu sữa', 'Sò điệp', 'Sò huyết', 'Nghêu', 'Ngao', 'Hến',
      'Ốc bươu', 'Ốc len', 'Ốc nhồi', 'Sứa', 'Dầu hào',
    ],
  },
  {
    slug: 'fish',
    name: 'Cá & sản phẩm từ cá',
    icon: '🐟',
    members: [
      'Cá basa', 'Cá basa phi lê', 'Cá bơn', 'Cá bống', 'Cá bông lau', 'Cá bớp', 'Cá chẽm', 'Cá chép',
      'Cá chim trắng', 'Cá chình', 'Cá cơm', 'Cá cơm tươi', 'Cá diêu hồng', 'Cá điêu hồng', 'Cá đù một nắng',
      'Cá đuối', 'Cá hồi phi lê', 'Cá hú', 'Cá kèo', 'Cá lăng', 'Cá lăng phi lê', 'Cá linh', 'Cá lóc',
      'Cá lóc phi lê', 'Cá mặn', 'Cá mè', 'Cá mú', 'Cá ngừ đại dương phi lê', 'Cá nục', 'Cá rô đồng',
      'Cá rô phi', 'Cá tai tượng', 'Cá thác lác', 'Cá thu', 'Cá trê', 'Cá viên', 'Chả cá', 'Khô cá lóc',
      'Lươn', 'Lươn đồng',
      'Nước mắm', 'Mắm nêm', 'Mắm cá sặc', 'Mắm sặc', 'Mắm bò hóc', 'Mắm bồ hóc',
    ],
  },
  {
    slug: 'egg',
    name: 'Trứng',
    icon: '🥚',
    members: [
      'Trứng gà', 'Trứng vịt', 'Trứng cút', 'Trứng muối', 'Trứng vịt muối', 'Trứng bắc thảo', 'Trứng vịt lộn',
      'Mì trứng', 'Mayonnaise', 'Vỏ hoành thánh', 'Vỏ sủi cảo',
    ],
  },
  {
    slug: 'dairy',
    name: 'Sữa & chế phẩm sữa',
    icon: '🥛',
    members: [
      'Sữa tươi', 'Sữa tươi không đường', 'Sữa đặc', 'Sữa chua', 'Kem tươi', 'Bơ lạt',
      'Phô mai', 'Phô mai mozzarella', 'Bột phô mai', 'Bột bánh ngàn lớp',
    ],
  },
  {
    slug: 'peanut',
    name: 'Đậu phộng (lạc)',
    icon: '🥜',
    members: ['Đậu phộng', 'Đậu phộng rang', 'Đậu phộng sống'],
  },
  {
    slug: 'tree_nut',
    name: 'Các loại hạt (điều, hạnh nhân)',
    icon: '🌰',
    members: ['Hạt điều', 'Hạnh nhân', 'Hạnh nhân lát'],
  },
  {
    slug: 'soy',
    name: 'Đậu nành',
    icon: '🫘',
    members: [
      'Đậu nành', 'Đậu hũ', 'Đậu hũ chiên', 'Đậu hũ non', 'Đậu hũ trắng', 'Váng đậu', 'Chao',
      'Nước tương', 'Tương bần', 'Tương hột', 'Tương xay', 'Dầu hào',
    ],
  },
  {
    slug: 'gluten',
    name: 'Gluten / bột mì',
    icon: '🌾',
    members: [
      'Bột mì', 'Bột chiên giòn', 'Bột chiên xù', 'Bột bánh ngàn lớp',
      'Bánh mì', 'Bánh mì ổ nhỏ', 'Bánh mì sandwich', 'Bánh bao mini', 'Bánh quẩy', 'Bánh tortilla',
      'Mì ăn liền', 'Mì cao lầu', 'Mì trứng', 'Mì Ý', 'Vỏ hoành thánh', 'Vỏ sủi cảo', 'Vỏ há cảo',
      'Nước tương', 'Dầu hào', 'Bia', 'Yến mạch', 'Yến mạch cán dẹt',
    ],
  },
  {
    slug: 'sesame',
    name: 'Mè (vừng)',
    icon: '⚪',
    members: ['Mè trắng', 'Mè đen', 'Mè trắng rang', 'Dầu mè', 'Bánh tráng mè'],
  },
];

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';
import {
  useDeleteMyRecipeMutation,
  useGetRecipeDetailsQuery,
  useGetSavedRecipesQuery,
  useSaveRecipeMutation,
  useTrackRecipeViewMutation,
  useUnsaveRecipeMutation,
} from '@/store/apiSlice';
import { IngredientList } from '@/features/recipes/components/IngredientList';
import { StepList } from '@/features/recipes/components/StepList';
import { StickyActionBar } from '@/features/recipes/components/StickyActionBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecipeDetailSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { useAfterTransition } from '@/hooks/useAfterTransition';
import { useToast } from '@/components/ui/Toast';
import { MOCK_RECIPES } from '@/lib/mockData';
import { getFoodIcon } from '@/lib/recipeDisplay';
import { shadow } from '@/lib/shadows';

// ---------------------------------------------------------------------------
// Theme: gom toàn bộ màu sáng/tối về một chỗ thay vì lặp ternary khắp JSX
// ---------------------------------------------------------------------------
const getTheme = (dark: boolean) => ({
  bg: dark ? '#121212' : '#F9FAFB',
  card: dark ? '#1E1E1E' : '#FFFFFF',
  cardBorder: dark ? '#2D2D2D' : '#E5E7EB',
  text: dark ? '#F9FAFB' : '#111827',
  subText: dark ? '#9CA3AF' : '#4B5563',
  muted: dark ? '#9CA3AF' : '#6B7280',
  surface: dark ? '#27272A' : '#F9FAFB',
  surfaceBorder: dark ? '#3F3F46' : '#F3F4F6',
  navBorder: dark ? '#27272A' : '#E5E7EB',
  accent: '#F97316',
  accentSoft: dark ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED',
  accentBorder: dark ? 'rgba(249, 115, 22, 0.35)' : '#FED7AA',
  accentText: dark ? '#FB923C' : '#EA580C',
});
type Theme = ReturnType<typeof getTheme>;

const DIFFICULTY: Record<string, { label: string; color: string }> = {
  easy: { label: 'Dễ', color: '#10B981' },
  medium: { label: 'Vừa', color: '#F59E0B' },
  hard: { label: 'Khó', color: '#EF4444' },
};

const formatMinutes = (m?: number | null) => (m && m > 0 ? `${m} phút` : '—');

// ---------------------------------------------------------------------------
// Thanh điều hướng dùng chung cho cả trạng thái loading / lỗi / có dữ liệu
// → người dùng luôn có nút Quay lại, không bị "kẹt" ở màn hình lỗi
// ---------------------------------------------------------------------------
function TopBar({
  theme,
  onBack,
  onShare,
}: {
  theme: Theme;
  onBack: () => void;
  onShare?: () => void;
}) {
  return (
    <View style={[styles.topNavBar, { backgroundColor: theme.bg, borderBottomColor: theme.navBorder }]}>
      <Pressable
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [styles.navBtn, { backgroundColor: theme.card }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Quay lại">
        <Ionicons name="arrow-back" size={22} color={theme.text} />
      </Pressable>

      <Text numberOfLines={1} style={[styles.navTitle, { color: theme.text }]}>
        Chi tiết công thức
      </Text>

      {onShare ? (
        <Pressable
          hitSlop={8}
          onPress={onShare}
          style={({ pressed }) => [styles.navBtn, { backgroundColor: theme.card }, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Chia sẻ công thức">
          <Ionicons name="share-social-outline" size={20} color={theme.accent} />
        </Pressable>
      ) : (
        // Giữ chỗ để tiêu đề luôn nằm chính giữa
        <View style={styles.navBtnPlaceholder} />
      )}
    </View>
  );
}

function MetaItem({
  icon,
  value,
  label,
  valueColor,
}: {
  icon: string;
  value: string;
  label: string;
  valueColor: string;
}) {
  return (
    <View style={styles.metaItem} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text numberOfLines={1} style={[styles.metaVal, { color: valueColor }]}>
        {value}
      </Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ theme, title, right }: { theme: Theme; title: string; right?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {right ? <Text style={[styles.sectionRight, { color: theme.muted }]}>{right}</Text> : null}
    </View>
  );
}

/** Khung chờ ngắn (~0,3s) cho phần nguyên liệu / các bước trong lúc trang đang trượt vào */
function SectionPlaceholder({ rows, tall = false }: { rows: number; tall?: boolean }) {
  return (
    <View style={styles.placeholder}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width="100%" height={tall ? 88 : 52} borderRadius={14} />
      ))}
    </View>
  );
}

export default function RecipeDetailScreen() {
  const router = useSafeRouter(); // chặn bấm liên tiếp mở trùng trang
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId || '';

  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const theme = useMemo(() => getTheme(isDarkMode), [isDarkMode]);

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isSavedLocal, setIsSavedLocal] = useState<boolean | null>(null);
  // Nguyên liệu + các bước vẽ sau khi hiệu ứng mở trang chạy xong → trang trượt vào mượt, không khựng
  const transitionDone = useAfterTransition();

  // RTK Query lấy chi tiết công thức từ backend
  const { data, isLoading, refetch } = useGetRecipeDetailsQuery(id, { skip: !id });
  const { data: savedData } = useGetSavedRecipesQuery(undefined, { skip: !isAuthenticated });

  const [saveRecipe] = useSaveRecipeMutation();
  const [unsaveRecipe] = useUnsaveRecipeMutation();
  const [deleteMyRecipe] = useDeleteMyRecipeMutation();
  const [trackRecipeView] = useTrackRecipeViewMutation();

  // Ghi nhận 1 lượt xem mỗi lần mở trang (GET chi tiết không còn tự đếm vì có thể được tải trước)
  const trackedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!id || trackedIdRef.current === id) return;
    trackedIdRef.current = id;
    trackRecipeView(id).unwrap().catch(() => {});
  }, [id, trackRecipeView]);
  const { showToast } = useToast();

  // Dữ liệu dự phòng nếu backend gặp sự cố mạng hoặc là công thức mẫu
  const fallbackRecipe = useMemo(() => {
    if (!id) return null;
    return MOCK_RECIPES.find((r) => String(r.id) === String(id) || r.slug === id);
  }, [id]);

  const recipe = data?.data || fallbackRecipe;

  // Xác định trạng thái đã lưu từ database
  const isSavedInDb = useMemo(() => {
    const list = savedData?.data || [];
    return list.some((item) => String(item.recipe_id || item.recipe?.id) === String(id));
  }, [savedData, id]);

  const isSaved = isSavedLocal !== null ? isSavedLocal : isSavedInDb;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as any);
  };

  const handleShare = async () => {
    if (!recipe) return;
    try {
      await Share.share({
        message: `Món ngon mỗi ngày: ${recipe.name}. Xem công thức chi tiết trên Cẩm Nang Nấu Ăn!`,
        title: recipe.name,
      });
    } catch (e) {
      console.warn('Lỗi chia sẻ:', e);
    }
  };

  // Đổi icon ngay (lạc quan), API lỗi thì trả lại trạng thái cũ và báo lỗi thật
  const handleBookmarkToggle = async () => {
    if (!recipe) return;
    const willSave = !isSaved;
    setIsSavedLocal(willSave);
    try {
      if (willSave) {
        await saveRecipe(recipe.id).unwrap();
      } else {
        await unsaveRecipe(recipe.id).unwrap();
      }
      showToast({
        type: 'success',
        message: willSave ? 'Đã lưu công thức vào Thư viện' : 'Đã bỏ lưu món ăn',
      });
    } catch {
      setIsSavedLocal(!willSave);
      showToast({
        type: 'error',
        message: willSave
          ? 'Không thể lưu công thức. Vui lòng thử lại.'
          : 'Không thể bỏ lưu món ăn. Vui lòng thử lại.',
      });
    }
  };

  // Mở trợ lý AI kèm ngữ cảnh món (định lượng, thay nguyên liệu, dinh dưỡng, từng bước)
  const handleAskAssistant = () => {
    if (!recipe) return;
    router.push({
      pathname: '/assistant',
      params: { recipeId: String(recipe.id), recipeName: recipe.name },
    } as any);
  };

  const handleStartCooking = () => {
    if (!recipe) return;
    router.push(`/cooking/${recipe.id}` as any);
  };

  const handleEditRecipe = () => {
    if (!recipe) return;
    router.push(`/recipe/${recipe.id}/edit` as any);
  };

  const handleDeleteRecipe = () => setDeleteDialogVisible(true);

  // Gọi API xóa mềm (chuyển vào Thùng rác), chỉ điều hướng khi thành công
  const deletingRef = useRef(false);
  const confirmDelete = async () => {
    if (!recipe || deletingRef.current) return;
    deletingRef.current = true;
    setDeleteDialogVisible(false);
    try {
      await deleteMyRecipe(recipe.id).unwrap();
      showToast({
        type: 'success',
        message: 'Đã chuyển công thức vào Thùng rác (lưu trữ 30 ngày).',
      });
      // Quay lại màn trước (Thư viện / Tìm kiếm...) thay vì mở thêm bộ tab mới chồng lên stack
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/library');
    } catch {
      deletingRef.current = false;
      showToast({ type: 'error', message: 'Không thể xóa công thức. Vui lòng thử lại.' });
    }
  };

  // ----- Trạng thái đang tải -----
  if (isLoading && !recipe) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
        <TopBar theme={theme} onBack={goBack} />
        <RecipeDetailSkeleton />
      </SafeAreaView>
    );
  }

  // ----- Không tìm thấy -----
  if (!recipe) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
        <TopBar theme={theme} onBack={goBack} />
        <View style={styles.centerContainer}>
          <EmptyState
            icon="⚠️"
            title="Không tìm thấy công thức"
            description="Công thức này có thể đã bị xóa hoặc không còn tồn tại trên hệ thống."
            actionTitle="Thử lại"
            onActionPress={refetch}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = !!(currentUser && recipe.owner_user_id === currentUser.id);
  const foodEmoji = getFoodIcon(recipe.name);
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  const difficulty = DIFFICULTY[recipe.difficulty as string];
  const ingredients = recipe.recipe_ingredients || (recipe as any).ingredients || [];
  const steps = recipe.steps || [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top']}>
      <TopBar theme={theme} onBack={goBack} onShare={handleShare} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Thẻ tóm tắt món ăn */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.emojiAvatar, { backgroundColor: theme.accentSoft }]}>
              <Text style={styles.emojiText}>{foodEmoji}</Text>
            </View>

            <View style={styles.heroHeaderInfo}>
              {recipe.category?.name ? (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder },
                  ]}>
                  <Text style={[styles.categoryBadgeText, { color: theme.accentText }]}>
                    {recipe.category.name}
                  </Text>
                </View>
              ) : null}

              <Text style={[styles.recipeName, { color: theme.text }]} numberOfLines={3}>
                {recipe.name}
              </Text>

              {totalTime > 0 ? (
                <Text style={[styles.totalTime, { color: theme.muted }]}>
                  Tổng thời gian khoảng {totalTime} phút
                </Text>
              ) : null}
            </View>
          </View>

          {/* Dùng !! để tránh lỗi "Text strings must be rendered within <Text>" khi description = '' */}
          {!!recipe.description && (
            <Text style={[styles.recipeDesc, { color: theme.subText }]}>{recipe.description}</Text>
          )}

          {/* Lưới thông số */}
          <View style={[styles.metaGrid, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <MetaItem
              icon="⏱"
              value={formatMinutes(recipe.prep_time_minutes)}
              label="Chuẩn bị"
              valueColor={theme.text}
            />
            <View style={styles.metaDivider} />
            <MetaItem
              icon="🍳"
              value={formatMinutes(recipe.cook_time_minutes)}
              label="Nấu chín"
              valueColor={theme.text}
            />
            <View style={styles.metaDivider} />
            <MetaItem
              icon="📊"
              value={difficulty?.label ?? '—'}
              label="Độ khó"
              valueColor={difficulty?.color ?? theme.muted}
            />
            <View style={styles.metaDivider} />
            <MetaItem
              icon="👥"
              value={recipe.servings ? `${recipe.servings} người` : '—'}
              label="Khẩu phần"
              valueColor={theme.text}
            />
          </View>

          <Pressable
            onPress={handleAskAssistant}
            accessibilityRole="button"
            accessibilityLabel={`Hỏi trợ lý AI về món ${recipe.name}`}
            style={({ pressed }) => [
              styles.askAiBtn,
              { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="sparkles" size={18} color={theme.accentText} />
            <Text style={[styles.askAiText, { color: theme.accentText }]}>Hỏi trợ lý AI về món này</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.accentText} />
          </Pressable>
        </View>

        {/* Nguyên liệu */}
        <View style={styles.section}>
          <SectionTitle
            theme={theme}
            title="Nguyên liệu"
            right={ingredients.length ? `${ingredients.length} loại` : undefined}
          />
          {transitionDone ? (
            <IngredientList ingredients={ingredients} servings={recipe.servings || 4} />
          ) : (
            <SectionPlaceholder rows={Math.min(Math.max(ingredients.length, 2), 5)} />
          )}
        </View>

        {/* Các bước */}
        <View style={styles.section}>
          <SectionTitle theme={theme} title="Cách làm" right={steps.length ? `${steps.length} bước` : undefined} />
          {transitionDone ? (
            <StepList steps={steps} />
          ) : (
            <SectionPlaceholder rows={Math.min(Math.max(steps.length, 2), 3)} tall />
          )}
        </View>
      </ScrollView>

      {/* Thanh hành động cố định đáy màn hình */}
      <StickyActionBar
        recipeId={recipe.id}
        recipeName={recipe.name}
        isSaved={isSaved}
        isOwner={isOwner}
        onBookmarkToggle={handleBookmarkToggle}
        onStartCooking={handleStartCooking}
        onEdit={handleEditRecipe}
        onDelete={handleDeleteRecipe}
      />

      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Xóa công thức?"
        message={`Công thức "${recipe.name}" sẽ được chuyển vào Thùng rác và lưu trữ trong 30 ngày trước khi xóa vĩnh viễn.`}
        confirmText="Chuyển vào Thùng rác"
        cancelText="Giữ lại"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  placeholder: { gap: 10, marginTop: 4 },
  pressed: { opacity: 0.7 },

  // Nav bar
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    width: 44, // vùng chạm tối thiểu 44pt theo HIG
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  navBtnPlaceholder: { width: 44, height: 44 },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 12,
  },

  // Nội dung
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24, // nếu StickyActionBar dùng position:absolute, tăng bằng chiều cao thanh
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Hero
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    ...shadow(1),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // tên dài nhiều dòng thì avatar vẫn neo trên cùng
    gap: 14,
  },
  emojiAvatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 30 },
  heroHeaderInfo: { flex: 1 },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: '700' },
  recipeName: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  totalTime: { fontSize: 13, marginTop: 4 },
  recipeDesc: { fontSize: 15, lineHeight: 22, marginTop: 12 },

  // Meta grid
  metaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 16,
  },
  metaItem: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  metaIcon: { fontSize: 16, marginBottom: 4 },
  metaVal: { fontSize: 14, fontWeight: '800' },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
  askAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  askAiText: { fontSize: 15, fontWeight: '700' },
  metaDivider: { width: 1, height: 28, backgroundColor: 'rgba(150, 150, 150, 0.2)' },

  // Section
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionRight: { fontSize: 13, fontWeight: '500' },
});
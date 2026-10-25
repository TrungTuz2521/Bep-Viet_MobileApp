import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  useGetCategoriesQuery,
  useGetDiscoverQuery,
  useGetRecipesPageInfiniteQuery,
  useGetSavedRecipesQuery,
  useSaveRecipeMutation,
  useUnsaveRecipeMutation,
} from '@/store/apiSlice';
import { RecipeTextCard } from '@/components/ui/RecipeTextCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecipeTextCardSkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Recipe } from '@/types/api';
import { UI_STRINGS } from '@/lib/constants';
import { shadow } from '@/lib/shadows';
import { ElevatedPressable } from '@/components/ui/ElevatedPressable';
import { brand, useThemeColors } from '@/lib/theme';
import { emojiText, lineHeightFor } from '@/lib/typography';

// Số lượng món hiển thị mỗi trang (20 món theo yêu cầu)
const INITIAL_VISIBLE_COUNT = 20;

// Thanh danh mục ở Khám phá chỉ hiện các LOẠI MÓN CHÍNH (theo slug trong DB).
// Màn Tìm kiếm / Sở thích vẫn dùng đủ danh mục. Muốn thêm/bớt chip → sửa danh sách này.
const MAIN_CATEGORY_SLUGS = [
  'mon-canh',
  'mon-kho-rim',
  'mon-an-vat',
  'bun-pho-mi-mien',
  'mon-chien-ran',
  'mon-xao',
  'mon-hap-luoc',
  'mon-com',
  'mon-nuong',
  'chao-sup',
];
// Số món tăng thêm mỗi lần bấm "Xem thêm"
const LOAD_MORE_STEP = 20;

// Tham chiếu cố định để FlatList không nhận mảng mới mỗi lần render
const EMPTY_RECIPES: Recipe[] = [];
const recipeKeyExtractor = (item: Recipe) => `recipe-text-${item.id}`;

// Hiệu ứng chạm: Android dùng ripple, iOS dùng opacity + scale
const ripple = (color: string) =>
  Platform.OS === 'android' ? { color, borderless: false } : undefined;
const iosPressed = (pressed: boolean) =>
  Platform.OS === 'ios' && pressed ? styles.pressed : null;

// Icon gán cho từng thể loại theo từ khóa
const getCategoryEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('tất cả')) return '🍽️';
  if (lower.includes('nhanh')) return '⏱️';
  if (lower.includes('lẩu') || lower.includes('canh')) return '🍲';
  if (lower.includes('chính') || lower.includes('gia đình')) return '🥩';
  if (lower.includes('bún') || lower.includes('phở') || lower.includes('mì')) return '🍜';
  if (lower.includes('sáng')) return '🌅';
  if (lower.includes('chay')) return '🥗';
  if (lower.includes('chơi') || lower.includes('nhậu')) return '🍺';
  if (lower.includes('đặc sản')) return '🏞️';
  if (lower.includes('kho')) return '🥘';
  if (lower.includes('xào')) return '🍳';
  if (lower.includes('chiên') || lower.includes('nướng')) return '🍗';
  return '🍴';
};

export default function DiscoverScreen() {
  const router = useSafeRouter(); // chặn bấm liên tiếp mở trùng trang
  const { requireAuth } = useRequireAuth();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // Màu nhấn theo dark mode (lib/theme.ts)
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { showToast } = useToast();

  // Danh mục đang chọn (mặc định 'all')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  // Số món đang hiển thị
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  // 1. Lấy danh sách danh mục từ backend
  const { data: categoriesData, refetch: refetchCats } = useGetCategoriesQuery();

  // 2. Danh sách món phân trang từ server (20 món/trang), tải thêm trang khi cần hiển thị thêm.
  // Dữ liệu từng danh mục được cache (mặc định 60s) → quay lại danh mục cũ hiện ngay, không tải lại.
  const isAll = selectedCategoryId === 'all';
  const {
    data: pagesData,
    currentData: pagesCurrentData,
    isLoading: isLoadingSearch,
    isFetching: isFetchingSearch,
    isFetchingNextPage,
    isError: isErrorSearch,
    hasNextPage,
    fetchNextPage,
    refetch: refetchSearch,
  } = useGetRecipesPageInfiniteQuery(isAll ? {} : { category_ids: selectedCategoryId });

  // Gộp các trang (bỏ trùng phòng khi thứ hạng phổ biến thay đổi giữa 2 lần tải trang)
  const pagedRecipes: Recipe[] = useMemo(() => {
    const seen = new Set<string>();
    const merged: Recipe[] = [];
    (pagesData?.pages || []).forEach((page) => {
      (page.data || []).forEach((r) => {
        const key = String(r.id);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(r);
        }
      });
    });
    return merged;
  }, [pagesData]);
  const serverTotal = pagesData?.pages?.[0]?.pagination?.total;

  // 3. Discover chỉ là dữ liệu dự phòng → chỉ gọi khi search (Tất cả) đã xong mà rỗng/lỗi,
  // tránh tải song song thêm ~440KB mỗi lần mở app
  const isSearchSettled = !isLoadingSearch && !isFetchingSearch;
  const isSearchEmpty = pagedRecipes.length === 0;
  const needDiscoverFallback = isAll && isSearchSettled && (isSearchEmpty || isErrorSearch);
  const {
    data: discoverDataRes,
    isLoading: isLoadingDiscover,
    refetch: refetchDiscover,
  } = useGetDiscoverQuery(undefined, { skip: !needDiscoverFallback });

  // 4. Lấy danh sách công thức đã lưu để đồng bộ icon bookmark
  const { data: savedData, refetch: refetchSaved } = useGetSavedRecipesQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [saveRecipe] = useSaveRecipeMutation();
  const [unsaveRecipe] = useUnsaveRecipeMutation();

  // Tập hợp ID các món đã lưu
  const savedRecipeIds = useMemo(() => {
    const list = savedData?.data || [];
    return new Set(list.map((item) => String(item.recipe_id || item.recipe?.id)));
  }, [savedData]);

  // "Tất cả" + các loại món chính; ẩn danh mục chưa có món, xếp theo số món giảm dần
  const categoriesList = useMemo(() => {
    const mainCats = (categoriesData?.data || [])
      .filter((c) => MAIN_CATEGORY_SLUGS.includes(c.slug))
      .filter((c) => c.recipe_count === undefined || c.recipe_count > 0)
      .sort((a, b) => (b.recipe_count ?? 0) - (a.recipe_count ?? 0));
    return [
      { id: 'all', name: 'Tất cả', slug: 'all' },
      ...mainCats,
    ];
  }, [categoriesData]);

  // Tổng hợp toàn bộ danh sách món ăn cho danh mục hiện tại
  const allRecipes: Recipe[] = useMemo(() => {
    if (pagedRecipes.length > 0) {
      return pagedRecipes;
    }
    // Fallback sang discover all_recipes nếu search chưa trả về khi chọn Tất cả
    if (isAll && discoverDataRes?.data) {
      if (discoverDataRes.data.all_recipes && discoverDataRes.data.all_recipes.length > 0) {
        return discoverDataRes.data.all_recipes;
      }
      const pop = discoverDataRes.data.popular || [];
      const quick = discoverDataRes.data.quick_meals || [];
      const map = new Map<string, Recipe>();
      [...pop, ...quick].forEach((r) => map.set(String(r.id), r));
      return Array.from(map.values());
    }
    return [];
  }, [pagedRecipes, discoverDataRes, isAll]);

  // Tổng số món của danh mục (theo server); dùng số đã tải khi đang ở chế độ dự phòng discover
  const totalCount = pagedRecipes.length > 0 && serverTotal ? serverTotal : allRecipes.length;

  // Danh sách các món đang được hiển thị
  const displayedRecipes = useMemo(() => {
    return allRecipes.slice(0, visibleCount);
  }, [allRecipes, visibleCount]);

  const hasMore = visibleCount < totalCount;
  const remainingCount = totalCount - visibleCount;

  // Cần hiển thị nhiều hơn số đã tải (bấm "Xem thêm" / "Tất cả") → tải tiếp từng trang
  const needsMorePages = pagedRecipes.length > 0 && pagedRecipes.length < visibleCount;
  useEffect(() => {
    if (needsMorePages && hasNextPage && !isFetchingSearch) {
      fetchNextPage();
    }
  }, [needsMorePages, hasNextPage, isFetchingSearch, fetchNextPage]);
  const isLoadingMore = isFetchingNextPage || (needsMorePages && Boolean(hasNextPage));
  // Vòng xoay kéo-để-làm-mới chỉ hiện khi người dùng chủ động kéo,
  // không bật lên mỗi lần refetch nền (vd: sau khi lưu món)
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  // FAB "Hỏi Trợ Lý" thu gọn thành nút tròn khi cuộn xuống để không che nội dung
  const [isFabExtended, setIsFabExtended] = useState(true);
  const handleListScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const shouldExtend = e.nativeEvent.contentOffset.y < 120;
    if (shouldExtend !== isFabExtended) setIsFabExtended(shouldExtend);
  };

  // Xử lý đổi danh mục
  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  // Nút Xem thêm
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_STEP);
  };

  // Nút Xem tất cả (các trang còn lại được tải dần, danh sách dài thêm theo từng trang)
  const handleShowAll = () => {
    setVisibleCount(totalCount);
  };

  // Nút Thu gọn (về 20 món đầu)
  const handleCollapse = () => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  // Xem chi tiết món
  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}` as any);
  };

  // Lưu / Bỏ lưu công thức
  const handleBookmarkToggle = (recipe: Recipe) => {
    requireAuth(async () => {
      const recIdStr = String(recipe.id);
      const isSaved = savedRecipeIds.has(recIdStr);
      try {
        if (isSaved) {
          await unsaveRecipe(recipe.id as any).unwrap();
        } else {
          await saveRecipe(recipe.id as any).unwrap();
        }
      } catch (e) {
        console.warn('Lỗi khi lưu/bỏ lưu món:', e);
        showToast({
          type: 'error',
          message: isSaved
            ? 'Không thể bỏ lưu món ăn. Vui lòng thử lại.'
            : 'Không thể lưu công thức. Vui lòng thử lại.',
        });
      }
    }, '/(tabs)');
  };

  // Mở trợ lý AI
  const handleOpenAssistant = () => {
    router.push('/assistant' as any);
  };

  // Làm mới trang
  const handleRefresh = async () => {
    setIsPullRefreshing(true);
    try {
      await Promise.all([
        refetchCats(),
        refetchSearch(),
        // Không thể refetch query đang skip
        ...(needDiscoverFallback ? [refetchDiscover()] : []),
        ...(isAuthenticated ? [refetchSaved()] : []),
      ]);
    } finally {
      setIsPullRefreshing(false);
    }
  };

  const isLoading = (isLoadingSearch || isLoadingDiscover) && allRecipes.length === 0;
  // Đang tải danh mục mới (chưa có dữ liệu cho danh mục vừa chọn) → hiện skeleton thay vì list cũ
  const isSwitchingCategory = isFetchingSearch && !pagesCurrentData;
  const showListSkeleton = isLoading || isSwitchingCategory;

  // Lấy tên danh mục đang chọn để hiển thị tiêu đề
  const currentCategoryName = useMemo(() => {
    const found = categoriesList.find((c) => String(c.id) === String(selectedCategoryId));
    return found ? found.name : 'Tất cả';
  }, [categoriesList, selectedCategoryId]);

  const bgColor = isDarkMode ? '#121212' : '#F9FAFB';

  // Phần cố định phía trên danh sách: lời chào, banner dị ứng, danh mục, tiêu đề danh sách
  // (nằm ngoài FlatList → không cuộn theo, chỉ danh sách món cuộn bên dưới)
  const fixedHeader = (
    <>
      {/* 1. Header trên cùng */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text
            style={[styles.greeting, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            {'Cùng nhau khám phá '}
          </Text>
          <Text
            style={[styles.appTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Món ngon mỗi ngày
          </Text>
        </View>

        {/* Huy hiệu thành viên */}
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          android_ripple={ripple('rgba(0,0,0,0.08)')}
          onPress={() => {
            if (!isAuthenticated) router.push('/(auth)/login');
            else router.push('/(tabs)/profile');
          }}
          style={({ pressed }) => [
            styles.actorBadge,
            { backgroundColor: isAuthenticated ? colors.successTint : colors.primaryTint },
            iosPressed(pressed),
          ]}>
          <View
            style={[
              styles.actorDot,
              { backgroundColor: isAuthenticated ? '#10B981' : '#F97316' },
            ]}
          />
          <Text
            style={[
              styles.actorText,
              { color: isAuthenticated ? colors.successAccent : colors.primaryTintText },
            ]}>
            {isAuthenticated ? `${user?.name}` : 'Đăng nhập'}
          </Text>
        </Pressable>
      </View>

      
      {/* 3. Lọc Dị Ứng Cứng (nếu có) */}
      {isAuthenticated && (
        <View style={[styles.allergyBanner, { backgroundColor: colors.successTint, borderColor: colors.successTintBorder }, { backgroundColor: colors.successTint, borderColor: colors.successTintBorder }]}>
          <Ionicons name="shield-checkmark" size={16} color={colors.successAccent} />
          <Text style={[styles.allergyBannerText, { color: colors.successText }, { color: colors.successText }]}>
            {UI_STRINGS.ALLERGY_FILTER_ACTIVE}
          </Text>
        </View>
      )}

      {/* 4. THANH LỌC MÓN ĂN THEO CÁC DANH MỤC (Cuộn ngang) */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          contentContainerStyle={styles.categoryScroll}>
          {categoriesList.map((cat) => {
            const catIdStr = String(cat.id);
            const isSelected = selectedCategoryId === catIdStr;
            const emoji = getCategoryEmoji(cat.name);

            return (
              <ElevatedPressable
                level={1}
                key={`cat-${catIdStr}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                android_ripple={ripple(isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(249,115,22,0.15)')}
                onPress={() => handleSelectCategory(catIdStr)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  isSelected
                    ? styles.categoryChipActive
                    : [
                      styles.categoryChipInactive,
                      {
                        backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                        borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
                      },
                    ],
                  iosPressed(pressed),
                ]}>
                <Text style={styles.categoryEmoji}>{emoji}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    isSelected
                      ? styles.categoryTextActive
                      : { color: isDarkMode ? '#D1D5DB' : '#374151' },
                  ]}>
                  {cat.name}
                </Text>
              </ElevatedPressable>
            );
          })}
        </ScrollView>
      </View>

    <View style={styles.listSection}>
      <View style={styles.listHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text
            style={[styles.listTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            {selectedCategoryId === 'all' ? 'Toàn Bộ Món Ăn' : currentCategoryName}
          </Text>
        </View>
      </View>
    </View>
    </>
  );

  // Nút Xem thêm / Tất cả / Thu gọn + link tìm kiếm nâng cao
  const listFooter =
    allRecipes.length > 0 && !showListSkeleton ? (
      <View style={styles.footerActions}>
        {/* Đang tải trang tiếp theo */}
        {isLoadingMore && (
          <View style={styles.loadingMore}>
            <RecipeTextCardSkeletonList count={3} />
          </View>
        )}

        {hasMore ? (
          <View style={styles.buttonGroup}>
            <ElevatedPressable
              level={2}
              accessibilityRole="button"
              accessibilityLabel={`Xem thêm ${remainingCount} món`}
              android_ripple={ripple('rgba(255,255,255,0.3)')}
              onPress={handleLoadMore}
              style={({ pressed }) => [
                styles.loadMoreButton,
                { flex: 1 },
                iosPressed(pressed),
              ]}>
              <Text numberOfLines={1} style={styles.loadMoreText}>
                Xem thêm
              </Text>
              <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
            </ElevatedPressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem tất cả món ăn"
              android_ripple={ripple('rgba(249,115,22,0.15)')}
              onPress={handleShowAll}
              style={({ pressed }) => [
                styles.showAllButton,
                {
                  backgroundColor: isDarkMode ? '#27272A' : '#FFF7ED',
                  borderColor: isDarkMode ? '#F97316' : '#FFEDD5',
                },
                iosPressed(pressed),
              ]}>
              <Ionicons name="apps-outline" size={16} color="#F97316" />
              <Text numberOfLines={1} style={styles.showAllText}>
                Tất cả 
              </Text>
            </Pressable>
          </View>
        ) : totalCount > INITIAL_VISIBLE_COUNT ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thu gọn danh sách món ăn về 20 món đầu"
            android_ripple={ripple('rgba(0,0,0,0.08)')}
            onPress={handleCollapse}
            style={({ pressed }) => [
              styles.collapseButton,
              {
                backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6',
                borderColor: isDarkMode ? '#3F3F46' : '#E5E7EB',
              },
              iosPressed(pressed),
            ]}>
            <Text style={[styles.collapseText, { color: isDarkMode ? '#E4E4E7' : '#4B5563' }]}>
              Thu gọn 
            </Text>
            <Ionicons
              name="chevron-up"
              size={16}
              color={isDarkMode ? '#E4E4E7' : '#4B5563'}
            />
          </Pressable>
        ) : null}

        {/* Nút phụ dẫn sang trang tìm kiếm đầy đủ */}
        <Pressable
          hitSlop={8}
          android_ripple={ripple('rgba(249,115,22,0.12)')}
          onPress={() => router.push('/(tabs)/search')}
          style={styles.searchLink}>
          <Ionicons name="search-outline" size={15} color="#F97316" />
          <Text style={styles.searchLinkText}>
            Tìm kiếm món ăn theo bộ lọc nâng cao
          </Text>
        </Pressable>
      </View>
    ) : null;

  const listEmpty = showListSkeleton ? (
    <RecipeTextCardSkeletonList count={6} />
  ) : (
    <EmptyState
      title="Không tìm thấy món ăn"
      description={`Chưa có món ăn nào thuộc danh mục "${currentCategoryName}". Hãy thử chọn danh mục khác nhé!`}
      actionTitle="Xem tất cả món"
      onActionPress={() => handleSelectCategory('all')}
    />
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: bgColor }]}
      edges={['top']}>

      <View style={styles.fixedHeader}>{fixedHeader}</View>

      {/* FlatList ảo hoá: chỉ mount các thẻ gần vùng nhìn thấy, kể cả khi bấm "Tất cả" */}
      <FlatList
        style={styles.list}
        data={showListSkeleton ? EMPTY_RECIPES : displayedRecipes}
        keyExtractor={recipeKeyExtractor}
        renderItem={({ item }) => (
          <RecipeTextCard
            recipe={item}
            isSaved={savedRecipeIds.has(String(item.id))}
            onPress={handleRecipePress}
            onBookmarkPress={handleBookmarkToggle}
          />
        )}
        ListFooterComponent={listFooter}
        ListFooterComponentStyle={styles.listFooter}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        onScroll={handleListScroll}
        scrollEventThrottle={64}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={9}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={handleRefresh}
            tintColor="#F97316"
            colors={['#F97316']}
            progressBackgroundColor={isDarkMode ? '#1E1E1E' : '#FFFFFF'}
          />
        }
      />

      {/* 7. Nút FAB Chatbot: View ngoài giữ elevation, Pressable trong giữ ripple bo tròn */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở trợ lý ẩm thực AI"
          android_ripple={ripple('rgba(255,255,255,0.35)')}
          onPress={handleOpenAssistant}
          style={({ pressed }) => [styles.fab, !isFabExtended && styles.fabCollapsed, iosPressed(pressed)]}>
          <Text style={styles.fabIcon}>🤖</Text>
          {isFabExtended && (
            <Text style={styles.fabText}>Hỏi Trợ Lý</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  fixedHeader: {
    paddingHorizontal: 16,
  },
  list: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 2, // chừa chỗ cho bóng của thẻ đầu tiên, không bị cắt ở mép trên
    paddingBottom: 104, // chừa chỗ cho FAB, không che nút cuối danh sách
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  greeting: {
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    fontWeight: '500',
    marginBottom: 2,
    includeFontPadding: false,
  },
  appTitle: {
    fontSize: 23,
    lineHeight: lineHeightFor(22),
    fontWeight: '700',
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  actorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: 20,
    gap: 6,
    overflow: 'hidden',
  },
  actorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actorText: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    fontWeight: '700',
    includeFontPadding: false,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 10,
    gap: 10,
    overflow: 'hidden',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    fontWeight: '500',
    includeFontPadding: false,
  },
  searchFilterIcon: {
    padding: 2,
  },
  allergyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
  },
  allergyBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  categorySection: {
    marginTop: 6,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryScroll: {
    paddingRight: 8,
    paddingVertical: 6, // chừa chỗ cho elevation của chip, không bị cắt bóng
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 36, // Chuẩn touch target
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
  },
  // Chip đã chọn có nền đặc → viền cùng màu nền (không lộ vòng cam đậm), giữ nguyên kích thước với chip chưa chọn
  categoryChipActive: {
    backgroundColor: brand.primary,
    borderColor: brand.primary,
  },
  // Nền/viền của chip chưa chọn đặt inline theo dark mode; bóng do ElevatedPressable vẽ
  categoryChipInactive: {},
  categoryEmoji: {
    ...emojiText(15),
  },
  categoryText: {
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    fontWeight: '700',
    includeFontPadding: false,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  listSection: {
    marginTop: 4,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  listSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    fontWeight: '700',
    includeFontPadding: false,
  },
  listFooter: {
    marginTop: 8,
  },
  loadingMore: {
    width: '100%',
  },
  footerActions: {
    marginTop: 6,
    alignItems: 'center',
    gap: 12,
  },
  // Cỡ chữ hệ thống lớn: nút "Tất cả" tự xuống hàng thay vì ép chữ của nút "Xem thêm"
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.primary,
    minHeight: 48,
    minWidth: 160,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
    overflow: 'hidden',
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    fontWeight: '700',
    flexShrink: 1,
    includeFontPadding: false,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
  },
  showAllText: {
    color: '#EA580C',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    fontWeight: '700',
    includeFontPadding: false,
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
  },
  collapseText: {
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    fontWeight: '600',
    includeFontPadding: false,
  },
  searchLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  searchLinkText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  fabWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 20 : 24,
    right: 20,
    borderRadius: 30,
    backgroundColor: brand.primary,
    ...shadow(6),
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 30,
    gap: 8,
    overflow: 'hidden', // giữ ripple trong hình viên thuốc
  },
  fabCollapsed: {
    width: 52,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  fabIcon: {
    ...emojiText(20),
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    includeFontPadding: false,
  },
});
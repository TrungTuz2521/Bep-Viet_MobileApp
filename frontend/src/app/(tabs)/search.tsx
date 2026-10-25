import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSelector } from '@/store';
import { useDebounce } from '@/hooks/useDebounce';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useSearchRecipesQuery, useGetSavedRecipesQuery, useGetPreferencesQuery, useSaveRecipeMutation, useUnsaveRecipeMutation } from '@/store/apiSlice';
import { activeAvoidLabels } from '@/features/preferences/constants';
import { Chip } from '@/components/ui/Chip';
import { RecipeTextCard } from '@/components/ui/RecipeTextCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecipeTextCardSkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { SearchHistory } from '@/features/recipes/components/SearchHistory';
import { Recipe } from '@/types/api';
import { UI_STRINGS } from '@/lib/constants';
import { shadow } from '@/lib/shadows';
import { brand } from '@/lib/theme';
import { emojiText, lineHeightFor } from '@/lib/typography';

const SEARCH_HISTORY_KEY = '@food_app_search_history';

export default function SearchScreen() {
  const router = useSafeRouter(); // chặn bấm liên tiếp mở trùng trang
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { requireAuth } = useRequireAuth();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState(category || '');
  const [prevCategory, setPrevCategory] = useState(category);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>();
  const [selectedMaxTime, setSelectedMaxTime] = useState<number | undefined>();
  const [selectedDiet, setSelectedDiet] = useState<string | undefined>();
  const [history, setHistory] = useState<string[]>([]);

  if (category !== prevCategory) {
    setPrevCategory(category);
    if (category) {
      setSearchTerm(category);
    }
  }

  // Tải lịch sử tìm kiếm khi vào màn hình
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Lỗi đọc lịch sử tìm kiếm:', e);
      }
    };
    loadHistory();
  }, []);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // Lưu lịch sử khi người dùng gõ từ khóa mới
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim().length > 1) {
      const trimmed = debouncedSearch.trim();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistory((prev) => {
        const updated = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
        AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated)).catch(() => { });
        return updated;
      });
    }
  }, [debouncedSearch]);

  const handleRemoveHistory = async (keyword: string) => {
    const updated = history.filter((item) => item !== keyword);
    setHistory(updated);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  };

  const handleClearAllHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  // Khẩu vị kiểu "tránh" (Không ăn cay, Ít ngọt...) đang lọc cứng → cho phép tạm tắt ngay tại đây
  const { data: prefData } = useGetPreferencesQuery(undefined, { skip: !isAuthenticated });
  const avoidLabels = isAuthenticated ? activeAvoidLabels(prefData?.data?.taste_preferences) : [];
  const [tasteFilterOn, setTasteFilterOn] = useState(true);

  const baseSearchArgs = {
    ...(avoidLabels.length > 0 && !tasteFilterOn ? { taste_filter: 'off' as const } : {}),
    query: debouncedSearch || undefined,
    difficulty: selectedDifficulty,
    max_time: selectedMaxTime,
  };
  // "Món Chay" = vegetarian + vegan (lọc theo diet_type trên server thay vì đoán theo tên món)
  const isVegetarianFilter = selectedDiet === 'vegetarian';

  const { data, currentData, isLoading, isFetching } = useSearchRecipesQuery(
    isVegetarianFilter ? { ...baseSearchArgs, diet_type: 'vegetarian' } : baseSearchArgs
  );
  const {
    data: veganData,
    currentData: veganCurrentData,
    isLoading: isLoadingVegan,
    isFetching: isFetchingVegan,
  } = useSearchRecipesQuery({ ...baseSearchArgs, diet_type: 'vegan' }, { skip: !isVegetarianFilter });

  // Skeleton chỉ khi chưa có kết quả cho bộ lọc hiện tại (lần đầu / đổi từ khóa).
  // Refetch nền (vd: sau khi lưu món) giữ nguyên danh sách & vị trí cuộn.
  const showSkeleton =
    isLoading ||
    (isFetching && !currentData) ||
    (isVegetarianFilter && (isLoadingVegan || (isFetchingVegan && !veganCurrentData)));

  const searchResults = React.useMemo(() => {
    const primary = data?.data || [];
    if (!isVegetarianFilter) return primary;
    // Gộp 2 nguồn, bỏ trùng, sắp xếp như server: điểm phổ biến giảm dần rồi tên A → Z
    const merged = new Map<string, Recipe>();
    [...primary, ...(veganData?.data || [])].forEach((r) => merged.set(String(r.id), r));
    return Array.from(merged.values()).sort(
      (x, y) =>
        Number(y.popularity_score || 0) - Number(x.popularity_score || 0) ||
        x.name.localeCompare(y.name, 'vi')
    );
  }, [data, veganData, isVegetarianFilter]);

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}` as any);
  };

  const { data: savedData } = useGetSavedRecipesQuery(undefined, { skip: !isAuthenticated });
  const [saveRecipe] = useSaveRecipeMutation();
  const [unsaveRecipe] = useUnsaveRecipeMutation();

  const savedRecipeIds = React.useMemo(() => {
    const list = savedData?.data || [];
    return new Set(list.map((item) => String(item.recipe_id || item.recipe?.id)));
  }, [savedData]);

  const handleBookmarkRecipe = (recipe: Recipe) => {
    requireAuth(async () => {
      const recIdStr = String(recipe.id);
      const isSaved = savedRecipeIds.has(recIdStr);
      try {
        if (isSaved) {
          await unsaveRecipe(recipe.id).unwrap();
        } else {
          await saveRecipe(recipe.id).unwrap();
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
    }, '/(tabs)/search');
  };

  const bgColor = isDarkMode ? '#121212' : '#F9FAFB';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: bgColor }]}
      edges={['top']}>

      <View style={styles.container}>
        {/* Tiêu đề & Ô tìm kiếm */}
        <Text
          style={[styles.screenTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
          Tìm Kiếm Món Ăn
        </Text>

        {/* Thông báo lọc dị ứng cho User */}
        {isAuthenticated && (
          <View style={styles.allergyNote}>
            <Ionicons name="shield-checkmark" size={14} color="#059669" />
            <Text style={styles.allergyNoteText}>
              {UI_STRINGS.ALLERGY_FILTER_ACTIVE}
            </Text>
          </View>
        )}

        {avoidLabels.length > 0 && (
          <View style={styles.tasteRow}>
            <Ionicons name="options-outline" size={14} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            <Text numberOfLines={2} style={[styles.tasteRowText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              {tasteFilterOn ? `Đang lọc theo khẩu vị: ${avoidLabels.join(', ')}` : 'Đang tạm tắt lọc khẩu vị'}
            </Text>
            <Pressable
              hitSlop={6}
              accessibilityRole="switch"
              accessibilityState={{ checked: tasteFilterOn }}
              accessibilityLabel="Lọc món theo khẩu vị"
              onPress={() => setTasteFilterOn((v) => !v)}
              style={({ pressed }) => [styles.tasteToggle, pressed && { opacity: 0.7 }]}>
              <Text style={styles.tasteToggleText}>{tasteFilterOn ? 'Tắt' : 'Bật lại'}</Text>
            </Pressable>
          </View>
        )}

        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
            },
          ]}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDarkMode ? '#FFFFFF' : '#111827' },
            ]}
            placeholder="Tìm theo tên món, nguyên liệu..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="transparent"
            cursorColor="#EA580C"
            selectionColor="#FDBA74"
            autoCorrect={false}
            maxFontSizeMultiplier={1.3}
          />
          {searchTerm.length > 0 && (
            <Pressable
              hitSlop={12}
              onPress={() => setSearchTerm('')}
              android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: 20 }}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Xóa từ khóa">
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Các chip lọc đa tiêu chí: thời gian, độ khó, chế độ ăn */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}>
          <Chip
            label="⏱ < 15 phút"
            selected={selectedMaxTime === 15}
            onPress={() => setSelectedMaxTime(selectedMaxTime === 15 ? undefined : 15)}
          />
          <Chip
            label="⏱ < 30 phút"
            selected={selectedMaxTime === 30}
            onPress={() => setSelectedMaxTime(selectedMaxTime === 30 ? undefined : 30)}
          />
          <Chip
            label="Dễ"
            selected={selectedDifficulty === 'easy'}
            onPress={() => setSelectedDifficulty(selectedDifficulty === 'easy' ? undefined : 'easy')}
          />
          <Chip
            label="Vừa"
            selected={selectedDifficulty === 'medium'}
            onPress={() => setSelectedDifficulty(selectedDifficulty === 'medium' ? undefined : 'medium')}
          />
          <Chip
            label="Khó"
            selected={selectedDifficulty === 'hard'}
            onPress={() => setSelectedDifficulty(selectedDifficulty === 'hard' ? undefined : 'hard')}
          />
        </ScrollView>

        {/* Lịch sử tìm kiếm gần đây khi ô tìm kiếm đang trống */}
        {searchTerm.trim().length === 0 && history.length > 0 && (
          <SearchHistory
            history={history}
            onSelect={(kw) => setSearchTerm(kw)}
            onRemove={handleRemoveHistory}
            onClearAll={handleClearAllHistory}
          />
        )}

        {/* Kết quả tìm kiếm & Trạng thái tải rõ ràng */}
        {showSkeleton ? (
          <View style={styles.listContent}>
            <RecipeTextCardSkeletonList />
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => `search-${item.id}`}
            renderItem={({ item }) => (
              <RecipeTextCard
                recipe={item}
                isSaved={savedRecipeIds.has(String(item.id))}
                onPress={handleRecipePress}
                onBookmarkPress={handleBookmarkRecipe}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            overScrollMode="never"
            // Tối ưu hiệu năng cho máy Android cấu hình thấp
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={7}
          />
        ) : (
          <EmptyState
            title="Không tìm thấy món ăn"
            description={UI_STRINGS.EMPTY_SEARCH}
            icon="🔍"
            actionTitle="Hỏi trợ lý AI"
            onActionPress={() => router.push('/assistant' as any)}
          />
        )}
      </View>

      {/* Nút FAB Trợ lý AI: View ngoài giữ elevation, Pressable trong giữ ripple bo tròn */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở trợ lý ẩm thực AI"
          onPress={() => router.push('/assistant' as any)}
          android_ripple={{ color: 'rgba(255,255,255,0.35)' }}
          style={({ pressed }) => [
            styles.fab,
            Platform.OS === 'ios' && pressed && { opacity: 0.85 },
          ]}>
          <Text style={styles.fabIcon}>🤖</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  screenTitle: {
    fontSize: 24,
    lineHeight: lineHeightFor(24),
    fontWeight: '700',
    marginBottom: 8,
    includeFontPadding: false,
  },
  allergyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  tasteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tasteRowText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  tasteToggle: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasteToggleText: {
    color: '#EA580C',
    fontSize: 13,
    fontWeight: '700',
  },
  allergyNoteText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    flexShrink: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    gap: 10,
    // iOS shadow + Android elevation
    ...shadow(1),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0, // Android có padding dọc mặc định làm lệch chữ
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScrollView: {
    minHeight: 56,
    marginTop: 10,
    marginBottom: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 0, // chừa chỗ cho elevation/shadow của chip không bị cắt
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 96, // chừa chỗ cho FAB, không che thẻ cuối
  },
  fabWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 20 : 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brand.primary,
    ...shadow(6),
  },
  fab: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden', // giữ ripple trong vòng tròn
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    ...emojiText(24),
  },
});
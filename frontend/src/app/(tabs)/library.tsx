import React, { useState } from 'react';
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  useGetSavedRecipesQuery,
  useGetMyRecipesQuery,
  useSaveRecipeMutation,
  useUnsaveRecipeMutation,
} from '@/store/apiSlice';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { RecipeTextCard } from '@/components/ui/RecipeTextCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecipeTextCardSkeletonList } from '@/components/ui/Skeleton';
import { UI_STRINGS } from '@/lib/constants';
import { Recipe } from '@/types/api';
import { shadow } from '@/lib/shadows';
import { ElevatedPressable } from '@/components/ui/ElevatedPressable';
import { brand } from '@/lib/theme';
import { emojiText, lineHeightFor } from '@/lib/typography';

// Hiệu ứng chạm: Android dùng ripple, iOS dùng opacity
const ripple = (color: string) =>
  Platform.OS === 'android' ? { color, borderless: false } : undefined;
const iosPressed = (pressed: boolean) =>
  Platform.OS === 'ios' && pressed ? styles.pressed : null;

// Thuộc tính tối ưu chung cho FlatList trên Android
const listProps = {
  showsVerticalScrollIndicator: false,
  keyboardShouldPersistTaps: 'handled' as const,
  keyboardDismissMode: 'on-drag' as const,
  overScrollMode: 'never' as const,
  initialNumToRender: 6,
  maxToRenderPerBatch: 8,
  windowSize: 7,
};

export default function LibraryScreen() {
  const router = useSafeRouter(); // chặn bấm liên tiếp mở trùng trang
  const { requireAuth } = useRequireAuth();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const [activeTab, setActiveTab] = useState<'saved' | 'my'>('saved');
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [mySearchQuery, setMySearchQuery] = useState('');

  // RTK Query cho 2 tab (chỉ kích hoạt query khi đã đăng nhập)
  // Chỉ dùng isLoading (lần tải đầu) để hiện skeleton — khi refetch nền vẫn giữ danh sách cũ
  const { data: savedData, isLoading: loadingSaved } = useGetSavedRecipesQuery(
    undefined,
    { skip: !isAuthenticated }
  );
  const { data: myData, isLoading: loadingMy } = useGetMyRecipesQuery(
    undefined,
    { skip: !isAuthenticated }
  );

  const [unsaveRecipe] = useUnsaveRecipeMutation();
  const [saveRecipe] = useSaveRecipeMutation();
  const { showToast } = useToast();

  const rawSavedList: Recipe[] = (savedData?.data || [])
    .map((item: any) => (item.recipe ? item.recipe : item))
    // Bỏ qua bản ghi tạm (cập nhật lạc quan) chưa có thông tin món
    .filter((r: Recipe) => Boolean(r?.name));
  const rawMyList = myData?.data || [];

  // Lọc riêng cho từng tab theo từ khóa tìm kiếm nội bộ
  const savedList = rawSavedList.filter((r) =>
    r.name.toLowerCase().includes(savedSearchQuery.toLowerCase())
  );
  const myList = rawMyList.filter((r) =>
    r.name.toLowerCase().includes(mySearchQuery.toLowerCase())
  );

  const handleOpenRecipe = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}` as any);
  };

  const handleUnsave = async (recipe: Recipe) => {
    try {
      await unsaveRecipe(recipe.id).unwrap();
      showToast({
        type: 'success',
        message: `Đã bỏ lưu "${recipe.name}"`,
        actionLabel: 'Hoàn tác',
        onAction: () => {
          saveRecipe(recipe.id)
            .unwrap()
            .catch(() => showToast({ type: 'error', message: 'Không thể hoàn tác. Vui lòng thử lại.' }));
        },
      });
    } catch {
      showToast({ type: 'error', message: 'Không thể bỏ lưu món ăn. Vui lòng thử lại.' });
    }
  };

  const bgColor = isDarkMode ? '#121212' : '#F9FAFB';

  // 1. TRƯỜNG HỢP GUEST: Màn hình mời đăng nhập có minh họa
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]} edges={['top']}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIllustration}>📚</Text>
          <Text
            style={[styles.guestTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Thư Viện Công Thức Của Bạn
          </Text>
          <Text
            maxFontSizeMultiplier={1.3}
            style={[styles.guestDescription, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            {UI_STRINGS.LOGIN_REQUIRED_SUBTITLE}
          </Text>
          <Button
            title="Đăng Nhập Ngay"
            onPress={() => requireAuth({ type: 'OPEN_LIBRARY', title: 'Mở Thư Viện' }, '/(tabs)/library')}
            variant="primary"
            size="lg"
            style={styles.guestLoginBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  const currentQuery = activeTab === 'saved' ? savedSearchQuery : mySearchQuery;

  // 2. TRƯỜNG HỢP USER ĐÃ ĐĂNG NHẬP
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]} edges={['top']}>

      <View style={styles.container}>
        {/* Tiêu đề & Nút Thùng Rác */}
        <View style={styles.headerRow}>
          <Text
            numberOfLines={1}
            style={[styles.screenTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Thư Viện Công Thức
          </Text>
          {activeTab === 'my' ? (
            <Pressable
              onPress={() => router.push('/settings/trash' as any)}
              hitSlop={8}
              android_ripple={ripple('rgba(239,68,68,0.15)')}
              style={({ pressed }) => [styles.trashBtn, iosPressed(pressed)]}
              accessibilityRole="button"
              accessibilityLabel="Mở thùng rác">
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={styles.trashBtnText}>Thùng rác</Text>
            </Pressable>
          ) : (
            <Text style={[styles.itemCountText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              {rawSavedList.length} món
            </Text>
          )}
        </View>

        {/* Segmented Control */}
        <View
          style={[
            styles.segmentContainer,
            { backgroundColor: isDarkMode ? '#27272A' : '#E5E7EB' },
          ]}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'saved' }}
            android_ripple={ripple('rgba(249,115,22,0.15)')}
            onPress={() => setActiveTab('saved')}
            style={[
              styles.segmentTab,
              activeTab === 'saved' && [
                styles.segmentTabActive,
                { backgroundColor: isDarkMode ? '#18181B' : '#FFFFFF' },
              ],
            ]}>
            <Text
              numberOfLines={1}
              style={[
                styles.segmentText,
                activeTab === 'saved' && styles.segmentTextActive,
                { color: activeTab === 'saved' ? '#EA580C' : isDarkMode ? '#A1A1AA' : '#6B7280' },
              ]}>
              ⭐ Đã Lưu (Chỉ đọc)
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'my' }}
            android_ripple={ripple('rgba(249,115,22,0.15)')}
            onPress={() => setActiveTab('my')}
            style={[
              styles.segmentTab,
              activeTab === 'my' && [
                styles.segmentTabActive,
                { backgroundColor: isDarkMode ? '#18181B' : '#FFFFFF' },
              ],
            ]}>
            <Text
              numberOfLines={1}
              style={[
                styles.segmentText,
                activeTab === 'my' && styles.segmentTextActive,
                { color: activeTab === 'my' ? '#EA580C' : isDarkMode ? '#A1A1AA' : '#6B7280' },
              ]}>
              📝 Của Tôi ({rawMyList.length})
            </Text>
          </Pressable>
        </View>

        {/* Ô tìm kiếm & lọc riêng cho từng tab */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
            },
          ]}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDarkMode ? '#FFFFFF' : '#111827' },
            ]}
            placeholder={
              activeTab === 'saved'
                ? 'Tìm trong danh sách đã lưu...'
                : 'Tìm trong công thức của tôi...'
            }
            placeholderTextColor="#9CA3AF"
            value={currentQuery}
            onChangeText={(txt) =>
              activeTab === 'saved' ? setSavedSearchQuery(txt) : setMySearchQuery(txt)
            }
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="transparent"
            cursorColor="#EA580C"
            selectionColor="#FDBA74"
            autoCorrect={false}
            maxFontSizeMultiplier={1.3}
          />
          {currentQuery.length > 0 && (
            <Pressable
              hitSlop={12}
              android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: 18 }}
              style={styles.clearButton}
              onPress={() =>
                activeTab === 'saved' ? setSavedSearchQuery('') : setMySearchQuery('')
              }
              accessibilityRole="button"
              accessibilityLabel="Xóa tìm kiếm">
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Nút tạo công thức mới chỉ xuất hiện ở tab Của Tôi */}
        {activeTab === 'my' && (
          <ElevatedPressable
            level={2}
            onPress={() => router.push('/recipe/new' as any)}
            android_ripple={ripple('rgba(255,255,255,0.3)')}
            style={({ pressed }) => [styles.createBtn, iosPressed(pressed)]}
            accessibilityRole="button"
            accessibilityLabel="Thêm công thức mới">
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Thêm Công Thức Mới</Text>
          </ElevatedPressable>
        )}

        {/* Nội dung danh sách */}
        {activeTab === 'saved' ? (
          loadingSaved ? (
            <View style={styles.listContent}>
              <RecipeTextCardSkeletonList />
            </View>
          ) : savedList.length > 0 ? (
            <FlatList
              data={savedList}
              keyExtractor={(item) => `saved-${item.id}`}
              renderItem={({ item }) => (
                <RecipeTextCard
                  recipe={item}
                  isSaved={true}
                  onPress={handleOpenRecipe}
                  onBookmarkPress={handleUnsave}
                />
              )}
              contentContainerStyle={styles.listContent}
              {...listProps}
            />
          ) : (
            <EmptyState
              title={
                savedSearchQuery ? 'Không tìm thấy món phù hợp' : 'Chưa có món ăn đã lưu'
              }
              description={
                savedSearchQuery
                  ? 'Hãy thử tìm kiếm với tên món khác.'
                  : UI_STRINGS.EMPTY_SAVED_RECIPES
              }
              icon="⭐"
              actionTitle={savedSearchQuery ? undefined : 'Khám phá ngay'}
              onActionPress={() => router.push('/(tabs)')}
            />
          )
        ) : loadingMy ? (
          <View style={styles.listContent}>
            <RecipeTextCardSkeletonList />
          </View>
        ) : myList.length > 0 ? (
          <FlatList
            data={myList}
            keyExtractor={(item) => `my-${item.id}`}
            renderItem={({ item }) => (
              <RecipeTextCard
                recipe={item}
                onPress={handleOpenRecipe}
              />
            )}
            contentContainerStyle={styles.listContent}
            {...listProps}
          />
        ) : (
          <EmptyState
            title={
              mySearchQuery
                ? 'Không tìm thấy công thức của bạn'
                : 'Chưa có công thức của riêng bạn'
            }
            description={
              mySearchQuery
                ? 'Hãy thử tìm với từ khóa khác.'
                : UI_STRINGS.EMPTY_MY_RECIPES
            }
            icon="📝"
            actionTitle="Thêm công thức mới"
            onActionPress={() => router.push('/recipe/new' as any)}
          />
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  screenTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: lineHeightFor(24),
    fontWeight: '700',
    includeFontPadding: false,
  },
  itemCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  trashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trashBtnText: {
    color: '#EF4444',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    fontWeight: '600',
    includeFontPadding: false,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  segmentTab: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    overflow: 'hidden', // giữ ripple trong góc bo
  },
  segmentTabActive: {
    ...shadow(1),
  },
  segmentText: {
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    fontWeight: '600',
    includeFontPadding: false,
  },
  segmentTextActive: {
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 8,
    marginBottom: 12,
    ...shadow(1),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
  createBtn: {
    backgroundColor: brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.85,
  },
  listContent: {
    paddingVertical: 4,
    paddingBottom: 40,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  guestIllustration: {
    ...emojiText(68),
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  guestDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 28,
  },
  guestLoginBtn: {
    minWidth: 200,
  },
});
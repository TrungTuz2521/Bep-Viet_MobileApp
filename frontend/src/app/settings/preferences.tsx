import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppSelector } from '@/store';
import {
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} from '@/store/apiSlice';
import type { IngredientOption, TastePreferences, UserPreferences } from '@/types/api';
import { DIET_OPTIONS, EMPTY_TASTES } from '@/features/preferences/constants';
import { TastePicker } from '@/features/preferences/components/TastePicker';
import { AllergyPicker } from '@/features/preferences/components/AllergyPicker';

import {Chip} from '@/components/ui/Chip';
import {Button} from '@/components/ui/Button';

// Dữ liệu sở thích từ API (xem GET /user/preferences)
type PreferencesResponse = UserPreferences;

export default function PreferencesSettingsScreen() {
  // Nút cố định đáy không bị home indicator / gesture bar che
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isDarkMode = useAppSelector(
    (state) => state.ui.isDarkMode
  );

  const queryResult = useGetPreferencesQuery();

  const {
    isLoading,
    isFetching,
    isError,
    refetch,
  } = queryResult;

  const data = queryResult.data;

  const [
    updatePreferences,
    { isLoading: isUpdating },
  ] = useUpdatePreferencesMutation();

  // null nghĩa là người dùng chưa chỉnh sửa lựa chọn.
  // Khi đó màn hình lấy dữ liệu trực tiếp từ API.
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null);
  const [selectedTastes, setSelectedTastes] = useState<TastePreferences | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[] | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientOption[] | null>(null);

  const preferences = data?.data as PreferencesResponse | undefined;

  // Ưu tiên lựa chọn người dùng đã chỉnh sửa trên màn hình.
  const currentDiet = selectedDiet ?? preferences?.preferred_diet_type ?? 'omnivore';
  const currentTastes = selectedTastes ?? { ...EMPTY_TASTES, ...(preferences?.taste_preferences ?? {}) };
  const currentGroupIds = selectedGroupIds ?? preferences?.allergy_group_ids ?? [];
  const currentIngredients = selectedIngredients ?? preferences?.allergies ?? [];

  const backgroundColor = isDarkMode
    ? '#121212'
    : '#FFFFFF';

  const primaryTextColor = isDarkMode
    ? '#F9FAFB'
    : '#111827';

  const secondaryTextColor = isDarkMode
    ? '#9CA3AF'
    : '#6B7280';

  const handleSave = async () => {
    if (isUpdating) {
      return;
    }

    try {
      await updatePreferences({
        preferred_diet_type: currentDiet,
        taste_preferences: currentTastes,
        allergy_group_ids: currentGroupIds,
        allergy_ingredient_ids: currentIngredients.map((i) => i.id),
      }).unwrap();

      // Xóa lựa chọn tạm để màn hình sử dụng dữ liệu mới từ API.
      setSelectedDiet(null);
      setSelectedTastes(null);
      setSelectedGroupIds(null);
      setSelectedIngredients(null);

      Alert.alert(
        'Thành công',
        'Đã lưu sở thích và cập nhật bộ lọc dị ứng.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        'Lỗi cập nhật preferences:',
        error
      );

      Alert.alert(
        'Không thể lưu',
        'Đã xảy ra lỗi khi lưu cài đặt. Vui lòng kiểm tra kết nối và thử lại.'
      );
    }
  };

  // Hiển thị trạng thái tải ban đầu.
  if (isLoading && !data?.data) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor },
        ]}
      >
        <ActivityIndicator
          size="large"
          color="#F97316"
        />

        <Text
          style={[
            styles.loadingText,
            { color: secondaryTextColor },
          ]}
        >
          Đang tải sở thích cá nhân...
        </Text>
      </View>
    );
  }

  // Hiển thị lỗi nếu không tải được dữ liệu và không có dữ liệu cũ.
  if (isError && !data?.data) {
    return (
      <SafeAreaView
        style={[
          styles.centerContainer,
          { backgroundColor },
        ]}
        edges={['top', 'bottom']}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={44}
          color={secondaryTextColor}
        />

        <Text
          style={[
            styles.errorTitle,
            { color: primaryTextColor },
          ]}
        >
          Không tải được cài đặt
        </Text>

        <Text
          style={[
            styles.sectionDesc,
            { color: secondaryTextColor },
          ]}
        >
          Vui lòng kiểm tra kết nối mạng rồi thử lại.
        </Text>

        <Button
          title="Thử lại"
          onPress={() => {
            void refetch();
          }}
          variant="primary"
          size="lg"
        />

        <Pressable
          onPress={() => router.back()}
          style={styles.backLink}
          accessibilityRole="button"
        >
          <Text style={styles.backLinkText}>
            Quay lại
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor },
      ]}
      edges={['top', 'bottom']}
    >
      {/* Thanh tiêu đề */}
      <View style={styles.topBar}>
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={primaryTextColor}
          />
        </Pressable>

        <Text
          style={[
            styles.topTitle,
            { color: primaryTextColor },
          ]}
        >
          Sở Thích & Dị Ứng
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Nội dung cài đặt */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Chế độ ăn */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: primaryTextColor }]}>
            🥗 Chế Độ Ăn
          </Text>
          <Text style={[styles.sectionDesc, { color: secondaryTextColor }]}>
            Chọn 1 chế độ ăn để ứng dụng gợi ý món phù hợp.
          </Text>
          <View style={styles.chipGrid}>
            {DIET_OPTIONS.map((diet) => (
              <Chip
                key={diet.id}
                label={diet.label}
                selected={currentDiet === diet.id}
                onPress={() => setSelectedDiet(diet.id)}
              />
            ))}
          </View>
        </View>

        {/* Khẩu vị theo mức */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: primaryTextColor }]}>
            🍲 Khẩu Vị
          </Text>
          <Text style={[styles.sectionDesc, { color: secondaryTextColor }]}>
            Chọn mức cho từng vị. &quot;Không ăn cay&quot;, &quot;Ăn nhạt&quot;, &quot;Ít ngọt&quot;, &quot;Ít dầu mỡ&quot; sẽ ẩn món
            không hợp; các lựa chọn &quot;thích&quot; chỉ đưa món hợp lên đầu. Độ cay, mặn, ngọt được ước tính
            từ định lượng trong công thức. Chạm lại để bỏ chọn.
          </Text>
          <TastePicker value={currentTastes} onChange={setSelectedTastes} />
        </View>

        {/* Phần dị ứng */}
        <View style={styles.section}>
          <Text style={styles.allergyTitle}>
            🛡️ Dị Ứng & Kiêng Khem (Lọc Cứng)
          </Text>

          <Text
            style={[
              styles.sectionDesc,
              { color: secondaryTextColor },
            ]}
          >
            Ứng dụng sẽ ẩn hoàn toàn mọi công thức có chứa nguyên liệu thuộc nhóm hoặc nguyên liệu
            bạn chọn dưới đây — ở Khám phá, Tìm kiếm và Trợ lý AI.
          </Text>

          <AllergyPicker
            groupIds={currentGroupIds}
            onGroupIdsChange={setSelectedGroupIds}
            ingredients={currentIngredients}
            onIngredientsChange={setSelectedIngredients}
          />
        </View>

        {/* Hiển thị khi đang tải lại dữ liệu nền */}
        {isFetching && !isLoading && (
          <View style={styles.refreshIndicator}>
            <ActivityIndicator
              size="small"
              color="#F97316"
            />

            <Text
              style={[
                styles.refreshText,
                { color: secondaryTextColor },
              ]}
            >
              Đang cập nhật dữ liệu...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Nút lưu cố định phía dưới */}
      <View
        style={[
          styles.footerBar,
          {
            backgroundColor: isDarkMode
              ? '#18181B'
              : '#FFFFFF',
            borderTopColor: isDarkMode
              ? '#27272A'
              : '#E5E7EB',
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        <Button
          title={
            isUpdating
              ? 'Đang lưu...'
              : 'Lưu Thay Đổi'
          }
          onPress={handleSave}
          loading={isUpdating}
          disabled={isUpdating}
          variant="primary"
          size="lg"
          style={styles.saveBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  loadingText: {
    marginTop: 12,
    textAlign: 'center',
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },

  backLink: {
    marginTop: 20,
    padding: 12,
  },

  backLinkText: {
    color: '#F97316',
    fontWeight: '600',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },

  headerSpacer: {
    width: 44,
  },

  topTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  allergyTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  sectionDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    textAlign: 'left',
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },

  refreshText: {
    fontSize: 12,
  },

  footerBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },

  saveBtn: {
    width: '100%',
  },
});
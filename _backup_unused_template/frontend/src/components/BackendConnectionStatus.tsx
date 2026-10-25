import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppSelector } from '@/store';
import {
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  useGetAllergyOptionsQuery,
} from '@/store/apiSlice';

import {Chip} from '@/components/ui/Chip';
import {Button} from '@/components/ui/Button';

type TasteOption = {
  id: string;
  label: string;
};

type PreferencesResponse = {
  preferred_diet_type?: string | null;
  preferred_tastes?: string | null;
  allergy_ingredient_ids?: string[] | null;
};

type PreferencesApiResponse = {
  data?: PreferencesResponse;
};

type UpdatePreferencesPayload = {
  preferred_diet_type: string;
  preferred_tastes: string;
  allergy_ingredient_ids: string[];
};

const TASTE_OPTIONS: TasteOption[] = [
  { id: 'omnivore', label: '🥩 Món Mặn Truyền Thống' },
  { id: 'vegetarian', label: '🥗 Ăn Chay Thanh Tịnh' },
  { id: 'eat_clean', label: '🥑 Eat Clean & Giữ Dáng' },
  { id: 'keto', label: '🧀 Keto Ít Tinh Bột' },
  { id: 'spicy', label: '🌶 Thích Vị Cay Nồng' },
  { id: 'sweet_mild', label: '🍯 Hương Vị Ngọt Dịu' },
  { id: 'low_oil', label: '🍵 Thanh Đạm Ít Dầu Mỡ' },
  { id: 'quick_meal', label: '⏱ Nấu Nhanh Tiện Lợi' },
];



// Những lựa chọn đại diện cho chế độ ăn.
// Các lựa chọn khác là khẩu vị hoặc tiêu chí nấu ăn.
const DIET_TYPE_IDS = [
  'omnivore',
  'vegetarian',
  'eat_clean',
  'keto',
] as const;

const DEFAULT_TASTES = ['omnivore'];

function getValidTastes(
  preferences?: PreferencesResponse
): string[] {
  if (!preferences) {
    return [...DEFAULT_TASTES];
  }

  const tastes: string[] = [];

  if (
    typeof preferences.preferred_tastes === 'string' &&
    preferences.preferred_tastes.trim()
  ) {
    tastes.push(
      ...preferences.preferred_tastes
        .split(',')
        .map((taste) => taste.trim())
        .filter(Boolean)
    );
  }

  if (
    typeof preferences.preferred_diet_type === 'string' &&
    preferences.preferred_diet_type.trim()
  ) {
    tastes.push(preferences.preferred_diet_type.trim());
  }

  const validTastes = Array.from(new Set(tastes)).filter(
    (taste) =>
      TASTE_OPTIONS.some((option) => option.id === taste)
  );

  return validTastes.length > 0
    ? validTastes
    : [...DEFAULT_TASTES];
}

function getValidAllergies(
  preferences?: PreferencesResponse
): string[] {
  const allergyIds = preferences?.allergy_ingredient_ids;

  if (!Array.isArray(allergyIds)) {
    return [];
  }

  return Array.from(new Set(
    allergyIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
  ));
}

function getDietType(tastes: string[]): string {
  return (
    DIET_TYPE_IDS.find((dietType) =>
      tastes.includes(dietType)
    ) ?? 'omnivore'
  );
}

export default function PreferencesSettingsScreen() {
  const router = useRouter();

  const isDarkMode = useAppSelector(
    (state) => state.ui.isDarkMode
  );

  const queryResult = useGetPreferencesQuery();
  const { data: allergyOptionsData } = useGetAllergyOptionsQuery();
  const allergyOptions = allergyOptionsData?.data ?? [];

  const {
    isLoading,
    isFetching,
    isError,
    refetch,
  } = queryResult;

  /*
   * Giữ nguyên apiSlice.ts.
   *
   * Ép kiểu qua unknown để tránh lỗi TypeScript khi kiểu
   * ApiResponse hiện tại khiến dữ liệu bị suy luận thành never.
   *
   * Cách này giả định response có cấu trúc { data: {...} }.
   */
  const response = queryResult.data as unknown as
    | PreferencesApiResponse
    | undefined;

  const preferences = response?.data;

  const [
    updatePreferences,
    { isLoading: isUpdating },
  ] = useUpdatePreferencesMutation();

  /*
   * null: người dùng chưa chỉnh sửa.
   * Khi đó sử dụng dữ liệu từ API.
   *
   * Mảng: người dùng đã chỉnh sửa trên màn hình.
   */
  const [selectedTastes, setSelectedTastes] =
    useState<string[] | null>(null);

  const [selectedAllergies, setSelectedAllergies] =
    useState<string[] | null>(null);

  const tastesFromApi = getValidTastes(preferences);
  const allergiesFromApi = getValidAllergies(preferences);

  const currentTastes =
    selectedTastes ?? tastesFromApi;

  const currentAllergies =
    selectedAllergies ?? allergiesFromApi;

  const backgroundColor = isDarkMode
    ? '#121212'
    : '#FFFFFF';

  const primaryTextColor = isDarkMode
    ? '#F9FAFB'
    : '#111827';

  const secondaryTextColor = isDarkMode
    ? '#9CA3AF'
    : '#6B7280';

  const toggleTaste = (id: string) => {
    setSelectedTastes((previous) => {
      const current = previous ?? tastesFromApi;

      if (current.includes(id)) {
        const next = current.filter(
          (item) => item !== id
        );

        // Không cho bỏ chọn tất cả khẩu vị.
        return next.length > 0 ? next : current;
      }

      return [...current, id];
    });
  };

  const toggleAllergy = (id: string) => {
    setSelectedAllergies((previous) => {
      const current = previous ?? allergiesFromApi;

      return current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
    });
  };

  const handleSave = async () => {
    if (isUpdating) {
      return;
    }

    if (isLoading || isFetching) {
      Alert.alert(
        'Vui lòng chờ',
        'Dữ liệu sở thích đang được tải. Hãy thử lưu lại sau.'
      );
      return;
    }

    if (isError && !preferences) {
      Alert.alert(
        'Không thể lưu',
        'Không tải được sở thích hiện tại. Vui lòng thử tải lại trước khi lưu.'
      );
      return;
    }

    const payload: UpdatePreferencesPayload = {
      // Không nhầm khẩu vị như spicy với chế độ ăn.
      preferred_diet_type: getDietType(currentTastes),

      // Gửi toàn bộ lựa chọn khẩu vị.
      preferred_tastes: currentTastes.join(', '),

      // Gửi danh sách nguyên liệu cần tránh.
      allergy_ingredient_ids: currentAllergies,
    };

    try {
      await updatePreferences(payload).unwrap();

      /*
       * Không đặt selectedTastes/selectedAllergies về null tại đây.
       * Cache API có thể chưa được cập nhật ngay lập tức.
       * Giữ lựa chọn hiện tại tránh giao diện nhảy về dữ liệu cũ.
       */
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

  // Chỉ hiển thị loading toàn màn hình khi chưa có dữ liệu.
  if (isLoading && !preferences) {
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

  // Có lỗi và không có dữ liệu để sử dụng.
  if (isError && !preferences) {
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Khẩu vị */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: primaryTextColor },
            ]}
          >
            🍲 Khẩu Vị Ẩm Thực
          </Text>

          <Text
            style={[
              styles.sectionDesc,
              { color: secondaryTextColor },
            ]}
          >
            Chọn những khẩu vị phù hợp để ứng dụng đề xuất
            các món ăn dành cho bạn.
          </Text>

          <View style={styles.chipGrid}>
            {TASTE_OPTIONS.map((taste) => (
              <Chip
                key={taste.id}
                label={taste.label}
                selected={currentTastes.includes(taste.id)}
                onPress={() => toggleTaste(taste.id)}
              />
            ))}
          </View>
        </View>

        {/* Dị ứng */}
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
            Chọn các nguyên liệu bạn bị dị ứng hoặc cần tránh.
            Backend cần hỗ trợ lọc các công thức chứa những
            nguyên liệu này.
          </Text>

          <View style={styles.chipGrid}>
            {allergyOptions.length === 0 ? (
              <ActivityIndicator size="small" color="#EF4444" style={{ marginVertical: 8 }} />
            ) : (
              allergyOptions.map((allergy) => (
                <Chip
                  key={allergy.id}
                  label={allergy.label}
                  selected={currentAllergies.includes(allergy.id)}
                  isAllergy={true}
                  onPress={() => toggleAllergy(allergy.id)}
                />
              ))
            )}
          </View>
        </View>

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

      {/* Nút lưu */}
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
          disabled={isUpdating || isFetching}
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

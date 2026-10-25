
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { ListMarker } from '@/components/ui/ListMarker';
import { Ionicons } from '@expo/vector-icons';

import { useAppSelector } from '@/store';
import {
  useGetTrashRecipesQuery,
  useRestoreMyRecipeMutation,
} from '@/store/apiSlice';

import {Button} from '@/components/ui/Button';
import {EmptyState} from '@/components/ui/EmptyState';
import { APP_CONFIG } from '@/lib/constants';
import { shadow } from '@/lib/shadows';
import { useThemeColors } from '@/lib/theme';

type TrashRecipe = {
  id: number | string;
  name: string;
  image_url?: string | null;
  deleted_at?: string | null;
};

type TrashResponse = {
  data?: TrashRecipe[];
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export default function TrashScreen() {
  const router = useSafeRouter(); // chặn bấm liên tiếp mở trùng trang

  const isDarkMode = useAppSelector(
    (state) => state.ui.isDarkMode
  );
  // Màu nhấn theo dark mode (lib/theme.ts)
  const colors = useThemeColors();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetTrashRecipesQuery();

  const [
    restoreRecipe,
    { isLoading: isRestoring },
  ] = useRestoreMyRecipeMutation();

  // Lấy thời điểm hiện tại khi khởi tạo component,
  // tránh gọi Date.now() trực tiếp trong render.
  const [now] = useState(() => Date.now());

  const [restoringId, setRestoringId] = useState<
    number | string | null
  >(null);

  const trashedRecipes: TrashRecipe[] =
    ((data as TrashResponse | undefined)?.data ?? []);

  const calculateDaysLeft = (
    deletedAt?: string | null
  ): number => {
    const retentionDays = APP_CONFIG.RETENTION_DAYS;

    if (!deletedAt) {
      return retentionDays;
    }

    const deletedDate = new Date(deletedAt).getTime();

    if (Number.isNaN(deletedDate)) {
      return retentionDays;
    }

    const daysPassed = Math.floor(
      (now - deletedDate) / MILLISECONDS_PER_DAY
    );

    return Math.max(0, retentionDays - daysPassed);
  };

  const handleRestore = async (
    id: number | string,
    name: string
  ) => {
    if (isRestoring) {
      return;
    }

    setRestoringId(id);

    try {
      await restoreRecipe(id).unwrap();

      Alert.alert(
        'Thành công',
        `Đã khôi phục công thức "${name}" về thư viện.`
      );

      // Cập nhật danh sách sau khi khôi phục.
      await refetch();
    } catch (error) {
      console.error('Lỗi khôi phục công thức:', error);

      Alert.alert(
        'Khôi phục thất bại',
        'Không thể khôi phục công thức. Vui lòng thử lại.'
      );
    } finally {
      setRestoringId(null);
    }
  };

  const backgroundColor = isDarkMode
    ? '#121212'
    : '#F9FAFB';

  const primaryTextColor = isDarkMode
    ? '#F9FAFB'
    : '#111827';

  const secondaryTextColor = isDarkMode
    ? '#9CA3AF'
    : '#6B7280';

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor },
        ]}
        edges={['top']}
      >
        <View style={styles.centerLoading}>
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
            Đang tải thùng rác...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError && !data) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor },
        ]}
        edges={['top']}
      >
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
            Thùng Rác Công Thức
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerLoading}>
          <Ionicons
            name="cloud-offline-outline"
            size={44}
            color={secondaryTextColor}
          />

          <Text
            style={[
              styles.errorText,
              { color: primaryTextColor },
            ]}
          >
            Không thể tải thùng rác.
          </Text>

          <Button
            title="Thử lại"
            onPress={() => {
              void refetch();
            }}
            variant="primary"
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor },
      ]}
      edges={['top']}
    >
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
          Thùng Rác Công Thức
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.policyBanner, { backgroundColor: colors.warningTint, borderColor: colors.warningTintBorder }, { backgroundColor: colors.warningTint, borderColor: colors.warningTintBorder }]}>
        <Ionicons
          name="time-outline"
          size={18}
          color={colors.warningAccent}
        />

        <Text style={[styles.policyText, { color: colors.warningTextStrong }, { color: colors.warningTextStrong }]}>
          Công thức đã xóa được lưu giữ{' '}
          {APP_CONFIG.RETENTION_DAYS} ngày trước khi
          bị xóa vĩnh viễn. Bạn có thể khôi phục
          trong thời gian này.
        </Text>
      </View>

      <View style={styles.content}>
        {trashedRecipes.length > 0 ? (
          <FlatList
            data={trashedRecipes}
            keyExtractor={(item) => `trash-${item.id}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={false}
            onRefresh={() => {
              void refetch();
            }}
            renderItem={({ item, index }) => {
              const daysLeft = calculateDaysLeft(
                item.deleted_at
              );

              const isThisRestoring =
                restoringId === item.id && isRestoring;

              return (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDarkMode
                        ? '#1E1E1E'
                        : '#FFFFFF',
                      borderColor: isDarkMode
                        ? '#2D2D2D'
                        : '#E5E7EB',
                    },
                  ]}
                >
                  <ListMarker index={index} isDarkMode={isDarkMode} />

                  <View style={styles.cardInfo}>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.recipeName,
                        { color: primaryTextColor },
                      ]}
                    >
                      {item.name}
                    </Text>

                    <View style={[styles.retentionBadge, { backgroundColor: colors.dangerTint }, { backgroundColor: colors.dangerTint }]}>
                      <Text style={[styles.retentionText, { color: colors.dangerAccent }, { color: colors.dangerAccent }]}>
                        {daysLeft === 0
                          ? 'Đã hết hạn'
                          : `Còn ${daysLeft} ngày`}
                      </Text>
                    </View>
                  </View>

                  <Button
                    title="Khôi phục"
                    icon={
                      <Ionicons
                        name="refresh-outline"
                        size={16}
                        color="#FFFFFF"
                      />
                    }
                    onPress={() => {
                      void handleRestore(
                        item.id,
                        item.name
                      );
                    }}
                    loading={isThisRestoring}
                    disabled={isRestoring}
                    variant="primary"
                    size="sm"
                    style={styles.restoreBtn}
                  />
                </View>
              );
            }}
          />
        ) : (
          <EmptyState
            icon="🗑️"
            title="Thùng rác trống"
            description="Bạn không có công thức nào đang chờ xóa."
            actionTitle="Quay lại thư viện"
            onActionPress={() => router.back()}
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
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    marginTop: 4,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    ...shadow(1),
  },
  cardInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  retentionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  retentionText: {
    fontSize: 12, // thông tin quan trọng (số ngày còn lại) — không để quá nhỏ
    fontWeight: '700',
  },
  restoreBtn: {
    paddingHorizontal: 14,
  },
});

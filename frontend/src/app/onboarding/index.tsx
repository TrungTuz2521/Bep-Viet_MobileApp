import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';
import { useUpdatePreferencesMutation } from '@/store/apiSlice';
import type { IngredientOption, TastePreferences } from '@/types/api';
import { DIET_OPTIONS, EMPTY_TASTES } from '@/features/preferences/constants';
import { TastePicker } from '@/features/preferences/components/TastePicker';
import { AllergyPicker } from '@/features/preferences/components/AllergyPicker';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';


export default function OnboardingScreen() {
  // Nút cố định đáy không bị home indicator / gesture bar che
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const returnTo = useAppSelector((state) => state.ui.returnTo);

  const [diet, setDiet] = useState<string>('omnivore');
  const [tastes, setTastes] = useState<TastePreferences>(EMPTY_TASTES);
  const [allergyGroupIds, setAllergyGroupIds] = useState<string[]>([]);
  const [allergyIngredients, setAllergyIngredients] = useState<IngredientOption[]>([]);

  const [updatePreferences, { isLoading }] = useUpdatePreferencesMutation();

  // Chỉ dùng cho giao diện: máy màn hình hẹp thì thu lề và cỡ chữ lại một chút
  const isSmall = screenWidth < 360;
  const sidePadding = isSmall ? 16 : 20;

  const handleFinish = async () => {
    try {
      await updatePreferences({
        preferred_diet_type: diet,
        taste_preferences: tastes,
        allergy_group_ids: allergyGroupIds,
        allergy_ingredient_ids: allergyIngredients.map((i) => i.id),
      }).unwrap();

      Alert.alert('Thành công', 'Đã lưu sở thích ẩm thực và bộ lọc dị ứng của bạn!');
      if (returnTo) {
        router.replace(returnTo as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      // Fallback khi chạy offline
      if (returnTo) {
        router.replace(returnTo as any);
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' },
      ]}
      edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: sidePadding }]}
        showsVerticalScrollIndicator={false}>
        {/* Tiêu đề Onboarding */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🎯</Text>
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? '#F9FAFB' : '#111827', fontSize: isSmall ? 22 : 26 },
            ]}>
            Thiết Lập Khẩu Vị
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Chọn sở thích và nguyên liệu kiêng khem để trợ lý gợi ý món ăn an toàn, chuẩn gu của bạn nhất!
          </Text>
        </View>

        {/* PHẦN 1: CHẾ ĐỘ ĂN */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="leaf-outline" size={18} color="#F97316" />
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
              Chế Độ Ăn
            </Text>
          </View>
          <View style={styles.chipGrid}>
            {DIET_OPTIONS.map((option) => (
              <View key={option.id} style={styles.chipWrapper}>
                <Chip label={option.label} selected={diet === option.id} onPress={() => setDiet(option.id)} />
              </View>
            ))}
          </View>
        </View>

        {/* PHẦN 2: KHẨU VỊ THEO MỨC */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="restaurant-outline" size={18} color="#F97316" />
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
              Khẩu Vị Của Bạn
            </Text>
          </View>
          <Text style={[styles.sectionHelp, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Có thể bỏ qua. Lựa chọn kiểu &quot;tránh&quot; sẽ ẩn món không hợp, kiểu &quot;thích&quot; chỉ ưu tiên.
          </Text>
          <TastePicker value={tastes} onChange={setTastes} />
        </View>

        {/* PHẦN 3: DỊ ỨNG / KIÊNG KHEM CỨNG */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="warning-outline" size={18} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
              Dị Ứng & Kiêng Khem (Lọc Cứng)
            </Text>
          </View>
          <Text style={[styles.sectionHelp, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Hệ thống sẽ TUYỆT ĐỐI KHÔNG gợi ý bất kỳ công thức nào chứa các nguyên liệu bạn đã chọn dưới đây.
          </Text>
          <AllergyPicker
            groupIds={allergyGroupIds}
            onGroupIdsChange={setAllergyGroupIds}
            ingredients={allergyIngredients}
            onIngredientsChange={setAllergyIngredients}
          />
        </View>
      </ScrollView>

      {/* Thanh nút hoàn tất cố định */}
      <View
        style={[
          styles.footerBar,
          {
            backgroundColor: isDarkMode ? '#18181B' : '#FFFFFF',
            borderTopColor: isDarkMode ? '#27272A' : '#E5E7EB',
            paddingBottom: Math.max(insets.bottom, 12),
            paddingHorizontal: sidePadding,
          },
        ]}>
        <Button
          title="Hoàn Tất & Bắt Đầu Nấu Ăn"
          onPress={handleFinish}
          loading={isLoading}
          variant="primary"
          size="lg"
          style={styles.finishBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    // Footer nằm ngoài ScrollView nên không cần chừa 100px như trước
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 44,
    lineHeight: 54, // tránh emoji bị cắt trên một số máy Android
    marginBottom: 6,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    width: '100%',
    maxWidth: 320,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    // flex + flexShrink để tiêu đề dài tự xuống dòng thay vì tràn khỏi màn hình
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    marginLeft: 8,
  },
  sectionHelp: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  // Giới hạn mỗi chip không rộng quá hàng chứa nó
  chipWrapper: {
    maxWidth: '100%',
  },
  footerBar: {
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  finishBtn: {
    width: '100%',
  },
});
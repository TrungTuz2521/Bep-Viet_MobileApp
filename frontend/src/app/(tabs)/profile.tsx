import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutThunk } from '@/features/auth/slice';
import { setThemePreference, ThemePreference } from '@/store/uiSlice';
import { saveThemePreference } from '@/lib/themePreference';
import { Button } from '@/components/ui/Button';
import { shadow } from '@/lib/shadows';
import { useThemeColors } from '@/lib/theme';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'Hệ thống', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Sáng', icon: 'sunny-outline' },
  { value: 'dark', label: 'Tối', icon: 'moon-outline' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // Màu nhấn theo dark mode (lib/theme.ts)
  const colors = useThemeColors();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const themePreference = useAppSelector((state) => state.ui.themePreference);

  // Đổi giao diện và lưu lại cho lần mở app sau
  const handleSelectTheme = (preference: ThemePreference) => {
    dispatch(setThemePreference(preference));
    saveThemePreference(preference);
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          dispatch(logoutThunk());
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? '#121212' : '#F9FAFB' },
      ]}
      edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.screenTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
          Cá Nhân
        </Text>

        {/* Thông tin User hoặc Mời Đăng Nhập */}
        {isAuthenticated && user ? (
          <View
            style={[
              styles.userCard,
              {
                backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
              },
            ]}>
            <Image
              source={{
                uri: user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
              }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                {user.name}
              </Text>
              <Text style={[styles.userEmail, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                {user.email}
              </Text>
              <View style={[styles.roleTag, { backgroundColor: colors.warningTint }, { backgroundColor: colors.warningTint }]}>
                <Text style={[styles.roleText, { color: colors.warningAccent }, { color: colors.warningAccent }]}>
                  {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.guestCard,
              {
                backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
              },
            ]}>
            <Text style={styles.guestIcon}>👤</Text>
            <Text style={[styles.guestHeading, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
              Bạn đang ở chế độ Khách
            </Text>
            <Text style={[styles.guestDesc, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              Đăng nhập để đồng bộ hóa món đã lưu và cá nhân hóa trải nghiệm nấu ăn.
            </Text>
            <View style={styles.guestBtnRow}>
              <Button
                title="Đăng Nhập"
                onPress={() => router.push('/(auth)/login')}
                variant="primary"
                style={styles.flexBtn}
              />
              <Button
                title="Đăng Ký"
                onPress={() => router.push('/(auth)/register')}
                variant="outline"
                style={styles.flexBtn}
              />
            </View>
          </View>
        )}

        {/* Cài đặt giao diện & Hệ thống */}
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
          GIAO DIỆN
        </Text>
        <View
          style={[
            styles.menuGroup,
            {
              backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
            },
          ]}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny'}
                size={22}
                color="#F97316"
              />
              <Text style={[styles.menuItemText, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                Giao diện
              </Text>
            </View>
          </View>
          {/* Bộ chọn 3 lựa chọn: theo hệ thống / sáng / tối */}
          <View
            accessibilityRole="radiogroup"
            style={[styles.themeSegment, { backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' }]}>
            {THEME_OPTIONS.map((option) => {
              const selected = themePreference === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Giao diện ${option.label}`}
                  onPress={() => handleSelectTheme(option.value)}
                  style={({ pressed }) => [
                    styles.themeOption,
                    selected && [
                      styles.themeOptionActive,
                      { backgroundColor: isDarkMode ? '#3F3F46' : '#FFFFFF' },
                    ],
                    pressed && !selected && { opacity: 0.7 },
                  ]}>
                  <Ionicons
                    name={option.icon}
                    size={16}
                    color={selected ? '#F97316' : isDarkMode ? '#A1A1AA' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      {
                        color: selected
                          ? isDarkMode ? '#F9FAFB' : '#111827'
                          : isDarkMode ? '#A1A1AA' : '#6B7280',
                      },
                    ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Các mục chức năng chỉ dành cho User */}
        {isAuthenticated && (
          <>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              ẨM THỰC & BẢO MẬT
            </Text>
            <View
              style={[
                styles.menuGroup,
                {
                  backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                  borderColor: isDarkMode ? '#2D2D2D' : '#E5E7EB',
                },
              ]}>
              <Pressable
                style={styles.menuItem}
                onPress={() => router.push('/settings/preferences' as any)}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="nutrition-outline" size={22} color="#F97316" />
                  <Text style={[styles.menuItemText, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                    Sở thích ẩm thực & Dị ứng
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => router.push('/settings/history' as any)}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="time-outline" size={22} color="#F97316" />
                  <Text style={[styles.menuItemText, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                    Lịch sử đã xem & đã nấu
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => router.push('/settings/trash' as any)}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  <Text style={[styles.menuItemText, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                    Thùng rác (30 ngày lưu trữ)
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => router.push('/settings/change-password' as any)}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="key-outline" size={22} color="#F97316" />
                  <Text style={[styles.menuItemText, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                    Đổi mật khẩu
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => router.push('/settings/delete-account' as any)}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="person-remove-outline" size={22} color="#EF4444" />
                  <Text style={[styles.menuItemText, { color: '#EF4444' }]}>
                    Xóa tài khoản
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            </View>

            <Button
              title="Đăng Xuất"
              variant="danger"
              onPress={handleLogout}
              style={styles.logoutBtn}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 48,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  guestCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  guestIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  guestHeading: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  guestDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  guestBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  flexBtn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
    marginLeft: 4,
  },
  menuGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  logoutBtn: {
    marginTop: 12,
  },
  themeSegment: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginVertical: 12,
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  themeOption: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 9,
  },
  themeOptionActive: {
    ...shadow(1),
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

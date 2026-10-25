import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginThunk } from '@/features/auth/slice';
import { clearPendingAction } from '@/store/uiSlice';
import { loginSchema, LoginFormData } from '@/features/auth/schemas';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/lib/theme';

export default function LoginScreen() {
  // Inset thật của thiết bị: tránh nội dung bị notch / Dynamic Island / thanh điều hướng che
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // Màu nhấn theo dark mode (lib/theme.ts)
  const colors = useThemeColors();
  const pendingAction = useAppSelector((state) => state.ui.pendingAction);
  const returnTo = useAppSelector((state) => state.ui.returnTo);
  const authLoading = useAppSelector((state) => state.auth.isLoading);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      const res = await dispatch(loginThunk(data)).unwrap();
      if (res) {
        // NGHIỆP VỤ ACTION GATE: Tự động thực thi pendingAction sau khi đăng nhập thành công
        if (pendingAction) {
          console.log('Action Gate: Đang tự động thực thi pendingAction:', pendingAction);
          // Xóa pendingAction sau khi hoàn tất
          dispatch(clearPendingAction());
        }

        // Quay lại màn hình trước đó hoặc về trang chủ tabs
        if (returnTo) {
          router.replace(returnTo as any);
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      setErrorMessage(typeof err === 'string' ? err : 'Đăng nhập không thành công');
    }
  };

  const handleContinueAsGuest = () => {
    dispatch(clearPendingAction());
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' },
      ]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled">
        {/* Banner Action Gate nếu người dùng bị chặn */}
        {pendingAction && (
          <View style={[styles.actionGateBanner, { backgroundColor: colors.primaryTint, borderColor: colors.primaryTintBorder }, { backgroundColor: colors.primaryTint, borderColor: colors.primaryTintBorder }]}>
            <Text style={[styles.actionGateTitle, { color: colors.primaryTintText }, { color: colors.primaryTintText }]}>🔒 Yêu Cầu Đăng Nhập</Text>
            <Text style={[styles.actionGateSubtitle, { color: colors.primaryTintTextStrong }, { color: colors.primaryTintTextStrong }]}>
              {pendingAction.title || 'Vui lòng đăng nhập để tiếp tục thực hiện hành động này.'}
            </Text>
          </View>
        )}

        {/* Tiêu đề & Logo */}
        <View style={styles.header}>
          <Text style={styles.appIcon}>🍲</Text>
          <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Cẩm Nang Nấu Ăn
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Đăng nhập để lưu công thức yêu thích và vào bếp cùng trợ lý thông minh!
          </Text>
        </View>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerTint }, { backgroundColor: colors.dangerTint }]}>
            <Text style={[styles.errorBoxText, { color: colors.dangerText }, { color: colors.dangerText }]}>{errorMessage}</Text>
          </View>
        )}

        {/* Form Đăng nhập */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>
              Email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB',
                      color: isDarkMode ? '#FFFFFF' : '#111827',
                      borderColor: errors.email ? '#EF4444' : isDarkMode ? '#333' : '#E5E7EB',
                    },
                  ]}
                  placeholder="vidu@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.passwordRow}>
              <Text style={[styles.label, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>
                Mật khẩu
              </Text>
              <Pressable
                onPress={() => router.push('/(auth)/forgot-password')}
                hitSlop={8}
                accessibilityLabel="Quên mật khẩu">
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </Pressable>
            </View>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB',
                      color: isDarkMode ? '#FFFFFF' : '#111827',
                      borderColor: errors.password ? '#EF4444' : isDarkMode ? '#333' : '#E5E7EB',
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>

          <Button
            title="Đăng Nhập"
            onPress={handleSubmit(onSubmit)}
            loading={authLoading}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        {/* Chỗ cho đăng nhập mạng xã hội (Phiên bản sau) */}
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: isDarkMode ? '#2D2D2D' : '#E5E7EB' }]} />
          <Text style={[styles.dividerText, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }]}>
            HOẶC
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: isDarkMode ? '#2D2D2D' : '#E5E7EB' }]} />
        </View>

        <View style={styles.socialButtons}>
          <Button
            title="Đăng nhập bằng Google (Sắp ra mắt)"
            onPress={() => Alert.alert('Thông báo', 'Tính năng đăng nhập Google đang được hoàn thiện.')}
            variant="secondary"
            disabled
            style={styles.socialBtn}
          />
          <Button
            title="Đăng nhập bằng Apple (Sắp ra mắt)"
            onPress={() => Alert.alert('Thông báo', 'Tính năng đăng nhập Apple đang được hoàn thiện.')}
            variant="secondary"
            disabled
            style={styles.socialBtn}
          />
        </View>

        {/* Chuyển sang đăng ký & Chế độ khách */}
        <View style={styles.footer}>
          <View style={styles.registerRow}>
            <Text style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
              Chưa có tài khoản?{' '}
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              hitSlop={8}
              accessibilityLabel="Đăng ký tài khoản mới">
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleContinueAsGuest}
            style={styles.guestButton}
            accessibilityLabel="Tiếp tục duyệt với vai trò khách">
            <Text style={styles.guestButtonText}>Duyệt ứng dụng với vai trò Khách →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  actionGateBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  actionGateTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionGateSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  appIcon: {
    fontSize: 54,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 300,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorBoxText: {
    fontSize: 13,
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  socialButtons: {
    gap: 10,
  },
  socialBtn: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
    gap: 16,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerLink: {
    color: '#F97316',
    fontWeight: '700',
    fontSize: 14,
  },
  guestButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  guestButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

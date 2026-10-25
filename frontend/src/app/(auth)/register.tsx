import React, { useState } from 'react';
import {
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
import { registerThunk } from '@/features/auth/slice';
import { clearPendingAction } from '@/store/uiSlice';
import { registerSchema, RegisterFormData } from '@/features/auth/schemas';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/lib/theme';

export default function RegisterScreen() {
  // Inset thật của thiết bị: tránh nội dung bị notch / Dynamic Island / thanh điều hướng che
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // Màu nhấn theo dark mode (lib/theme.ts)
  const colors = useThemeColors();
  const pendingAction = useAppSelector((state) => state.ui.pendingAction);
  const authLoading = useAppSelector((state) => state.auth.isLoading);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    try {
      await dispatch(
        registerThunk({
          name: data.name,
          email: data.email,
          password: data.password,
        })
      ).unwrap();

      // Sau khi đăng ký thành công, chuyển sang màn hình Onboarding thiết lập sở thích & dị ứng
      if (pendingAction) {
        dispatch(clearPendingAction());
      }
      router.replace('/onboarding' as any);
    } catch (err: any) {
      setErrorMessage(typeof err === 'string' ? err : 'Đăng ký không thành công');
    }
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
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled">
        {/* Nút quay lại */}
        <Pressable
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Quay lại">
          <Text style={[styles.backText, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
            ← Quay lại
          </Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Tạo Tài Khoản Mới
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Gia nhập cộng đồng nấu ăn, lưu giữ món ngon và khám phá công thức mỗi ngày!
          </Text>
        </View>

        {errorMessage && (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerTint }, { backgroundColor: colors.dangerTint }]}>
            <Text style={[styles.errorBoxText, { color: colors.dangerText }, { color: colors.dangerText }]}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.form}>
          {/* Họ và tên */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>
              Họ và tên
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB',
                      color: isDarkMode ? '#FFFFFF' : '#111827',
                      borderColor: errors.name ? '#EF4444' : isDarkMode ? '#333' : '#E5E7EB',
                    },
                  ]}
                  placeholder="Ví dụ: Hoàng Minh"
                  placeholderTextColor="#9CA3AF"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </View>

          {/* Email */}
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

          {/* Mật khẩu */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>
              Mật khẩu
            </Text>
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
                  placeholder="Ít nhất 6 ký tự"
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

          {/* Nhập lại mật khẩu */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>
              Xác nhận mật khẩu
            </Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB',
                      color: isDarkMode ? '#FFFFFF' : '#111827',
                      borderColor: errors.confirmPassword ? '#EF4444' : isDarkMode ? '#333' : '#E5E7EB',
                    },
                  ]}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
            )}
          </View>

          <Button
            title="Đăng Ký Tài Khoản"
            onPress={handleSubmit(onSubmit)}
            loading={authLoading}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>
            Đã có tài khoản?{' '}
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            hitSlop={8}
            accessibilityLabel="Đăng nhập">
            <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
    paddingTop: 36,
    paddingBottom: 40,
  },
  backBtn: {
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: 12,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  loginLink: {
    color: '#F97316',
    fontWeight: '700',
    fontSize: 14,
  },
});

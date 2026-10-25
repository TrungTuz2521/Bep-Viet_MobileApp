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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppSelector } from '@/store';
import { useChangePasswordMutation } from '@/store/apiSlice';
import {Button} from '@/components/ui/Button';
import { useThemeColors } from '@/lib/theme';

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu cũ'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải từ 6 ký tự trở lên'),
    confirmPassword: z.string().min(6, 'Vui lòng nhập lại mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // Màu nhấn theo dark mode (lib/theme.ts)
  const colors = useThemeColors();

  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setErrorMessage(null);
    try {
      await changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      }).unwrap();

      Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
      reset();
      router.back();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? '#121212' : '#F9FAFB' },
      ]}
      edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Quay lại">
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDarkMode ? '#FFFFFF' : '#111827'}
            />
          </Pressable>
          <Text style={[styles.topTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Đổi Mật Khẩu
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Text style={[styles.guideText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Để bảo vệ an toàn cho tài khoản của bạn, vui lòng nhập mật khẩu hiện tại trước khi tạo mật khẩu mới.
          </Text>

          {errorMessage && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerTint }, { backgroundColor: colors.dangerTint }]}>
              <Text style={[styles.errorBoxText, { color: colors.dangerText }, { color: colors.dangerText }]}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.formCard}>
            {/* Mật khẩu cũ */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>
                Mật khẩu hiện tại *
              </Text>
              <Controller
                control={control}
                name="oldPassword"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                        color: isDarkMode ? '#FFFFFF' : '#111827',
                        borderColor: errors.oldPassword ? '#EF4444' : isDarkMode ? '#333' : '#E5E7EB',
                      },
                    ]}
                    placeholder="Nhập mật khẩu cũ"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.oldPassword && (
                <Text style={styles.errorText}>{errors.oldPassword.message}</Text>
              )}
            </View>

            {/* Mật khẩu mới */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>
                Mật khẩu mới (tối thiểu 6 ký tự) *
              </Text>
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                        color: isDarkMode ? '#FFFFFF' : '#111827',
                        borderColor: errors.newPassword ? '#EF4444' : isDarkMode ? '#333' : '#E5E7EB',
                      },
                    ]}
                    placeholder="Nhập mật khẩu mới"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword.message}</Text>
              )}
            </View>

            {/* Xác nhận mật khẩu mới */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>
                Xác nhận lại mật khẩu mới *
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                        color: isDarkMode ? '#FFFFFF' : '#111827',
                        borderColor: errors.confirmPassword ? '#EF4444' : isDarkMode ? '#333' : '#E5E7EB',
                      },
                    ]}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              )}
            </View>

            <Button
              title="Cập Nhật Mật Khẩu"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              variant="primary"
              size="lg"
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  guideText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
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
  formCard: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
});

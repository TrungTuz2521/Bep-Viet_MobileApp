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
import { useAppSelector } from '@/store';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/features/auth/schemas';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordScreen() {
  // Inset thật của thiết bị: tránh nội dung bị notch / Dynamic Island / thanh điều hướng che
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    // Giả lập gọi API gửi email khôi phục
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
    }, 800);
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
        <Pressable
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Quay lại">
          <Text style={[styles.backText, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
            ← Quay lại đăng nhập
          </Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Quên Mật Khẩu?
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Nhập địa chỉ email đăng ký để nhận hướng dẫn khôi phục mật khẩu.
          </Text>
        </View>

        {isSent ? (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={[styles.successTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
              Đã Gửi Hướng Dẫn
            </Text>
            <Text style={[styles.successText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              Chúng tôi đã gửi email chứa đường link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư đến (và thư rác).
            </Text>
            <Button
              title="Quay lại Đăng nhập"
              onPress={() => router.push('/(auth)/login')}
              variant="primary"
              style={{ marginTop: 24 }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>
                Email của bạn
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

            <Button
              title="Gửi Yêu Cầu"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              variant="primary"
              size="lg"
              style={{ marginTop: 8 }}
            />
          </View>
        )}
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
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 28,
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

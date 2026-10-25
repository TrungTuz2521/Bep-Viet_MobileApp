import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutThunk } from '@/features/auth/slice';
import { useDeleteAccountMutation } from '@/store/apiSlice';
import {Button} from '@/components/ui/Button';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import { APP_CONFIG } from '@/lib/constants';
import { useThemeColors } from '@/lib/theme';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // Màu nhấn theo dark mode (lib/theme.ts)
  const colors = useThemeColors();

  const [password, setPassword] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();

  const handleInitialSubmit = () => {
    if (!password || password.trim().length === 0) {
      setErrorMessage('Vui lòng nhập mật khẩu để xác thực danh tính.');
      return;
    }
    setErrorMessage(null);
    // Bước 2: Mở hộp thoại xác nhận cuối cùng
    setConfirmModalVisible(true);
  };

  const handleFinalConfirm = async () => {
    setConfirmModalVisible(false);
    try {
      await deleteAccount({ password }).unwrap();
      Alert.alert(
        'Đã gửi yêu cầu xóa tài khoản',
        `Tài khoản của bạn đã được vô hiệu hóa. Dữ liệu sẽ được giữ lại trong ${APP_CONFIG.RETENTION_DAYS} ngày trước khi bị xóa vĩnh viễn.`
      );
      await dispatch(logoutThunk());
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Mật khẩu không chính xác hoặc yêu cầu thất bại.');
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
        behavior="padding"
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
            Xóa Tài Khoản
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Cảnh báo màu đỏ nổi bật */}
          <View style={[styles.warningBox, { backgroundColor: colors.dangerTint, borderColor: colors.dangerTintBorder }, { backgroundColor: colors.dangerTint, borderColor: colors.dangerTintBorder }]}>
            <Ionicons name="warning" size={28} color={colors.dangerAccent} />
            <Text style={[styles.warningTitle, { color: colors.dangerText }, { color: colors.dangerText }]}>Hành Động Quan Trọng</Text>
            <Text style={[styles.warningDesc, { color: colors.dangerTextStrong }, { color: colors.dangerTextStrong }]}>
              Khi bạn yêu cầu xóa tài khoản:
              {'\n'}• Toàn bộ công thức riêng, danh sách đã lưu và sở thích ẩm thực sẽ bị gỡ bỏ.
              {'\n'}• Hệ thống sẽ lưu trữ dữ liệu an toàn trong vòng {APP_CONFIG.RETENTION_DAYS} ngày. Trong thời gian này, bạn có thể đăng nhập lại để hủy yêu cầu xóa.
              {'\n'}• Sau {APP_CONFIG.RETENTION_DAYS} ngày, toàn bộ dữ liệu sẽ bị xóa vĩnh viễn.
            </Text>
          </View>

          {errorMessage && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerTint }, { backgroundColor: colors.dangerTint }]}>
              <Text style={[styles.errorBoxText, { color: colors.dangerText }, { color: colors.dangerText }]}>{errorMessage}</Text>
            </View>
          )}

          {/* Bước 1: Nhập mật khẩu */}
          <View style={styles.stepBox}>
            <Text style={[styles.stepLabel, { color: isDarkMode ? '#E5E7EB' : '#374151' }]}>
              Bước 1: Xác thực mật khẩu tài khoản
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                  color: isDarkMode ? '#FFFFFF' : '#111827',
                  borderColor: isDarkMode ? '#333' : '#E5E7EB',
                },
              ]}
              placeholder="Nhập mật khẩu hiện tại"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Button
              title="Tiếp Tục Xóa Tài Khoản"
              onPress={handleInitialSubmit}
              loading={isLoading}
              variant="danger"
              size="lg"
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>

        {/* Bước 2: Hộp thoại xác nhận cuối cùng */}
        <ConfirmDialog
          visible={confirmModalVisible}
          title="Xác Nhận Xóa Vĩnh Viễn"
          message={`Bạn có chắc chắn muốn xóa tài khoản này? Bạn có ${APP_CONFIG.RETENTION_DAYS} ngày để đổi ý trước khi dữ liệu bị xóa vĩnh viễn khỏi máy chủ.`}
          confirmText="Tôi Chắc Chắn, Hãy Xóa"
          cancelText="Hủy bỏ & Giữ lại"
          isDestructive={true}
          onConfirm={handleFinalConfirm}
          onCancel={() => setConfirmModalVisible(false)}
        />
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
    gap: 16,
  },
  warningBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  warningDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
  },
  errorBoxText: {
    fontSize: 13,
    fontWeight: '500',
  },
  stepBox: {
    marginTop: 8,
    gap: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
});

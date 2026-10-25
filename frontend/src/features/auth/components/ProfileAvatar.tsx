import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '@/components/ui/AppText';
import { useToast } from '@/components/ui/Toast';
import { useAppDispatch } from '@/store';
import { useUploadAvatarMutation } from '@/store/apiSlice';
import { secureStorage } from '@/lib/storage';
import { useThemeColors } from '@/lib/theme';
import { setUser } from '../slice';
import type { User } from '@/types/api';

const SIZE = 72;

/** Chữ cái đầu của tên gọi (từ cuối trong tên tiếng Việt): "Nguyễn Văn An" → "A" */
const initialOf = (name?: string | null) => {
  const last = String(name || '').trim().split(/\s+/).pop() || '?';
  return last.charAt(0).toLocaleUpperCase('vi');
};

/**
 * Ảnh đại diện ở trang Cá nhân. Chạm để chọn ảnh (cắt vuông) → tải lên server ngay.
 * Chưa có ảnh → vòng tròn màu cam với chữ cái đầu của tên.
 */
export function ProfileAvatar({ user }: { user: User }) {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [uploadAvatar, { isLoading }] = useUploadAvatarMutation();
  const [preview, setPreview] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const handlePick = async () => {
    if (isLoading) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      const asset = result.canceled ? null : result.assets?.[0];
      if (!asset?.base64) return;

      setPreview(asset.uri);
      const res = await uploadAvatar({ base64: asset.base64, mime_type: asset.mimeType || 'image/jpeg' }).unwrap();
      if (res.data) {
        dispatch(setUser(res.data));
        // Lưu lại để lần mở app sau hiện ngay ảnh mới (trước khi xác thực phiên xong)
        await secureStorage.setUser(res.data);
      }
      showToast({ type: 'success', message: 'Đã cập nhật ảnh đại diện' });
    } catch (err: any) {
      Alert.alert('Không đổi được ảnh', err?.data?.message || 'Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
      setPreview(null);
    }
  };

  const imageUri = preview || (user.avatar_url && user.avatar_url !== failedUrl ? user.avatar_url : null);

  return (
    <Pressable
      onPress={handlePick}
      accessibilityRole="button"
      accessibilityLabel="Đổi ảnh đại diện"
      accessibilityHint="Chọn ảnh từ thư viện ảnh của máy"
      hitSlop={6}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      <View style={[styles.circle, { backgroundColor: colors.primaryTint, borderColor: colors.primaryTintBorder }]}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={150}
            onError={() => setFailedUrl(user.avatar_url ?? null)}
          />
        ) : (
          <Text style={[styles.initial, { color: colors.primaryText }]}>{initialOf(user.name)}</Text>
        )}
        {isLoading && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}
      </View>
      {/* Nút máy ảnh nhỏ ở góc: báo hiệu ảnh có thể chạm để đổi */}
      <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
        <Ionicons name="camera" size={13} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
  },
  pressed: {
    opacity: 0.85,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileAvatar;

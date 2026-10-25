import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useAppSelector } from '@/store';
import { shadow } from '@/lib/shadows';

export interface BottomSheetProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  title,
  onClose,
  children,
}) => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragHandle} />
          {title && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                {title}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityLabel="Đóng bảng">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.content}>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '80%',
    ...shadow(8),
  },
  dragHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  content: {
    marginTop: 8,
  },
});

export default BottomSheet;

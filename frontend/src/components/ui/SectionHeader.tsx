import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useAppSelector } from '@/store';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
}) => {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {actionText && onActionPress && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionText}
          hitSlop={8}
          onPress={onActionPress}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
          <Text style={styles.actionText}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 18,
    paddingHorizontal: 4,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  actionButton: {
    minHeight: 44, // Touch target
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});

export default SectionHeader;

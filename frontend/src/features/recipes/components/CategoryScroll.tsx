import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/store';
import { MOCK_THEMES, ThemeCategory } from '@/lib/mockData';
import { shadow } from '@/lib/shadows';

export const CategoryScroll: React.FC = () => {
  const router = useRouter();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  const handleSelectCategory = (cat: ThemeCategory) => {
    // Điều hướng sang màn tìm kiếm với danh mục tương ứng
    router.push({
      pathname: '/(tabs)/search',
      params: { category: cat.name },
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_THEMES}
        keyExtractor={(item) => `theme-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chủ đề ${item.name}`}
            onPress={() => handleSelectCategory(item)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                borderColor: isDarkMode ? '#2D2D2D' : '#F3F4F6',
              },
              pressed && styles.pressed,
            ]}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text
              numberOfLines={1}
              style={[styles.name, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
              {item.name}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.desc, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              {item.description}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  list: {
    paddingRight: 16,
  },
  card: {
    width: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    ...shadow(1),
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    fontSize: 32,
    marginBottom: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  desc: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default CategoryScroll;

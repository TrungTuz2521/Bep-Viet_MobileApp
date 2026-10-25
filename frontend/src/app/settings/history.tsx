import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';
import { RecipeTextCard } from '@/components/ui/RecipeTextCard';
import {EmptyState} from '@/components/ui/EmptyState';
import { MOCK_RECIPES } from '@/lib/mockData';
import { shadow } from '@/lib/shadows';

export default function HistoryScreen() {
  const router = useSafeRouter(); // chặn bấm liên tiếp mở trùng trang
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  const [activeTab, setActiveTab] = useState<'viewed' | 'cooked'>('viewed');

  // Mẫu dữ liệu lịch sử hoạt động
  const viewedRecipes = [MOCK_RECIPES[0], MOCK_RECIPES[1], MOCK_RECIPES[2]];
  const cookedRecipes = [MOCK_RECIPES[0]];

  const currentList = activeTab === 'viewed' ? viewedRecipes : cookedRecipes;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? '#121212' : '#F9FAFB' },
      ]}
      edges={['top']}>
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
          Lịch Sử Hoạt Động
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.container}>
        {/* Segmented Control */}
        <View
          style={[
            styles.segmentContainer,
            { backgroundColor: isDarkMode ? '#27272A' : '#E5E7EB' },
          ]}>
          <Pressable
            onPress={() => setActiveTab('viewed')}
            style={[
              styles.segmentTab,
              activeTab === 'viewed' && [
                styles.segmentTabActive,
                { backgroundColor: isDarkMode ? '#18181B' : '#FFFFFF' },
              ],
            ]}>
            <Text
              style={[
                styles.segmentText,
                activeTab === 'viewed' && styles.segmentTextActive,
                { color: activeTab === 'viewed' ? '#EA580C' : isDarkMode ? '#A1A1AA' : '#6B7280' },
              ]}>
              👀 Món Đã Xem ({viewedRecipes.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('cooked')}
            style={[
              styles.segmentTab,
              activeTab === 'cooked' && [
                styles.segmentTabActive,
                { backgroundColor: isDarkMode ? '#18181B' : '#FFFFFF' },
              ],
            ]}>
            <Text
              style={[
                styles.segmentText,
                activeTab === 'cooked' && styles.segmentTextActive,
                { color: activeTab === 'cooked' ? '#EA580C' : isDarkMode ? '#A1A1AA' : '#6B7280' },
              ]}>
              🍳 Món Đã Nấu ({cookedRecipes.length})
            </Text>
          </Pressable>
        </View>

        {currentList.length > 0 ? (
          <FlatList
            data={currentList}
            keyExtractor={(item) => `hist-${item.id}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <RecipeTextCard
                recipe={item}
                onPress={() => router.push(`/recipe/${item.id}` as any)}
              />
            )}
          />
        ) : (
          <EmptyState
            icon="📖"
            title="Chưa có lịch sử"
            description="Bạn chưa xem hoặc nấu món nào gần đây."
            actionTitle="Khám phá ngay"
            onActionPress={() => router.push('/(tabs)')}
          />
        )}
      </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentTabActive: {
    ...shadow(1),
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 32,
  },
});

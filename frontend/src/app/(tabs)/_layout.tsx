import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';

// Chiều cao vùng icon + nhãn (không tính safe area)
const TAB_CONTENT_HEIGHT = 46;
const TAB_PADDING_TOP = 8;

export default function TabsLayout() {
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // Lấy inset thật của thiết bị (home indicator iOS, gesture bar / 3 nút Android edge-to-edge)
  const insets = useSafeAreaInsets();
  const tabPaddingBottom = insets.bottom > 0 ? insets.bottom : 10;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Tab đang ẩn tạm dừng vẽ lại (vd khi lưu món ở trang chi tiết) → chuyển màn mượt hơn
        freezeOnBlur: true,
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: isDarkMode ? '#71717A' : '#A1A1AA',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#18181B' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#27272A' : '#F4F4F5',
          height: TAB_PADDING_TOP + TAB_CONTENT_HEIGHT + tabPaddingBottom,
          paddingBottom: tabPaddingBottom,
          paddingTop: TAB_PADDING_TOP,
        },
        // Nhãn tab dùng AppText → giới hạn phóng to chữ 120% như toàn app (vùng nhãn có chiều cao cố định)
        tabBarLabel: ({ color, children, position }) => (
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              { color },
              position === 'beside-icon' && styles.tabLabelBeside,
            ]}>
            {children}
          </Text>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'restaurant' : 'restaurant-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Tìm kiếm',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Thư viện',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Tablet / màn ngang: nhãn nằm cạnh icon
  tabLabelBeside: {
    marginStart: 8,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store';
import {
  useChatAssistantMutation,
  useGetSavedRecipesQuery,
  useSaveRecipeMutation,
  useUnsaveRecipeMutation,
} from '@/store/apiSlice';
import { RecipeTextCard } from '@/components/ui/RecipeTextCard';
import useRequireAuth from '@/hooks/useRequireAuth';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { Recipe } from '@/types/api';
import { brand, useThemeColors } from '@/lib/theme';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  recipes?: Recipe[];
  timestamp: string;
  /** Tin nhắn lỗi / lời chào cục bộ — không gửi lên server làm lịch sử */
  localOnly?: boolean;
}

// Số tin nhắn gần nhất gửi kèm để trợ lý hiểu ngữ cảnh hội thoại
const HISTORY_LIMIT = 10;

const QUICK_SUGGESTIONS = [
  '🍗 Có thịt gà, nấu nhanh dưới 30 phút',
  '🍽️ Tối nay mình nên ăn gì?',
  '💪 Món nhiều đạm dưới 500 kcal',
  '🔁 Không có nước mắm thì thay bằng gì?',
  '🥗 Món chay thanh đạm, dễ làm',
];

const RECIPE_SUGGESTIONS = [
  'Nấu cho 2 người cần bao nhiêu?',
  'Có thể thay nguyên liệu nào?',
  'Món này bao nhiêu calo?',
  'Các bước chính là gì?',
];

// Gửi kèm các thẻ món đã hiển thị trong câu trả lời trước (tên, thời gian, calo) để trợ lý trả lời đúng
// câu hỏi nối tiếp như "món nào nhanh nhất trong số đó?" mà không phải tìm lại từ đầu
const withShownRecipes = (m: ChatMessage): string => {
  if (m.sender !== 'bot' || !m.recipes?.length) return m.text;
  const list = m.recipes
    .map((r) => {
      const minutes = (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0);
      return `${r.name} (${minutes ? `${minutes} phút` : '? phút'}${r.calories ? `, ${r.calories} kcal` : ''})`;
    })
    .join('; ');
  return `${m.text}\n[Các món đã hiển thị: ${list}]`;
};

const nowLabel = () =>new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function AssistantScreen() {
  const router = useSafeRouter(); // chặn bấm liên tiếp mở trùng trang
  // Ngữ cảnh món khi mở từ trang chi tiết / chế độ nấu ("Hỏi AI về món này")
  const params = useLocalSearchParams<{ recipeId?: string; recipeName?: string; step?: string }>();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);
  // Màu nhấn theo dark mode (lib/theme.ts)
  const colors = useThemeColors();
  // Ô nhập không bị home indicator che; khi bàn phím mở thì bỏ khoảng này đi
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardVisible();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { requireAuth } = useRequireAuth();

  const [recipeContext, setRecipeContext] = useState<{ id: string; name: string; step?: number } | null>(() =>
    params.recipeId
      ? {
          id: String(params.recipeId),
          name: String(params.recipeName || 'món này'),
          step: params.step ? parseInt(String(params.step), 10) || undefined : undefined,
        }
      : null
  );

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'greeting',
      sender: 'bot',
      localOnly: true,
      text: params.recipeId
        ? `Mình sẵn sàng giải đáp về "${params.recipeName || 'món này'}" 👨‍🍳\nBạn có thể hỏi định lượng cho số người khác, cách thay nguyên liệu, dinh dưỡng hoặc chi tiết từng bước.`
        : 'Xin chào! Mình là Trợ Lý Ẩm Thực AI 🤖.\nBạn có thể nhờ mình tìm món theo nguyên liệu, hỏi cách thay nguyên liệu, dinh dưỡng, hoặc "tối nay ăn gì?" — mình nhớ cả các câu hỏi trước nên cứ hỏi tiếp tự nhiên nhé!',
      timestamp: nowLabel(),
    },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>(params.recipeId ? RECIPE_SUGGESTIONS : QUICK_SUGGESTIONS);
  // 'ai' = Gemini đang hoạt động, 'basic' = chế độ cơ bản (chưa có API key / AI lỗi)
  const [assistantMode, setAssistantMode] = useState<'ai' | 'basic' | null>(null);

  const [chatAssistant, { isLoading }] = useChatAssistantMutation();
  const { data: savedData } = useGetSavedRecipesQuery(undefined, { skip: !isAuthenticated });
  const [saveRecipe] = useSaveRecipeMutation();
  const [unsaveRecipe] = useUnsaveRecipeMutation();

  const savedRecipeIds = React.useMemo(() => {
    const list = savedData?.data || [];
    return new Set(list.map((item) => String(item.recipe_id || item.recipe?.id)));
  }, [savedData]);

  const flatListRef = useRef<FlatList>(null);
  // Bộ đếm id tin nhắn (ổn định, không phụ thuộc thời gian)
  const messageSeq = useRef(0);
  const nextId = (prefix: string) => `${prefix}-${++messageSeq.current}`;

  const scrollToEnd = (delay: number) =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), delay);

  // Bàn phím mở → danh sách co lại; kéo xuống tin nhắn mới nhất để không bị khuất
  useEffect(() => {
    if (!isKeyboardVisible) return;
    const timer = scrollToEnd(80);
    return () => clearTimeout(timer);
  }, [isKeyboardVisible]);

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || isLoading) return;

    setInputQuery('');

    const userMsg: ChatMessage = { id: nextId('user'), sender: 'user', text: q, timestamp: nowLabel() };
    // Lịch sử gửi lên server: bỏ lời chào / tin lỗi cục bộ, giữ tối đa HISTORY_LIMIT tin gần nhất
    const history = [...messages, userMsg]
      .filter((m) => !m.localOnly)
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.sender === 'user' ? ('user' as const) : ('assistant' as const), text: withShownRecipes(m) }));

    setMessages((prev) => [...prev, userMsg]);
    scrollToEnd(100);

    try {
      const response = await chatAssistant({
        messages: history,
        ...(recipeContext ? { recipe_id: recipeContext.id, step: recipeContext.step } : {}),
      }).unwrap();
      const botMsg: ChatMessage = {
        id: nextId('bot'),
        sender: 'bot',
        text: response.message || 'Dưới đây là một số công thức gợi ý cho bạn:',
        recipes: response.data || [],
        timestamp: nowLabel(),
      };

      setMessages((prev) => [...prev, botMsg]);
      if (response.suggestions?.length) setSuggestions(response.suggestions);
      if (response.mode) setAssistantMode(response.mode);
      scrollToEnd(200);
    } catch (err: any) {
      // 429 = hỏi quá nhanh (giới hạn lượt) → hiện đúng thông báo của server
      const serverMessage = err?.status === 429 ? err?.data?.message : null;
      const errorMsg: ChatMessage = {
        id: nextId('bot'),
        sender: 'bot',
        localOnly: true,
        text: serverMessage || 'Rất tiếc, mình đang gặp chút trục trặc khi kết nối với hệ thống. Bạn thử lại câu hỏi khác xem sao nhé!',
        timestamp: nowLabel(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      scrollToEnd(200);
    }
  };

  // Bỏ ngữ cảnh món → quay về hỏi đáp chung
  const handleClearRecipeContext = () => {
    setRecipeContext(null);
    setSuggestions(QUICK_SUGGESTIONS);
  };

  const handleBookmarkToggle = (recipe: Recipe) => {
    requireAuth(async () => {
      const isSaved = savedRecipeIds.has(String(recipe.id));
      try {
        if (isSaved) {
          await unsaveRecipe(recipe.id).unwrap();
        } else {
          await saveRecipe(recipe.id).unwrap();
        }
      } catch (e) {
        console.warn('Lỗi lưu công thức từ chatbot:', e);
      }
    }, '/assistant');
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
        {!isUser && (
          <View style={[styles.botAvatar, { backgroundColor: colors.primaryTintStrong }, { backgroundColor: colors.primaryTintStrong }]}>
            <Text style={styles.botAvatarText}>🤖</Text>
          </View>
        )}

        <View style={[styles.bubbleWrapper, isUser && styles.bubbleWrapperUser]}>
          <View
            style={[
              styles.bubble,
              isUser
                ? styles.userBubble
                : [styles.botBubble, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }],
            ]}>
            <Text
              selectable
              style={[
                styles.messageText,
                isUser ? styles.userText : { color: isDarkMode ? '#F9FAFB' : '#1F2937' },
              ]}>
              {item.text}
            </Text>

            <Text
              style={[
                styles.timestamp,
                isUser ? styles.userTimestamp : styles.botTimestamp,
              ]}>
              {item.timestamp}
            </Text>
          </View>

          {/* Danh sách các công thức món ăn AI gợi ý (Không hiển thị ảnh) */}
          {item.recipes && item.recipes.length > 0 && (
            <View style={styles.recipeListContainer}>
              <Text
                style={[
                  styles.recipeListHeading,
                  { color: isDarkMode ? '#D1D5DB' : '#4B5563' },
                ]}>
                ✨ {item.recipes.length} món gợi ý — chạm để xem chi tiết:
              </Text>
              {item.recipes.map((r) => (
                <RecipeTextCard
                  key={`chatbot-recipe-${r.id}`}
                  recipe={r}
                  isSaved={savedRecipeIds.has(String(r.id))}
                  onPress={() => router.push(`/recipe/${r.id}` as any)}
                  onBookmarkPress={() => handleBookmarkToggle(r)}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? '#121212' : '#F9FAFB' },
      ]}
      edges={['top']}>
      {/* 1. Header trên cùng */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
            borderBottomColor: isDarkMode ? '#27272A' : '#E5E7EB',
          },
        ]}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerIcon}>🤖</Text>
          <View>
            <Text style={[styles.headerTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
              Trợ Lý Ẩm Thực AI
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              {assistantMode === 'basic'
                ? 'Chế độ cơ bản (chưa bật AI)'
                : 'Hỏi đáp món ăn, dinh dưỡng, nguyên liệu'}
            </Text>
          </View>
        </View>

        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeBtn,
            { backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' },
            pressed && { opacity: 0.7 },
          ]}
          accessibilityLabel="Đóng trợ lý">
          <Ionicons name="close" size={20} color={isDarkMode ? '#F9FAFB' : '#111827'} />
        </Pressable>
      </View>

      {recipeContext && (
        <View
          style={[
            styles.contextBanner,
            {
              backgroundColor: isDarkMode ? 'rgba(249, 115, 22, 0.12)' : '#FFF7ED',
              borderBottomColor: isDarkMode ? 'rgba(249, 115, 22, 0.25)' : '#FED7AA',
            },
          ]}>
          <Ionicons name="restaurant-outline" size={16} color="#EA580C" />
          <Text numberOfLines={1} style={[styles.contextText, { color: isDarkMode ? '#FDBA74' : '#9A3412' }]}>
            Đang hỏi về: {recipeContext.name}
            {recipeContext.step ? ` · Bước ${recipeContext.step}` : ''}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={handleClearRecipeContext}
            style={({ pressed }) => [styles.contextClose, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Bỏ ngữ cảnh món, hỏi đáp chung">
            <Ionicons name="close-circle" size={20} color={isDarkMode ? '#FDBA74' : '#C2410C'} />
          </Pressable>
        </View>
      )}

      {/* padding cho cả Android: app chạy edge-to-edge nên cửa sổ không tự co khi bàn phím mở
          → thiếu padding thì bàn phím che thanh nhập */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior="padding">
        {/* 2. Danh sách tin nhắn */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loadingRow}>
                <View style={[styles.botAvatar, { backgroundColor: colors.primaryTintStrong }, { backgroundColor: colors.primaryTintStrong }]}>
                  <Text style={styles.botAvatarText}>🤖</Text>
                </View>
                <View
                  style={[
                    styles.loadingBubble,
                    { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' },
                  ]}>
                  <ActivityIndicator size="small" color="#F97316" />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                    ]}>
                    Trợ lý đang suy nghĩ...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* 3. Thanh gợi ý nhanh câu hỏi */}
        <View
          style={[
            styles.quickSuggestionsBar,
            {
              backgroundColor: isDarkMode ? '#18181B' : '#F3F4F6',
              borderTopColor: isDarkMode ? '#27272A' : '#E5E7EB',
            },
          ]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
            {suggestions.map((sug, idx) => (
              <Pressable
                key={`sug-${idx}-${sug}`}
                disabled={isLoading}
                onPress={() => handleSend(sug)}
                style={({ pressed }) => [
                  styles.suggestionChip,
                  { backgroundColor: isDarkMode ? '#27272A' : '#FFFFFF' },
                  pressed && { opacity: 0.7 },
                ]}>
                <Text
                  style={[
                    styles.suggestionText,
                    { color: isDarkMode ? '#E5E7EB' : '#374151' },
                  ]}>
                  {sug}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* 4. Khung nhập liệu dưới cùng */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
              borderTopColor: isDarkMode ? '#27272A' : '#E5E7EB',
              paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 10),
            },
          ]}>
          <TextInput
            value={inputQuery}
            onChangeText={setInputQuery}
            placeholder={
              recipeContext
                ? 'Hỏi về món này: định lượng, thay nguyên liệu...'
                : 'Tôi có gà, sả, muốn nấu dưới 30 phút...'
            }
            multiline
            maxLength={1000}
            blurOnSubmit
            placeholderTextColor={isDarkMode ? '#71717A' : '#9CA3AF'}
            style={[
              styles.textInput,
              {
                backgroundColor: isDarkMode ? '#27272A' : '#F9FAFB',
                color: isDarkMode ? '#F9FAFB' : '#111827',
                borderColor: isDarkMode ? '#3F3F46' : '#E5E7EB',
              },
            ]}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            editable={!isLoading}
          />

          <Pressable
            onPress={() => handleSend()}
            disabled={!inputQuery.trim() || isLoading}
            style={({ pressed }) => [
              styles.sendBtn,
              (!inputQuery.trim() || isLoading) && styles.sendBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
            accessibilityLabel="Gửi yêu cầu">
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 26,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  chatListContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  botAvatarText: {
    fontSize: 18,
  },
  bubbleWrapper: {
    maxWidth: '84%',
  },
  bubbleWrapperUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  userBubble: {
    backgroundColor: brand.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.15)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botTimestamp: {
    color: '#9CA3AF',
  },
  recipeListContainer: {
    marginTop: 10,
    width: '100%',
  },
  recipeListHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.15)',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickSuggestionsBar: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  quickScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: 1,
  },
  // Tự giãn theo nội dung (câu hỏi dài), tối đa ~4 dòng
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    borderWidth: 1,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#FDBA74',
    opacity: 0.6,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 44,
    borderBottomWidth: 1,
  },
  contextText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  contextClose: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

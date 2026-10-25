import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Controller, useFieldArray, useForm, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { useKeyboardAwareScroll } from '@/hooks/useKeyboardAwareScroll';
import { useThemeColors } from '@/lib/theme';
import { lineHeightFor } from '@/lib/typography';
import { useUploadRecipeImageMutation } from '@/store/apiSlice';
import {
  EMPTY_INGREDIENT,
  EMPTY_STEP,
  formDataToPayload,
  recipeFormSchema,
  type RecipeFormData,
} from '../schemas';
import { CategoryPicker } from './CategoryPicker';
import { FormInput } from './FormInput';
import { IngredientRow } from './IngredientRow';

export type RecipePayload = ReturnType<typeof formDataToPayload>;

interface RecipeFormProps {
  title: string;
  submitLabel: string;
  initialValues: RecipeFormData;
  submitting: boolean;
  onBack: () => void;
  onSubmit: (payload: RecipePayload) => Promise<void>;
  /** Có → tự lưu / khôi phục bản nháp (màn tạo mới) */
  draftKey?: string;
}

// Bản nháp hợp lệ với cấu trúc form hiện tại (bản nháp kiểu cũ bị bỏ qua)
const isDraftShape = (v: any): v is RecipeFormData =>
  v && typeof v.name === 'string' && typeof v.servings === 'string' && Array.isArray(v.ingredients) && Array.isArray(v.steps);

/** Lỗi cấp danh sách (vd "Cần ít nhất 1 nguyên liệu") nằm ở .message hoặc .root.message */
const listError = (e: any): string | undefined => e?.message || e?.root?.message;

/**
 * Tự lưu bản nháp 0,8s sau lần gõ cuối. Tách thành component con không vẽ gì:
 * chỉ component này render lại theo mỗi phím gõ, form chính thì không.
 */
function DraftAutosave({ control, draftKey }: { control: Control<RecipeFormData>; draftKey: string }) {
  const values = useWatch({ control });
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasContent = values.name || values.description || values.ingredients?.some((i) => i?.name);
      if (hasContent) AsyncStorage.setItem(draftKey, JSON.stringify(values)).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [values, draftKey]);
  return null;
}

export function RecipeForm({ title, submitLabel, initialValues, submitting, onBack, onSubmit, draftKey }: RecipeFormProps) {
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardVisible();
  const colors = useThemeColors();
  const { scrollRef, onScroll, onInputFocus } = useKeyboardAwareScroll();
  const [uploadImage, { isLoading: uploading }] = useUploadRecipeImageMutation();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  // Khoá đồng bộ: bấm "Lưu" 2-3 lần liên tiếp chỉ gửi 1 lần (tránh tạo trùng món / quay lại 2 trang)
  const submittingRef = useRef(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: initialValues,
  });

  const ingredients = useFieldArray({ control, name: 'ingredients' });
  const steps = useFieldArray({ control, name: 'steps' });

  // Chỉ theo dõi đúng trường cần cho giao diện → gõ chữ không render lại cả form
  const imageUrl = useWatch({ control, name: 'image_url' });

  // ── Bản nháp (chỉ màn tạo mới) ──
  useEffect(() => {
    if (!draftKey) return;
    AsyncStorage.getItem(draftKey)
      .then((saved) => {
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (!isDraftShape(parsed)) return;
        reset({ ...initialValues, ...parsed });
        setHasDraft(true);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  const handleClearDraft = async () => {
    if (draftKey) await AsyncStorage.removeItem(draftKey).catch(() => {});
    reset(initialValues);
    setLocalPreview(null);
    setHasDraft(false);
  };

  // ── Ảnh: chọn → tải lên server ngay → lưu URL công khai ──
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });
      const asset = result.canceled ? null : result.assets?.[0];
      if (!asset?.base64) return;

      setLocalPreview(asset.uri);
      const res = await uploadImage({ base64: asset.base64, mime_type: asset.mimeType || 'image/jpeg' }).unwrap();
      if (res.data?.url) setValue('image_url', res.data.url, { shouldDirty: true });
    } catch (err: any) {
      Alert.alert('Không tải được ảnh', err?.data?.message || 'Vui lòng kiểm tra kết nối mạng và thử lại.');
    } finally {
      setLocalPreview(null);
    }
  };

  const handleValid = async (data: RecipeFormData) => {
    try {
      await onSubmit(formDataToPayload(data));
      if (draftKey) await AsyncStorage.removeItem(draftKey).catch(() => {});
    } catch {
      // Lỗi đã được màn cha báo; mở khoá để người dùng thử lại
      submittingRef.current = false;
    }
  };

  const handleInvalid = (formErrors: FieldErrors<RecipeFormData>) => {
    submittingRef.current = false;
    // Ô lỗi đầu tiên được focus tự động; lỗi cấp danh sách không có ô → báo bằng hộp thoại
    const message = listError(formErrors.ingredients) || listError(formErrors.steps);
    if (message) Alert.alert('Chưa thể lưu', message);
  };

  const submit = () => {
    if (uploading) {
      Alert.alert('Đang tải ảnh', 'Vui lòng đợi ảnh tải lên xong rồi lưu lại.');
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    handleSubmit(handleValid, handleInvalid)();
  };

  const previewUri = localPreview || imageUrl || '';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* padding cả 2 nền tảng: Android edge-to-edge không tự co màn khi bàn phím mở */}
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        {draftKey ? <DraftAutosave control={control} draftKey={draftKey} /> : null}
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Quay lại">
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.topTitle, { color: colors.textPrimary }]}>{title}</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={32}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {hasDraft && (
            <View style={[styles.draftBanner, { backgroundColor: colors.warningTint, borderColor: colors.warningTintBorder }]}>
              <View style={styles.flex}>
                <Text style={[styles.draftTitle, { color: colors.warningTextStrong }]}>💾 Đã khôi phục bản nháp</Text>
                <Text style={[styles.draftSubtitle, { color: colors.warningText }]}>
                  Bạn đang tiếp tục nội dung đã lưu tự động trước đó.
                </Text>
              </View>
              <Pressable onPress={handleClearDraft} hitSlop={8} style={styles.draftClearBtn}>
                <Text style={[styles.draftClearText, { color: colors.dangerAccent }]}>Xóa nháp</Text>
              </Pressable>
            </View>
          )}

          {/* Ảnh món ăn */}
          {previewUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="cover" />
              {uploading ? (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.uploadText}>Đang tải ảnh lên...</Text>
                </View>
              ) : (
                <View style={styles.imageActions}>
                  <Pressable onPress={() => setValue('image_url', '')} style={styles.imageBtn} accessibilityLabel="Xóa ảnh món ăn">
                    <Text style={styles.imageBtnText}>Xóa ảnh</Text>
                  </Pressable>
                  <Pressable onPress={handlePickImage} style={styles.imageBtn} accessibilityLabel="Đổi ảnh món ăn">
                    <Text style={styles.imageBtnText}>Đổi ảnh khác</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <Pressable
              onPress={handlePickImage}
              style={[styles.imagePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Chọn ảnh minh họa món ăn">
              <Ionicons name="camera-outline" size={32} color={colors.primary} />
              <Text style={[styles.placeholderTitle, { color: colors.textPrimary }]}>Thêm ảnh món ăn hoàn thiện</Text>
              <Text style={[styles.placeholderSub, { color: colors.textSecondary }]}>Chạm để chọn từ thư viện ảnh</Text>
            </Pressable>
          )}

          {/* Chế độ hiển thị */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Ai được xem món này?</Text>
            <Controller
              control={control}
              name="visibility"
              render={({ field }) => (
                <>
                  <View style={[styles.segment, { backgroundColor: colors.surfaceMuted }]}>
                    {(['private', 'public'] as const).map((v) => {
                      const active = field.value === v;
                      return (
                        <Pressable
                          key={v}
                          onPress={() => field.onChange(v)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active }}
                          style={[styles.segmentItem, active && { backgroundColor: colors.surface }]}>
                          <Ionicons
                            name={v === 'private' ? 'lock-closed' : 'earth'}
                            size={15}
                            color={active ? colors.primaryText : colors.textSecondary}
                          />
                          <Text style={[styles.segmentText, { color: active ? colors.primaryText : colors.textSecondary }]}>
                            {v === 'private' ? 'Riêng tư' : 'Công khai'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                    {field.value === 'private'
                      ? 'Chỉ bạn thấy món này trong Thư viện.'
                      : 'Mọi người thấy món ở Khám phá, Tìm kiếm và Trợ lý AI.'}
                  </Text>
                </>
              )}
            />
          </View>

          {/* Thông tin cơ bản */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Thông tin món ăn</Text>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <FormInput
                  ref={field.ref}
                  label="Tên món ăn *"
                  placeholder="Ví dụ: Gà rang muối sả ớt"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  onFocus={onInputFocus}
                  error={errors.name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <FormInput
                  ref={field.ref}
                  label="Mô tả ngắn"
                  placeholder="Cảm hứng hoặc bí quyết của món ăn..."
                  multiline
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  onFocus={onInputFocus}
                />
              )}
            />
            <View style={styles.rowInputs}>
              {([
                ['prep_time_minutes', 'Chuẩn bị (phút)'],
                ['cook_time_minutes', 'Nấu (phút)'],
                ['servings', 'Khẩu phần'],
              ] as const).map(([name, label]) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <FormInput
                      ref={field.ref}
                      containerStyle={styles.flex}
                      label={label}
                      keyboardType="number-pad"
                      value={field.value}
                      onChangeText={(t) => field.onChange(t.replace(/[^0-9]/g, ''))}
                      onBlur={field.onBlur}
                      onFocus={onInputFocus}
                      error={errors[name]?.message}
                    />
                  )}
                />
              ))}
            </View>
          </View>

          {/* Danh mục */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Danh mục</Text>
            <Controller
              control={control}
              name="category_ids"
              render={({ field }) => <CategoryPicker value={field.value} onChange={field.onChange} />}
            />
          </View>

          {/* Nguyên liệu */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Nguyên liệu</Text>
            {listError(errors.ingredients) ? (
              <Text style={[styles.listError, { color: colors.dangerAccent }]}>{listError(errors.ingredients)}</Text>
            ) : null}
            {ingredients.fields.map((field, index) => (
              <IngredientRow
                key={field.id}
                index={index}
                control={control}
                setValue={setValue}
                errors={errors}
                onInputFocus={onInputFocus}
                onRemove={() =>
                  ingredients.fields.length > 1 ? ingredients.remove(index) : ingredients.update(0, { ...EMPTY_INGREDIENT })
                }
              />
            ))}
            <Pressable
              onPress={() => ingredients.append({ ...EMPTY_INGREDIENT })}
              style={[styles.addBtn, { borderColor: colors.primaryTintBorder }]}
              accessibilityRole="button">
              <Ionicons name="add-circle" size={18} color={colors.primaryText} />
              <Text style={[styles.addBtnText, { color: colors.primaryText }]}>Thêm nguyên liệu</Text>
            </Pressable>
          </View>

          {/* Các bước */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Các bước chế biến</Text>
            {listError(errors.steps) ? (
              <Text style={[styles.listError, { color: colors.dangerAccent }]}>{listError(errors.steps)}</Text>
            ) : null}
            {steps.fields.map((field, index) => (
              <View key={field.id} style={[styles.stepBox, { borderColor: colors.border }]}>
                <View style={styles.stepHeader}>
                  <Text style={[styles.stepBadge, { color: colors.primaryText }]}>Bước {index + 1}</Text>
                  <View style={styles.stepActions}>
                    {index > 0 && (
                      <Pressable onPress={() => steps.swap(index, index - 1)} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Chuyển bước lên trên">
                        <Ionicons name="arrow-up" size={18} color={colors.textSecondary} />
                      </Pressable>
                    )}
                    {index < steps.fields.length - 1 && (
                      <Pressable onPress={() => steps.swap(index, index + 1)} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Chuyển bước xuống dưới">
                        <Ionicons name="arrow-down" size={18} color={colors.textSecondary} />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => (steps.fields.length > 1 ? steps.remove(index) : steps.update(0, { ...EMPTY_STEP }))}
                      hitSlop={8}
                      style={styles.iconBtn}
                      accessibilityLabel="Xóa bước này">
                      <Ionicons name="trash-outline" size={18} color={colors.dangerAccent} />
                    </Pressable>
                  </View>
                </View>
                <Controller
                  control={control}
                  name={`steps.${index}.instruction`}
                  render={({ field: f }) => (
                    <FormInput
                      ref={f.ref}
                      placeholder="Mô tả cụ thể thao tác của bước này..."
                      multiline
                      value={f.value}
                      onChangeText={f.onChange}
                      onBlur={f.onBlur}
                      onFocus={onInputFocus}
                    />
                  )}
                />
                <View style={styles.timerRow}>
                  <Ionicons name="timer-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Hẹn giờ</Text>
                  <Controller
                    control={control}
                    name={`steps.${index}.timer_minutes`}
                    render={({ field: f }) => (
                      <FormInput
                        ref={f.ref}
                        containerStyle={styles.timerInput}
                        placeholder="—"
                        keyboardType="number-pad"
                        value={f.value}
                        onChangeText={(t) => f.onChange(t.replace(/[^0-9]/g, ''))}
                        onBlur={f.onBlur}
                        onFocus={onInputFocus}
                        accessibilityLabel={`Số phút hẹn giờ bước ${index + 1}`}
                      />
                    )}
                  />
                  <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>phút (bỏ trống nếu không cần)</Text>
                </View>
                {errors.steps?.[index]?.timer_minutes?.message ? (
                  <Text style={[styles.listError, { color: colors.dangerAccent }]}>
                    {errors.steps[index]?.timer_minutes?.message}
                  </Text>
                ) : null}
              </View>
            ))}
            <Pressable
              onPress={() => steps.append({ ...EMPTY_STEP })}
              style={[styles.addBtn, { borderColor: colors.primaryTintBorder }]}
              accessibilityRole="button">
              <Ionicons name="add-circle" size={18} color={colors.primaryText} />
              <Text style={[styles.addBtnText, { color: colors.primaryText }]}>Thêm bước mới</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footerBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 12),
            },
          ]}>
          <Button
            title={uploading ? 'Đang tải ảnh...' : submitLabel}
            onPress={submit}
            loading={submitting}
            disabled={uploading}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 18,
    lineHeight: lineHeightFor(18),
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  draftTitle: {
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    fontWeight: '700',
  },
  draftSubtitle: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    marginTop: 2,
  },
  draftClearBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  draftClearText: {
    fontSize: 13,
    fontWeight: '700',
  },
  imagePlaceholder: {
    height: 170,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderTitle: {
    fontSize: 15,
    lineHeight: lineHeightFor(15),
    fontWeight: '700',
  },
  placeholderSub: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
  },
  previewContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  imageActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  imageBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 18,
  },
  imageBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    fontWeight: '700',
  },
  cardHint: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  listError: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepBadge: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  timerLabel: {
    fontSize: 12,
    lineHeight: lineHeightFor(12),
  },
  timerInput: {
    width: 64,
  },
  footerBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  submitBtn: {
    width: '100%',
  },
});

export default RecipeForm;

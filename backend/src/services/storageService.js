// ─────────────────────────────────────────────────────────────────────────────
// Lưu ảnh món ăn lên Supabase Storage (bucket công khai) → trả URL https dùng được
// trên mọi máy. Cần SUPABASE_SERVICE_ROLE_KEY trong .env (KHÔNG đưa key này vào app).
// ─────────────────────────────────────────────────────────────────────────────
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "recipe-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIME_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// SUPABASE_URL để trống → suy ra từ DB_USER dạng "postgres.<project-ref>" (pooler Supabase)
function supabaseUrl() {
    if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL.replace(/\/+$/, "");
    const ref = String(process.env.DB_USER || "").match(/^postgres\.([a-z0-9]+)$/i)?.[1];
    return ref ? `https://${ref}.supabase.co` : null;
}

let client = null;
function getClient() {
    if (client) return client;
    const url = supabaseUrl();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    return client;
}

const httpError = (status, message) => Object.assign(new Error(message), { status });

/** Tạo bucket công khai nếu chưa có (dùng cho script cài đặt và lần tải đầu tiên) */
async function ensureBucket() {
    const supabase = getClient();
    if (!supabase) throw httpError(503, "Máy chủ chưa cấu hình lưu ảnh (thiếu SUPABASE_SERVICE_ROLE_KEY).");
    const { data } = await supabase.storage.getBucket(BUCKET);
    if (data) return { created: false };
    const { error } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_IMAGE_BYTES,
        allowedMimeTypes: Object.keys(MIME_EXT),
    });
    if (error && !/already exists/i.test(error.message)) throw error;
    return { created: true };
}

/**
 * Nhận ảnh base64 từ app → lưu vào <bucket>/<prefix>/<thời điểm>-<ngẫu nhiên>.<đuôi>
 * @returns {Promise<string>} URL công khai của ảnh
 */
async function uploadImage(prefix, base64, mimeType) {
    const supabase = getClient();
    if (!supabase) throw httpError(503, "Máy chủ chưa cấu hình lưu ảnh (thiếu SUPABASE_SERVICE_ROLE_KEY).");

    const mime = String(mimeType || "image/jpeg").toLowerCase();
    const ext = MIME_EXT[mime];
    if (!ext) throw httpError(400, "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");

    const buffer = Buffer.from(String(base64).replace(/^data:[^;]+;base64,/, ""), "base64");
    if (buffer.length === 0) throw httpError(400, "Ảnh không hợp lệ.");
    if (buffer.length > MAX_IMAGE_BYTES) throw httpError(413, "Ảnh quá lớn (tối đa 5MB). Hãy chọn ảnh khác hoặc cắt nhỏ lại.");

    const path = `${prefix}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const upload = () => supabase.storage.from(BUCKET).upload(path, buffer, {
        contentType: mime,
        cacheControl: "31536000",
        upsert: false,
    });

    let { error } = await upload();
    // Bucket chưa được tạo → tự tạo rồi thử lại một lần
    if (error && /bucket not found/i.test(error.message)) {
        await ensureBucket();
        ({ error } = await upload());
    }
    if (error) throw error;

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Ảnh món: <userId>/... */
const uploadRecipeImage = (userId, base64, mimeType) => uploadImage(String(userId), base64, mimeType);

/** Ảnh đại diện: avatars/<userId>/... */
const uploadAvatarImage = (userId, base64, mimeType) => uploadImage(`avatars/${userId}`, base64, mimeType);

/**
 * Xoá ảnh cũ trong bucket của app (bỏ qua URL ngoài, vd ảnh mặc định). Không ném lỗi:
 * xoá thất bại chỉ để lại 1 file thừa, không ảnh hưởng người dùng.
 */
async function removeStoredImage(url) {
    const supabase = getClient();
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = String(url || "").indexOf(marker);
    if (!supabase || idx < 0) return;
    const path = decodeURIComponent(String(url).slice(idx + marker.length).split("?")[0]);
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
}

module.exports = {
    BUCKET,
    MAX_IMAGE_BYTES,
    ensureBucket,
    uploadImage,
    uploadRecipeImage,
    uploadAvatarImage,
    removeStoredImage,
    supabaseUrl,
};

<div align="center">

# 🍲 Bếp Việt

**Sổ tay nấu ăn món Việt thông minh: tìm món hợp khẩu vị, tự tránh món gây dị ứng, hỏi trợ lý AI và nấu theo từng bước.**

![Expo](https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini-8E75B2?logo=googlegemini&logoColor=white)

</div>

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Kiến trúc](#kiến-trúc)
- [Công nghệ](#công-nghệ)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt và chạy trên máy](#cài-đặt-và-chạy-trên-máy)
- [Biến môi trường](#biến-môi-trường)
- [Tài liệu API](#tài-liệu-api)
- [Cách hệ thống lọc dị ứng và khẩu vị](#cách-hệ-thống-lọc-dị-ứng-và-khẩu-vị)
- [Kiểm thử](#kiểm-thử)
- [Build và triển khai](#build-và-triển-khai)
- [Xử lý sự cố thường gặp](#xử-lý-sự-cố-thường-gặp)

---

## Giới thiệu

**Bếp Việt** là ứng dụng di động (Android / iOS) với **hơn 720 công thức món Việt**, chia theo loại món, nguyên liệu chính, bữa ăn và vùng miền.

Ứng dụng tập trung vào ba vấn đề người nấu ăn hay gặp:

1. **"Mình bị dị ứng, món này ăn được không?"** Món chứa nguyên liệu dị ứng bị ẩn hẳn khỏi kết quả, kể cả biến thể của nguyên liệu (ví dụ dị ứng *Hải sản* thì tránh cả *Dầu hào*, *Mắm tôm*).
2. **"Mình không ăn cay / ăn nhạt."** Mỗi món có hồ sơ vị (cay, mặn, ngọt, béo) tính từ định lượng nguyên liệu. App ẩn món không hợp và ưu tiên món hợp khẩu vị.
3. **"Hết nguyên liệu này thì thay bằng gì? Nấu cho 6 người thì bao nhiêu?"** Trợ lý AI (Google Gemini) tra trực tiếp dữ liệu công thức để trả lời, không trả lời chung chung.

---

## Tính năng

### Khám phá và tìm kiếm
- Danh sách món phân trang, chọn nhanh theo 10 loại món chính (canh, kho, xào, bún phở…).
- Tìm theo tên món hoặc nguyên liệu, lọc theo thời gian nấu, độ khó, chế độ ăn và danh mục.
- Mỗi thẻ món có ảnh hoặc biểu tượng theo loại món, kèm nhãn vị 🌶 Cay · 🧂 Đậm · 🍬 Ngọt · 💧 Nhiều béo.

### Cá nhân hoá
- **Dị ứng:** chọn theo 9 nhóm (Hải sản có vỏ, Cá, Trứng, Sữa, Đậu phộng, Hạt cây, Đậu nành, Gluten, Mè) hoặc tìm từng nguyên liệu trong kho hơn 500 nguyên liệu.
- **Khẩu vị theo mức:** Cay (không / nhẹ / thích), Mặn (nhạt / vừa / đậm), Ngọt, Dầu mỡ.
- **Chế độ ăn:** ăn tất cả, chay, thuần chay…

### Trợ lý ẩm thực AI
- Hỏi đáp tự nhiên bằng tiếng Việt: gợi ý món theo nguyên liệu có sẵn, thay thế nguyên liệu, tính lại định lượng, giải thích từng bước nấu.
- Dùng **function calling**: AI gọi các công cụ `search_recipes`, `get_recipe_details`, `find_substitutes`, `get_user_context` để lấy dữ liệu thật.
- Gợi ý của AI cũng tuân theo dị ứng và khẩu vị của người dùng.
- Tự chuyển sang model dự phòng khi model chính quá tải hoặc hết hạn mức.

### Nấu ăn
- **Chế độ nấu từng bước:** chữ lớn, thanh tiến độ, hẹn giờ cho từng bước, danh sách bước.
- Đánh dấu nguyên liệu đã chuẩn bị; tự quy đổi định lượng theo khẩu phần.

### Thư viện
- Lưu món yêu thích, cập nhật trên giao diện ngay khi bấm.
- **Công thức của tôi:** tạo và sửa món kèm ảnh (lưu trên Supabase Storage), danh mục, hẹn giờ từng bước, chế độ **Riêng tư / Công khai**. Có tự lưu bản nháp.
- Gợi ý nguyên liệu từ kho khi nhập, để món mới cũng được lọc dị ứng chính xác.
- Thùng rác: xoá mềm, khôi phục trong 30 ngày.

### Trải nghiệm
- Giao diện sáng / tối / theo hệ thống, bố cục chuẩn edge-to-edge trên Android.
- Tải trước chi tiết món ngay khi chạm, khung chờ khi tải, chặn bấm liên tiếp mở trùng trang.

---

## Kiến trúc

```
┌──────────────────────────┐        HTTPS / JSON        ┌───────────────────────────┐
│   Ứng dụng di động       │  ───────────────────────▶  │   Backend API             │
│   Expo · React Native    │                            │   Node.js · Express 5     │
│   expo-router · RTK Query│  ◀───────────────────────  │   Sequelize · JWT         │
└──────────────────────────┘                            └─────┬───────────┬─────────┘
                                                              │           │
                                         SQL (pooler)         │           │  Function calling
                                                              ▼           ▼
                                              ┌────────────────────┐  ┌─────────────────┐
                                              │ Supabase           │  │ Google Gemini   │
                                              │ PostgreSQL+Storage │  │ (trợ lý AI)     │
                                              └────────────────────┘  └─────────────────┘
```

---

## Công nghệ

| Phần | Công nghệ |
|---|---|
| **Ứng dụng** | Expo SDK 57, React Native 0.86, React 19 (React Compiler), TypeScript, expo-router (file-based routing), Redux Toolkit + RTK Query (cache, cập nhật lạc quan, phân trang vô hạn), react-hook-form + zod, expo-image, expo-secure-store |
| **Backend** | Node.js ≥ 20, Express 5, Sequelize 6, JWT + bcrypt, gzip compression, giới hạn lượt gọi tự viết (in-memory) |
| **Dữ liệu** | Supabase PostgreSQL (truy vấn đệ quy cây nguyên liệu / danh mục), Supabase Storage (ảnh món) |
| **AI** | Google Gemini qua `@google/genai` (function calling, model dự phòng, tự nghỉ khi hết hạn mức) |
| **Triển khai** | Backend trên Render, app build bằng EAS Build |

---

## Cấu trúc thư mục

```
Food_App/
├── backend/
│   ├── src/
│   │   ├── app.js, server.js       # Khởi tạo Express, kết nối DB
│   │   ├── config/                 # Cấu hình Sequelize / pool kết nối
│   │   ├── controllers/            # auth, recipe, library, userPreferences, chatbot
│   │   ├── services/               # allergy, tasteProfile, tasteFilter, recipeSearch,
│   │   │                           # recipeWrite, storage, assistantTools
│   │   ├── data/allergenGroups.js  # Bảng 9 nhóm dị ứng → nguyên liệu (đã duyệt tay)
│   │   ├── middlewares/            # JWT auth (có cache), rate limit
│   │   ├── models/                 # Model Sequelize
│   │   └── routes/
│   ├── scripts/
│   │   ├── allergy_taste_setup.js  # Tạo bảng nhóm dị ứng + hồ sơ vị, nạp dữ liệu
│   │   └── storage_setup.js        # Tạo bucket ảnh trên Supabase Storage
│   └── tests/
│
└── frontend/
    ├── app.json, eas.json
    ├── assets/images/              # Icon, splash
    └── src/
        ├── app/                    # Màn hình (expo-router)
        │   ├── (tabs)/             # Khám phá · Tìm kiếm · Thư viện · Cá nhân
        │   ├── recipe/             # Chi tiết · Tạo mới · Sửa
        │   ├── cooking/            # Chế độ nấu từng bước
        │   ├── assistant.tsx       # Trợ lý AI
        │   ├── settings/           # Sở thích, lịch sử, thùng rác, tài khoản
        │   └── (auth)/, onboarding/
        ├── features/               # Thành phần theo tính năng (recipes, cooking, preferences, auth)
        ├── components/ui/          # Thành phần giao diện dùng chung
        ├── hooks/                  # useSafeRouter, useKeyboardAwareScroll, useAfterTransition…
        ├── store/                  # Redux store + apiSlice (RTK Query)
        ├── lib/                    # theme, typography, shadows, axios
        └── types/
```

---

## Cài đặt và chạy trên máy

### Yêu cầu
- **Node.js ≥ 20**, npm
- Tài khoản **Supabase** (PostgreSQL + Storage)
- **Gemini API key**: https://aistudio.google.com/apikey (không bắt buộc; thiếu key thì trợ lý chạy chế độ cơ bản)
- Điện thoại Android / iOS có cài **development build** của app, hoặc Android Emulator
- `eas-cli` (để build app): `npm install -g eas-cli`

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # rồi điền thông tin (xem mục Biến môi trường)
```

Khởi tạo cấu trúc dữ liệu (chạy lại nhiều lần không bị trùng dữ liệu):

```bash
node src/sync-db.js                      # Đồng bộ các bảng theo model
node scripts/allergy_taste_setup.js all  # Nhóm dị ứng, cột khẩu vị, hồ sơ vị của món
node scripts/storage_setup.js            # Bucket lưu ảnh món (cần SUPABASE_SERVICE_ROLE_KEY)
```

Chạy server:

```bash
npm run dev     # phát triển (nodemon), mặc định http://localhost:5000
npm start       # chạy thường
```

Kiểm tra: mở `http://localhost:5000/api/health`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # đặt EXPO_PUBLIC_API_URL
npx expo start --dev-client
```

| Thiết bị | `EXPO_PUBLIC_API_URL` |
|---|---|
| Điện thoại thật (cùng Wi-Fi) | `http://<IP-máy-tính>:5000/api`, ví dụ `http://192.168.1.9:5000/api` |
| Android Emulator | `http://10.0.2.2:5000/api` |
| Web / iOS Simulator | `http://localhost:5000/api` |

> Lần đầu cần cài development build lên máy: `eas build --profile development --platform android`.
> Chỉ cần build lại khi đổi phần native (icon, splash, plugin, thư viện native); đổi code JS thì reload là đủ.

---

## Biến môi trường

### `backend/.env`

| Biến | Bắt buộc | Mô tả |
|---|:---:|---|
| `PORT` | | Cổng server (mặc định `5000`; Render tự đặt) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | ✅ | Kết nối PostgreSQL (dùng **Supabase pooler**, ví dụ `aws-0-ap-northeast-1.pooler.supabase.com`) |
| `DB_POOL_MAX` | | Số kết nối tối đa (mặc định `10`) |
| `JWT_SECRET` | ✅ | Chuỗi bí mật ký token (dài, ngẫu nhiên) |
| `JWT_EXPIRES_IN` | | Hạn token, ví dụ `1d` |
| `GEMINI_API_KEY` | | Key Google Gemini cho trợ lý AI |
| `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS` | | Model chính và model dự phòng (cách nhau dấu phẩy) |
| `GEMINI_TEMPERATURE`, `GEMINI_THINKING_BUDGET`, `GEMINI_TIMEOUT_MS` | | Tinh chỉnh trợ lý |
| `ASSISTANT_RATE_LIMIT` | | Số lượt hỏi trợ lý tối đa / 5 phút / người |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅* | Khoá **secret** để lưu ảnh món (*cần cho tính năng tải ảnh) |
| `SUPABASE_URL` | | Bỏ trống thì tự suy ra từ `DB_USER` dạng `postgres.<project-ref>` |
| `SUPABASE_STORAGE_BUCKET` | | Tên bucket ảnh (mặc định `recipe-images`) |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY`, `DB_PASSWORD`, `JWT_SECRET`, `GEMINI_API_KEY` **chỉ để ở backend**, không đưa vào app hay lên Git.

### `frontend/.env`

| Biến | Mô tả |
|---|---|
| `EXPO_PUBLIC_API_URL` | Địa chỉ API dùng khi phát triển. Bản `preview` / `production` lấy địa chỉ trong `eas.json` |
| `EXPO_PUBLIC_USE_MOCK` | `true` để chạy app với dữ liệu giả, không cần backend |

---

## Tài liệu API

Tiền tố chung: `/api`. 🔒 = cần header `Authorization: Bearer <token>`; 🔓 = đăng nhập thì có thêm cá nhân hoá (lọc dị ứng, khẩu vị).

### Xác thực: `/auth`
| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| POST | `/register` | Đăng ký |
| POST | `/login` | Đăng nhập, trả về JWT |
| GET / PUT 🔒 | `/profile` | Xem / sửa hồ sơ |
| PUT 🔒 | `/change-password` | Đổi mật khẩu |
| DELETE 🔒 | `/account` | Xoá tài khoản |

### Công thức: `/recipes`
| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET 🔓 | `/` | Danh sách phân trang: `page`, `limit`, `category_ids`, `sort_by`, `taste_filter=off` |
| GET 🔓 | `/search` | Tìm kiếm: `query`, `max_time`, `difficulty`, `diet_type`, `category_ids` |
| GET 🔓 | `/discover` | Món phổ biến, nấu nhanh, gợi ý |
| GET | `/categories` | Danh mục kèm `recipe_count` |
| GET 🔓 | `/:slug` | Chi tiết món (theo slug hoặc id) kèm cảnh báo dị ứng |
| POST 🔓 | `/:id/view` | Ghi nhận lượt xem |
| POST 🔒 | `/:id/finish-cooking` | Ghi nhận đã nấu xong |

### Thư viện: `/library` 🔒
| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET / POST | `/saved` | Danh sách / lưu món |
| DELETE | `/saved/:recipe_id` | Bỏ lưu |
| GET / POST | `/my` | Công thức của tôi / tạo mới |
| PUT / DELETE | `/my/:id` | Sửa / chuyển vào thùng rác |
| POST | `/my/:id/restore` | Khôi phục |
| GET | `/trash` | Thùng rác |
| POST | `/upload-image` | Tải ảnh món (base64, ≤ 5MB, JPG/PNG/WEBP) → URL công khai |

### Người dùng: `/user` 🔒
| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET / PUT | `/preferences` | Khẩu vị, dị ứng (nhóm + nguyên liệu lẻ), danh mục yêu thích |
| GET | `/allergy-options` | 9 nhóm dị ứng kèm danh sách nguyên liệu |
| GET | `/ingredients?search=` | Tìm trong kho nguyên liệu |
| GET | `/category-options` | Danh mục để chọn |

### Trợ lý AI: `/chatbot` 🔓 (giới hạn lượt gọi)
| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| POST | `/chat` | Hội thoại với trợ lý (có thể kèm ngữ cảnh món / bước đang nấu) |
| POST | `/discover` | Gợi ý món theo câu mô tả |

Định dạng phản hồi chung:
```json
{ "success": true, "data": { }, "message": "..." }
```

---

## Cách hệ thống lọc dị ứng và khẩu vị

### Dị ứng: lọc cứng
- Các bảng `ingredient_group` và `ingredient_group_member` lưu 9 nhóm dị ứng. Danh sách nguyên liệu của từng nhóm được **duyệt tay** trong `backend/src/data/allergenGroups.js`, theo nguyên tắc "thà lọc dư còn hơn bỏ sót". Ví dụ *Dầu hào* thuộc cả nhóm Hải sản, Đậu nành và Gluten; *Cá mè* **không** thuộc nhóm Mè.
- Người dùng chọn nhóm (`user_allergy_group`) hoặc nguyên liệu lẻ (`user_allergy`).
- Một truy vấn đệ quy duy nhất (`allergyService`) gộp cả hai nguồn, đi xuống cây `parent_id` của nguyên liệu, rồi loại món chứa bất kỳ nguyên liệu nào trong tập đó. Truy vấn này dùng chung cho Khám phá, Tìm kiếm, Trợ lý AI và cảnh báo ở trang chi tiết.

### Khẩu vị: tính từ định lượng
Bảng `recipe_taste_profile` lưu ước tính **trên một khẩu phần**, tính lại tự động khi món được tạo hoặc sửa:

| Vị | Cách đo | Ngưỡng |
|---|---|---|
| Mặn | Natri (mg) | nhạt ≤ 600 · vừa ≤ 1200 · đậm > 1200 |
| Ngọt | Đường (g) | ít ≤ 3 · vừa ≤ 10 · nhiều > 10 |
| Cay | Có ớt / sa tế / tương ớt | không · nhẹ · cay |
| Béo | Chất béo (g) | ít ≤ 8 · vừa ≤ 18 · nhiều > 18 |

- Lựa chọn **kiểu tránh** (Không ăn cay, Ăn nhạt, Ít ngọt, Ít dầu mỡ) → **ẩn** món không hợp. Màn Tìm kiếm có nút tạm tắt lọc.
- Lựa chọn **kiểu thích** (Thích cay, Đậm đà, Thích ngọt) → chỉ **đưa món hợp lên đầu**, không ẩn món nào.

---

## Kiểm thử

```bash
cd backend
node tests/api_scenarios_test.js     # Kịch bản API đầu-cuối (cần server đang chạy)
node tests/verify_models_vs_db.js    # Đối chiếu model Sequelize với cấu trúc DB thật
node tests/assistant_eval.js         # Đánh giá câu trả lời của trợ lý AI (tốn hạn mức Gemini)
```

```bash
cd frontend
npx tsc --noEmit      # Kiểm tra kiểu TypeScript
npm run lint          # ESLint
```

---

## Build và triển khai

### Backend lên Render
1. Đưa thư mục `backend/` lên một repo GitHub (đã có `.gitignore` loại `.env`, `node_modules`).
2. Trên Render, chọn **New → Web Service** rồi chọn repo:
   - Region: **Singapore**
   - Build: `npm ci`
   - Start: `npm start`
   - Health Check Path: `/api/health`
3. Khai báo các biến trong mục [Biến môi trường](#backendenv), **trừ `PORT`**.
4. Từ đó mỗi lần `git push`, Render tự deploy lại.
5. Gói Free tạm ngủ sau 15 phút không có ai dùng. Nên tạo job trên https://cron-job.org gọi `/api/health` **mỗi 10 phút**.

> Backend đã bật `trust proxy` để giới hạn lượt gọi tính đúng theo IP thật của người dùng khi chạy sau proxy.

### App với EAS Build

| Profile | Dùng cho | API |
|---|---|---|
| `development` | Dev-client, kết nối Metro | `EXPO_PUBLIC_API_URL` trong `frontend/.env` |
| `preview` | APK cài thử nội bộ | `env` trong `eas.json` (HTTPS) |
| `production` | Phát hành | `env` trong `eas.json` (HTTPS) |

```bash
cd frontend
eas build --profile preview --platform android
```

> Bản release của Android **chặn `http://`**. Bản `preview` / `production` phải trỏ tới backend **HTTPS** (ví dụ Render).

---

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân / Cách xử lý |
|---|---|
| Bản `preview` không có dữ liệu | `EXPO_PUBLIC_API_URL` đang là `http://…`, bị Android chặn. Dùng địa chỉ HTTPS trong `eas.json` rồi build lại |
| Mở app lần đầu báo lỗi mạng | Server Render đang khởi động lại (30–50s). Chờ rồi thử lại, hoặc dùng cron giữ server luôn chạy |
| "Máy chủ chưa cấu hình lưu ảnh" | Thiếu `SUPABASE_SERVICE_ROLE_KEY` ở backend, hoặc chưa khởi động lại server sau khi thêm |
| Trợ lý AI trả lời chế độ cơ bản | Thiếu / sai `GEMINI_API_KEY`, hoặc tất cả model đã hết hạn mức trong ngày |
| `eas build` báo lỗi asset | Đường dẫn ảnh trong `app.json` không khớp tên file. Chạy `npx expo-doctor` để kiểm tra |
| Đổi icon / splash không thấy thay đổi | Đây là phần native: phải build lại, gỡ app cũ rồi cài bản mới |

---

<div align="center">

Phát triển bởi **[TrungTuz2521](https://github.com/TrungTuz2521)** · Dự án học tập

</div>

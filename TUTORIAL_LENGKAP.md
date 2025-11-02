# 📚 Tutorial Lengkap - Poster Composer Web (Simple Flow)

## 🎯 Cara Menjalankan Project

### 1️⃣ Start Development Server

Buka terminal di folder project:

```bash
cd C:\Users\user\Music\WM
```

Jalankan server:

```bash
npm run dev
```

Output yang muncul:
```
▲ Next.js 16.0.0 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://172.16.0.2:3000

✓ Ready in 2s
```

**Buka browser:** http://localhost:3000

---

## 🏠 Navigasi Dashboard

### Landing Page
URL: `http://localhost:3000`
- Halaman utama dengan deskripsi project
- Tombol "Go to Dashboard"

### Dashboard
URL: `http://localhost:3000/dashboard`
- **Sidebar Kiri:** Controls
  - Select Brand
  - Select Preset
  - **Add Background** (Upload)
  - **Add Watermark** (Upload)
  - **Upload Poster** (Upload)
- **Area Tengah:** Preview canvas 3:4 (real-time)
- **Tombol:** Reset & Export

---

## 📝 Tutorial Penggunaan Simple (Tanpa Setup Manual)

### Flow Baru yang Lebih Mudah:

1. Buka Dashboard
2. Add Background (upload file)
3. Add Watermark (upload file)
4. Upload Poster
5. Preview otomatis muncul
6. Export → Tersimpan otomatis di bucket `posters` dengan ratio 3:4

---

## 🚀 Step-by-Step Usage

### Step 1: Buka Dashboard

```
http://localhost:3000/dashboard
```

---

### Step 2: Add Background

1. Klik **"Add Background"** atau **"Upload Background"**
2. Pilih file gambar (JPG/PNG, max 5MB)
3. File otomatis:
   - Upload ke Supabase bucket `posters`
   - Path: `default/2025-10/bg/bg_timestamp.png`
   - URL publik dikembalikan
4. Background muncul di preview

---

### Step 3: Add Watermark (Optional)

1. Klik **"Add Watermark"**
2. Pilih file logo/watermark (PNG dengan transparansi lebih baik)
3. File otomatis:
   - Upload ke bucket `posters`
   - Path: `default/2025-10/wm/wm_timestamp.png`
4. Watermark overlay muncul di preview (opacity 12% default)

---

### Step 4: Upload Poster (Main Content)

1. Klik **"Upload Poster"** atau **"Pilih File"**
2. Pilih gambar poster lowongan kerja
3. File otomatis:
   - Upload ke bucket `posters`
   - Path: `default/2025-10/poster/poster_timestamp.jpg`
4. Poster muncul di tengah preview dengan:
   - **Mode: Contain** (tidak terpotong)
   - **Centered** (tepat di tengah)
   - **Proportional** (ratio tetap)

---

### Step 5: Preview Real-time

Preview otomatis update dengan:
- ✅ Background (cover full canvas)
- ✅ Poster (contain, centered)
- ✅ Watermark (overlay dengan opacity)
- ✅ Canvas size: **1080 x 1440** (3:4)

---

### Step 6: Adjust Settings (Optional)

Gunakan slider/controls di sidebar:

- **Padding:** 0-30% (jarak poster ke pinggir)
- **Watermark Opacity:** 0-100% (transparansi watermark)
- **Background Blur:** 0-20px (blur background)

Preview update real-time!

---

### Step 7: Export Final Result

1. Klik tombol **"Export"** (biru, pojok kanan atas)

2. System akan:
   - ✅ Composite semua layer (bg + poster + watermark)
   - ✅ Render dengan Sharp (high quality)
   - ✅ Output: **PNG 1080 x 1440** (3:4 perfect ratio)
   - ✅ **Auto-save** ke bucket `posters`
   - ✅ Path: `default/2025-10/outputs/output_timestamp_3x4.png`
   - ✅ Return URL publik untuk download

3. File otomatis tersimpan dan bisa diakses via URL:
   ```
   https://lmkejerwmuayyfeeikuc.supabase.co/storage/v1/object/public/posters/default/2025-10/outputs/output_123456789_3x4.png
   ```

4. Klik **Download** atau copy URL untuk share!

---

## 🎨 Penjelasan Teknis

### Rendering Pipeline:

```
1. Upload Background → Supabase Storage
                     → Get Public URL

2. Upload Watermark → Supabase Storage  
                    → Get Public URL

3. Upload Poster   → Supabase Storage
                   → Get Public URL

4. Click Export    → POST /api/render
                   → Sharp Composite:
                      - Layer 1: Background (cover, 1080x1440)
                      - Layer 2: Poster (contain, centered)
                      - Layer 3: Watermark (overlay, opacity 12%)
                   → Output PNG 1080x1440
                   → Auto-upload to bucket
                   → Return public URL

5. User Downloads  → From Supabase CDN
```

---

## 📊 File Structure di Bucket

```
posters/
├── default/                    (atau brandSlug)
│   └── 2025-10/               (tahun-bulan)
│       ├── bg/                (backgrounds)
│       │   └── bg_1730012345.png
│       ├── wm/                (watermarks)
│       │   └── wm_1730012346.png
│       ├── poster/            (poster asli)
│       │   └── poster_1730012347.jpg
│       └── outputs/           (hasil render)
│           └── output_1730012348_3x4.png
```

**Auto-organized by month!**

---

## 🔧 Development Workflow

### Struktur Development:

```
Terminal 1: npm run dev          ← Server jalan terus
Terminal 2: Test API / Commands  ← Untuk curl, test, dll
Browser: http://localhost:3000   ← Dashboard UI
```

---

## 📡 API Endpoints yang Sudah Ada

### ✅ Working Now:

#### 1. Get All Brands
```bash
curl http://localhost:3000/api/brands
```

#### 2. Create Brand
```bash
curl -X POST http://localhost:3000/api/brands \
  -H "Content-Type: application/json" \
  -d '{"name":"Brand Name","slug":"brand-slug","ownerUserId":"user-id"}'
```

#### 3. Get All Presets (by brand)
```bash
curl "http://localhost:3000/api/presets?slug=loker-tuban"
```

#### 4. Create Preset
```bash
curl -X POST http://localhost:3000/api/presets \
  -H "Content-Type: application/json" \
  -d '{"brandId":"xxx","name":"Preset Name","settings":{...},"createdBy":"user-id"}'
```

#### 5. Get Preset Detail
```bash
curl http://localhost:3000/api/presets/{preset-id}
```

#### 6. Update Preset
```bash
curl -X PATCH http://localhost:3000/api/presets/{preset-id} \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name"}'
```

---

### ⏳ Coming Soon (Perlu Dibuat):

#### Upload API
```bash
POST /api/upload
# Upload poster/background/watermark
```

#### Render API
```bash
POST /api/render
# Generate final poster 3:4
```

#### Batch API
```bash
POST /api/batch
# Render multiple posters
```

---

## 🎨 Cara Kerja Dashboard

### Flow Lengkap:

1. **User opens dashboard** → Load brands & presets from DB

2. **Select brand** → Load presets for that brand

3. **Select preset** → Load settings (background, watermark, footer)

4. **Upload poster** → Display in preview canvas

5. **Adjust settings** → Real-time preview update

6. **Click Export** → Call render API → Download result

---

## 🧪 Testing

### Test Connection:
```bash
node scripts/check-tables.js
```

### Test API:
```bash
# Test brands endpoint
curl http://localhost:3000/api/brands

# Test presets endpoint
curl http://localhost:3000/api/presets
```

---

## 🐛 Troubleshooting

### Port Already in Use:
```bash
# Kill existing process
Stop-Process -Name node -Force

# Or use different port
npm run dev -- -p 3001
```

### Server Not Starting:
```bash
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Reinstall dependencies
npm install

# Try again
npm run dev
```

### Can't See Brands/Presets:
```bash
# Check if data exists
curl http://localhost:3000/api/brands

# If empty, create one
curl -X POST http://localhost:3000/api/brands \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test","ownerUserId":"user-1"}'
```

---

## 📊 Database Check

### Via Supabase Dashboard:

1. Buka: https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/editor

2. Pilih table di sidebar (brands, presets, dll)

3. Klik **"Table Editor"** untuk lihat data

### Via SQL Query:

```sql
-- Check brands
SELECT * FROM brands;

-- Check presets
SELECT * FROM presets;

-- Check brand with presets
SELECT b.name, p.name as preset_name 
FROM brands b 
LEFT JOIN presets p ON p.brand_id = b.id;
```

---

## 🚀 Quick Start (Untuk User Baru)

### Minimal Setup:

```bash
# 1. Start server
npm run dev

# 2. Create brand (terminal baru)
curl -X POST http://localhost:3000/api/brands \
  -H "Content-Type: application/json" \
  -d '{"name":"My Brand","slug":"my-brand","ownerUserId":"user-1"}'

# 3. Open dashboard
# Browser: http://localhost:3000/dashboard

# 4. Upload poster dan export!
```

---

## 📱 Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Dev Tools | F12 |
| Refresh Page | Ctrl + R |
| Hard Refresh | Ctrl + Shift + R |
| Toggle Network Tab | Ctrl + Shift + E |
| Console Log | Ctrl + Shift + J |

---

## 🎯 Next Development Tasks

### Priority 1: Upload API
File: `app/api/upload/route.ts`
```typescript
export async function POST(request: NextRequest) {
  // 1. Validate file (type, size)
  // 2. Upload to Supabase Storage
  // 3. Save metadata to DB
  // 4. Return file URL
}
```

### Priority 2: Render Engine
File: `app/api/render/route.ts`
```typescript
export async function POST(request: NextRequest) {
  // 1. Load images (bg, poster, wm)
  // 2. Apply positioning (cover/contain)
  // 3. Render with Sharp
  // 4. Upload result to storage
  // 5. Return result URL
}
```

### Priority 3: Dashboard Interactivity
Files:
- `app/dashboard/components/BrandSelector.tsx`
- `app/dashboard/components/PresetSelector.tsx`
- `app/dashboard/components/FileUploader.tsx`
- `app/dashboard/components/PreviewCanvas.tsx`

---

## 📖 Dokumentasi

- **Setup:** `README.md`
- **Success Status:** `SUCCESS.md`
- **Simple Setup:** `SIMPLE_SETUP.md`
- **Architecture:** `01-architecture.md`
- **Database:** `02-database-schema.md`
- **Render Engine:** `03-render-engine.md`
- **UI/UX:** `04-frontend-ui-ux.md`
- **Presets:** `05-preset-system.md`
- **API:** `06-api-routes.md`
- **Deployment:** `07-deployment-workflow.md`

---

## 🎉 Selesai!

Dashboard sudah jalan dan siap dikembangkan!

**Next:** Implement Upload API & Render Engine untuk full functionality.

---

**Happy Coding! 🚀**

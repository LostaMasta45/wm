# Supabase Template Sync - User Guide

## 🎯 Fitur
Template settings (background, watermark, padding, opacity, size) sekarang **otomatis tersimpan ke Supabase database** dan bisa diakses dari browser lain!

**⚠️ PENTING: Proyek ini menggunakan Supabase SDK, BUKAN Prisma!**

## ✅ Yang Sudah Diimplementasi

### 1. **Auto-Save Settings** ⚡
- Setiap perubahan pada **Padding**, **Watermark Opacity**, dan **Watermark Size** otomatis tersimpan ke database
- Menggunakan debounce 1.5 detik untuk menghindari terlalu banyak API calls
- Indikator "Saving..." muncul saat data sedang disimpan

### 2. **Upload & Save Assets** 🖼️
- Background dan Watermark yang diupload langsung tersimpan ke database
- Toast notification konfirmasi saat berhasil save
- Data tersinkronisasi antara local state dan database

### 3. **Load from Database** 📥
- Saat membuka aplikasi, template otomatis dimuat dari database
- Jika database kosong, sistem akan seed template default
- Settings yang sudah diatur tetap tersimpan meski ganti browser

### 4. **Cross-Browser Persistence** 🌐
- Settings tersimpan di Supabase, bukan localStorage
- Buka di Chrome, settings tetap sama di Firefox/Edge
- Tidak perlu atur ulang template di setiap browser

## 🔧 Setup Database

### 1. Configure Environment Variables
```bash
# Copy .env.example ke .env
cp .env.example .env
```

Edit `.env` dan isi dengan credentials Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Cara mendapatkan credentials:**
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Settings > API**
4. Copy `URL`, `anon key`, dan `service_role key`

### 2. Run SQL Schema
1. Buka [Supabase SQL Editor](https://app.supabase.com/project/_/sql)
2. Copy seluruh isi file `supabase/schema.sql`
3. Paste dan klik **Run**
4. Tables akan otomatis terbuat!

**Atau via CLI:**
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## 📖 Cara Penggunaan

### 1. **Edit Template Settings**
1. Klik icon ⚙️ pada template card
2. Upload background atau watermark baru
3. Klik "Save" → Otomatis tersimpan ke database ✅

### 2. **Adjust Padding/Opacity/Size**
1. Geser slider Padding/Opacity/Size
2. Lihat indikator "Saving..." muncul
3. Setelah 1.5 detik, settings otomatis tersimpan ✅

### 3. **Test Cross-Browser**
1. Buka aplikasi di Chrome
2. Atur template settings (padding, watermark, dll)
3. Buka aplikasi di Firefox/Edge/Incognito
4. Settings tetap sama! 🎉

## 🚀 API Endpoints

### `GET /api/templates`
Load semua templates dari database untuk default brand

### `POST /api/templates`
Create template baru di database

### `PATCH /api/templates/[id]`
Update template settings (background, watermark, padding, dll)

### `GET /api/templates/[id]`
Get single template detail

## 🔍 Troubleshooting

### Template tidak tersimpan?
- Cek console browser untuk error messages
- Pastikan credentials Supabase di `.env` sudah benar
- Restart dev server setelah update `.env`
- Verify tables sudah dibuat di Supabase Dashboard > Table Editor

### Database kosong saat pertama kali?
- Normal! Sistem akan auto-seed template default
- Refresh page untuk load templates
- Cek di Supabase Dashboard > Table Editor > `presets` table

### Settings tidak sync antar browser?
- Pastikan menggunakan template ID yang sama
- Cek apakah auto-save berhasil di console log
- Periksa Supabase Dashboard > Table Editor untuk verify data tersimpan

### Error "Missing Supabase environment variables"?
- Pastikan file `.env` ada di root folder
- Pastikan semua 3 variables sudah diisi (URL, anon key, service role key)
- Restart dev server dengan `npm run dev`

## 📊 Data Structure

Template disimpan di tabel `presets` dengan struktur:
```json
{
  "id": "uuid",
  "name": "Template Name",
  "brand_id": "uuid",
  "is_default": false,
  "settings": {
    "backgroundUrl": "...",
    "watermarkUrl": "...",
    "padding": 5,
    "watermarkOpacity": 12,
    "watermarkSize": 30,
    "backgroundColor": "#FFFFFF"
  },
  "created_by": "system",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Lihat data di Supabase:**
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Table Editor**
4. Pilih table `presets`
5. Lihat semua template yang tersimpan

## ✨ Benefits

✅ **Cross-browser consistency** - Settings sama di semua browser  
✅ **Auto-save** - Tidak perlu manual save  
✅ **Real-time feedback** - Visual indicator saat saving  
✅ **Data persistence** - Data tidak hilang meski clear cache  
✅ **Multi-device** - Bisa akses dari device lain dengan settings sama  

---

**Selesai!** Template settings sekarang tersimpan di Supabase dan bisa diakses dari browser lain. 🎨🚀

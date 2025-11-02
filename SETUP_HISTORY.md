# 🚀 Quick Setup - History Feature

## Step 1: Setup Database

1. Buka **Supabase Dashboard**: https://app.supabase.com
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar
4. Copy-paste script ini dan klik **RUN**:

```sql
-- Create poster_history table
CREATE TABLE IF NOT EXISTS poster_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(255) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  brand_slug VARCHAR(255) NOT NULL,
  poster_url TEXT NOT NULL,
  thumbnail_url TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  dimensions VARCHAR(50),
  file_size VARCHAR(50),
  format VARCHAR(10) DEFAULT 'png',
  user_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_poster_history_created_at ON poster_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poster_history_user_id ON poster_history(user_id);
CREATE INDEX IF NOT EXISTS idx_poster_history_template ON poster_history(template_id);
CREATE INDEX IF NOT EXISTS idx_poster_history_brand ON poster_history(brand_slug);

-- Enable RLS
ALTER TABLE poster_history ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all for now)
CREATE POLICY "Allow all operations on poster_history" ON poster_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_poster_history_updated_at
  BEFORE UPDATE ON poster_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

5. Verify table created:
```sql
SELECT * FROM poster_history LIMIT 5;
```

✅ Jika tidak error, setup selesai!

---

## Step 2: Test Aplikasi

1. **Run development server:**
   ```bash
   npm run dev
   ```

2. **Test flow:**
   - Buka http://localhost:3000
   - Klik "Create New"
   - Upload poster & atur settings
   - Klik "Save to History" ✅
   - Klik "View History" atau kembali ke homepage
   - Lihat poster tersimpan ✅

---

## 🎯 Features

### Homepage (`/`)
- Action cards: Create New & View History
- Recent posters preview (6 terbaru)
- Features section

### Dashboard (`/dashboard`)  
- Upload & customize poster
- **NEW:** "Save to History" button
- Download PNG

### History Page (`/history`)
- Grid view semua poster
- Hover actions: Download & Delete
- Empty state jika kosong

---

## 📊 Data Structure

Setiap history item menyimpan:
- Template info (id, name, brand)
- Poster image (base64 data URL)
- Settings (padding, watermark, aspect ratio)
- Metadata (dimensions, file size, timestamps)

---

## 🔧 API Endpoints

- `GET /api/history` - List all (with pagination)
- `POST /api/history` - Save new
- `GET /api/history/:id` - Get by ID
- `DELETE /api/history/:id` - Delete by ID
- `PATCH /api/history/:id` - Update (optional)

---

## ✅ Done!

Semua ready! Sekarang tinggal:
1. Jalankan SQL migration ✅
2. Test fitur save & view ✅
3. Done! 🎉

---

**Full Documentation:** See `HISTORY_FEATURE_COMPLETE.md`

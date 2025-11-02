# Quick Setup - Supabase Template Persistence

## 🚀 Setup dalam 5 Menit

### Step 1: Environment Variables (1 menit)
```bash
# Copy .env.example
cp .env.example .env
```

Edit `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Cara dapat credentials:**
1. Buka [app.supabase.com](https://app.supabase.com)
2. Pilih project → **Settings** → **API**
3. Copy: `URL`, `anon public`, `service_role` (secret)

### Step 2: Create Tables (2 menit)
1. Buka [Supabase SQL Editor](https://app.supabase.com/project/_/sql)
2. Copy isi file `supabase/schema.sql`
3. Paste & klik **RUN** ✅

### Step 3: Restart Server (1 menit)
```bash
npm run dev
```

### Step 4: Test (1 menit)
1. Buka `http://localhost:3000`
2. Edit template settings (padding, watermark, dll)
3. Lihat console log: `"✓ Settings auto-saved to database"`
4. Buka di browser lain → Settings tetap sama! 🎉

---

## ✅ Verification Checklist

- [ ] File `.env` sudah diisi dengan 3 credentials Supabase
- [ ] SQL schema sudah di-run di Supabase SQL Editor
- [ ] Tables `brands` dan `presets` sudah muncul di Table Editor
- [ ] Dev server sudah restart
- [ ] Console log menampilkan "✓ Settings auto-saved to database"
- [ ] Settings tersimpan dan bisa diakses dari browser lain

---

## 🔍 Quick Troubleshoot

**Error: "Missing Supabase environment variables"**
→ Cek `.env` ada di root folder dan sudah diisi semua credentials

**Template tidak muncul?**
→ Refresh page, sistem akan auto-seed template default

**Auto-save tidak jalan?**
→ Cek console browser untuk error messages

**Data tidak sync antar browser?**
→ Verify di Supabase Dashboard > Table Editor > `presets` table

---

## 📁 Files Modified

✅ **Created:**
- `supabase/schema.sql` - Database schema
- `app/api/templates/route.ts` - GET & POST templates
- `app/api/templates/[id]/route.ts` - GET & PATCH single template

✅ **Modified:**
- `lib/store.ts` - Added database sync methods
- `app/dashboard/components/PosterComposerJobMate.tsx` - Auto-save + load
- `app/dashboard/components/TemplateSettingsModal.tsx` - Save uploads to DB

---

## 🎯 How It Works

```
User changes setting (padding/opacity/size)
   ↓
Local state updates instantly
   ↓
Wait 1.5 seconds (debounce)
   ↓
Auto-save to Supabase via PATCH /api/templates/[id]
   ↓
Show "Saving..." indicator
   ↓
Success! ✅ Settings persisted
```

---

**Done!** Template settings sekarang tersimpan di Supabase. 🚀

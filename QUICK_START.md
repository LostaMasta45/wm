# 🚀 Quick Start - Supabase Setup

## Status Saat Ini

✅ Environment variables sudah diisi  
✅ Supabase project sudah terhubung  
❌ **DATABASE_URL perlu update dengan password**  
❌ Database schema belum di-push  
❌ Storage bucket belum dibuat  

---

## 🔥 3 Langkah Cepat

### 1️⃣ Update Database Password di .env.local

**Cari password database Anda:**
- Jika Anda save saat create project → gunakan password itu
- Jika lupa → reset password di [Supabase Settings](https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/settings/database)

**Edit `.env.local`:**

Ganti `[YOUR-PASSWORD]` dengan password database Anda pada 2 baris ini:

```env
DATABASE_URL="postgresql://postgres.lmkejerwmuayyfeeikuc:GANTI_INI@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.lmkejerwmuayyfeeikuc:GANTI_INI@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**Contoh (jika password: MyP@ssw0rd):**
```env
DATABASE_URL="postgresql://postgres.lmkejerwmuayyfeeikuc:MyP@ssw0rd@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.lmkejerwmuayyfeeikuc:MyP@ssw0rd@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

⚠️ **Note:** Jika password mengandung special characters (@, #, $, dll), gunakan URL encoding:
- @ = %40
- # = %23
- $ = %24
- / = %2F

---

### 2️⃣ Push Database Schema

```bash
npm run prisma:push
```

Ini akan membuat semua tabel di Supabase:
- ✅ Brand
- ✅ Asset
- ✅ Preset
- ✅ Poster
- ✅ Composition
- ✅ Output
- ✅ AuditLog
- ✅ Project

**Output yang diharapkan:**
```
Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

---

### 3️⃣ Buat Storage Bucket

**Via Supabase Dashboard:**

1. Buka: https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/storage/buckets
2. Klik **"New bucket"**
3. Isi form:
   - **Name:** `posters`
   - **Public bucket:** ✅ **Centang ini!** (Agar hasil bisa diakses publik)
   - **File size limit:** `5242880` (5 MB dalam bytes)
   - **Allowed MIME types:** `image/jpeg,image/png,image/jpg,image/webp`
4. Klik **"Create bucket"**

**✅ DONE!**

---

## ✅ Verifikasi Setup

Jalankan test koneksi lagi:

```bash
node scripts/test-supabase-connection.js
```

**Expected Output:**
```
✅ Environment Variables
✅ Client Connection
✅ Admin Connection
✅ Storage Bucket
✅ Database Tables

🎉 All tests passed! Supabase is ready to use.
```

---

## 🎯 Next Steps After Success

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test API Endpoints

**Create a brand:**
```bash
curl -X POST http://localhost:3000/api/brands -H "Content-Type: application/json" -d "{\"name\":\"Test Brand\",\"slug\":\"test-brand\",\"ownerUserId\":\"user-123\"}"
```

**Get all brands:**
```bash
curl http://localhost:3000/api/brands
```

### 3. View Database
```bash
npm run prisma:studio
```

Opens GUI at http://localhost:5555

---

## 🐛 Troubleshooting

### ❌ Error: "password authentication failed"

**Penyebab:** Password salah atau special characters tidak di-encode

**Solusi:**
1. Pastikan password benar
2. Jika ada special characters, gunakan URL encoding
3. Test koneksi manual:
   ```bash
   npx prisma db pull
   ```

### ❌ Error: "relation does not exist"

**Penyebab:** Schema belum di-push

**Solusi:**
```bash
npm run prisma:push
```

### ❌ Error: "Bucket not found"

**Penyebab:** Bucket `posters` belum dibuat

**Solusi:** Ikuti step 3 di atas

---

## 📚 Resources

- **Supabase Dashboard:** https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc
- **Database Settings:** https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/settings/database
- **Storage Buckets:** https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/storage/buckets
- **Full Setup Guide:** `SUPABASE_SETUP.md`

---

## 📞 Need Help?

Jika masih ada masalah, jalankan test script untuk diagnosis:

```bash
node scripts/test-supabase-connection.js
```

Dan lihat error message yang muncul.

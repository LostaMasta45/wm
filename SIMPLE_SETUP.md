# 🚀 Setup Sederhana (Seperti Project Jobmate)

## ✅ Sudah OK - No Changes Needed!

File `.env.local` Anda sudah benar:
```env
NEXT_PUBLIC_SUPABASE_URL="https://lmkejerwmuayyfeeikuc.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_BUCKET="posters"
```

**Tidak perlu DATABASE_URL yang ribet!** ✅

---

## 📝 3 Langkah Simple

### 1️⃣ Buat Tables di Supabase

Buka: https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/editor

1. Klik **"New query"**
2. Copy-paste isi file `scripts/create-tables.sql`
3. Klik **"Run"** (atau tekan F5)
4. ✅ Selesai! Tables terbuat

---

### 2️⃣ Buat Storage Bucket

Buka: https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/storage/buckets

1. Klik **"New bucket"**
2. Name: `posters`
3. ✅ Centang **"Public bucket"**
4. Klik **"Create bucket"**

---

### 3️⃣ Test Koneksi

```bash
node scripts/test-supabase-connection.js
```

Harusnya semua ✅ hijau!

---

## 🎯 Done! Start Development

```bash
npm run dev
```

Server jalan di: http://localhost:3000

Test API:
```bash
curl http://localhost:3000/api/brands
```

---

## 📌 Kenapa Lebih Simple?

**Sebelum (Pakai Prisma):**
- ❌ Butuh DATABASE_URL yang ribet
- ❌ Harus `npx prisma push`
- ❌ Error kalau format connection string salah

**Sekarang (Direct Supabase SDK):**
- ✅ Cukup 3 env variables
- ✅ Langsung pakai Supabase client
- ✅ Seperti project jobmate Anda

---

## 🔄 Perbedaan dengan Prisma

### Dulu (Prisma):
```typescript
const brands = await prisma.brand.findMany();
```

### Sekarang (Supabase SDK):
```typescript
const { data: brands } = await supabase.from('brands').select('*');
```

Lebih simple dan familiar! 🎉

---

## 📚 Dokumentasi

- **Supabase JS Docs:** https://supabase.com/docs/reference/javascript
- **SQL Editor:** https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/editor
- **Storage:** https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/storage

---

**Next:** Jalankan SQL script untuk create tables!

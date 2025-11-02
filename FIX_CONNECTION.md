# 🔧 Fix Connection String

## ❌ Masalah

Error: `FATAL: Tenant or user not found`

**Penyebab:** Format connection string salah!

---

## ✅ Solusi: Update .env

Format connection string Supabase yang **BENAR**:

### Untuk DATABASE_URL (Pooler - port 6543):
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Untuk DIRECT_URL (Direct - port 5432):
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

---

## 🔑 Cara Mendapatkan Connection String yang Benar

1. Buka: https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/settings/database

2. Scroll ke **"Connection string"**

3. Pilih tab **"URI"**

4. Copy connection string (ada 2 jenis):
   - **Session mode** (pakai port 6543 dengan pooler)
   - **Direct connection** (pakai port 5432 tanpa pooler)

5. Ganti `[YOUR-PASSWORD]` dengan password database Anda

---

## 📝 Update File .env

Berdasarkan project Anda (`lmkejerwmuayyfeeikuc`), seharusnya:

```env
# Session Pooler (untuk runtime)
DATABASE_URL="postgresql://postgres.lmkejerwmuayyfeeikuc:BismillahLancar45@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (untuk migrations/prisma push)
DIRECT_URL="postgresql://postgres:BismillahLancar45@db.lmkejerwmuayyfeeikuc.supabase.co:5432/postgres"
```

**⚠️ PERHATIKAN PERBEDAAN:**

| Type | Host Format | Port |
|------|------------|------|
| **Pooler** | `postgres.[ref]@aws-0-[region].pooler.supabase.com` | 6543 |
| **Direct** | `postgres@db.[ref].supabase.co` | 5432 |

---

## 🚀 Langkah Selanjutnya

1. **Copy connection string dari Supabase Dashboard** (yang sudah benar)
2. **Update file `.env`** dengan format yang benar
3. **Test koneksi:**
   ```bash
   npx prisma db pull
   ```
4. **Push schema:**
   ```bash
   npm run prisma:push
   ```

---

## 💡 Alternative: Pakai Transaction Pooler

Jika masih error, coba mode **Transaction** (bukan Session):

```env
DATABASE_URL="postgresql://postgres.lmkejerwmuayyfeeikuc:BismillahLancar45@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&pool_mode=transaction"
```

---

## 🎯 Quick Fix

Jalankan script ini untuk mendapatkan format yang benar:

```bash
node scripts/fix-connection-string.js
```

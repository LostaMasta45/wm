# 🚀 Tutorial Lengkap Setup Supabase

## 📋 Checklist Setup

- [ ] Membuat project di Supabase
- [ ] Mendapatkan API Keys
- [ ] Mengisi .env.local
- [ ] Setup Database dengan Prisma
- [ ] Membuat Storage Bucket
- [ ] Test koneksi Supabase
- [ ] Setup Row Level Security (RLS)

---

## 1. Membuat Project di Supabase

### Step 1.1: Daftar/Login ke Supabase
1. Buka https://supabase.com
2. Klik **"Start your project"** atau **"Sign In"**
3. Login dengan GitHub, Google, atau Email

### Step 1.2: Create New Project
1. Klik **"New Project"** di dashboard
2. Pilih **Organization** (buat baru jika belum ada)
3. Isi detail project:
   - **Name:** `poster-composer` (atau nama lain)
   - **Database Password:** Simpan password ini! (Akan digunakan di connection string)
   - **Region:** Pilih yang terdekat (e.g., Singapore - ap-southeast-1)
   - **Pricing Plan:** Free tier (cukup untuk development)
4. Klik **"Create new project"**
5. Tunggu ~2 menit hingga project selesai dibuat

---

## 2. Mendapatkan API Keys & Database URL

### Step 2.1: API Keys
1. Di dashboard project, klik **"Settings"** (icon gear) di sidebar kiri
2. Klik **"API"** di menu Settings
3. Copy informasi berikut:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **API Keys:**
   - **anon public:** `eyJhbGc...` (untuk client-side)
   - **service_role:** `eyJhbGc...` (untuk server-side, RAHASIA!)

### Step 2.2: Database URL
1. Di Settings, klik **"Database"**
2. Scroll ke bawah ke bagian **"Connection string"**
3. Pilih tab **"URI"**
4. Copy connection string (format):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. **Ganti `[YOUR-PASSWORD]`** dengan password database yang Anda buat di step 1.2

---

## 3. Mengisi .env.local

Edit file `.env.local` di root project:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Storage Bucket Name
SUPABASE_BUCKET="posters"

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# JWT Secret (generate random string)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"

# Render Configuration
RENDER_TMP_DIR="/tmp"
```

**⚠️ PENTING:**
- Jangan commit file `.env.local` ke Git!
- File ini sudah ada di `.gitignore`
- Ganti semua nilai `xxxxxxxxxxxxx` dengan nilai dari project Anda

---

## 4. Setup Database dengan Prisma

### Step 4.1: Generate Prisma Client
```bash
npm run prisma:generate
```

Output yang diharapkan:
```
✔ Generated Prisma Client (v6.x.x)
```

### Step 4.2: Push Schema ke Database
```bash
npm run prisma:push
```

Ini akan:
- Membaca `prisma/schema.prisma`
- Membuat semua tabel di Supabase
- Membuat relationships dan indexes

Output yang diharapkan:
```
Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client

Running generate... (Use --skip-generate to skip the generators)
✔ Generated Prisma Client
```

### Step 4.3: Verifikasi Database (Optional)
```bash
npm run prisma:studio
```

Akan membuka GUI di browser untuk melihat tabel:
- http://localhost:5555

Atau cek di Supabase Dashboard:
1. Klik **"Table Editor"** di sidebar
2. Seharusnya muncul tabel: Brand, Asset, Preset, Poster, dll.

---

## 5. Membuat Storage Bucket

### Step 5.1: Create Bucket
1. Di Supabase Dashboard, klik **"Storage"** di sidebar
2. Klik **"Create a new bucket"**
3. Isi form:
   - **Name:** `posters`
   - **Public bucket:** ✅ Centang (agar hasil bisa diakses via URL publik)
   - **File size limit:** 5 MB (sesuai spec)
   - **Allowed MIME types:** `image/jpeg,image/png,image/jpg,image/webp`
4. Klik **"Create bucket"**

### Step 5.2: Setup Bucket Policies (Optional - untuk production)
1. Klik bucket `posters`
2. Klik tab **"Policies"**
3. Add policy untuk public read:
   ```sql
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'posters' );
   ```

---

## 6. Test Koneksi Supabase

### Option A: Gunakan Script Test (Recommended)

Jalankan script test yang sudah saya buatkan:

```bash
node scripts/test-supabase-connection.js
```

### Option B: Manual Test via Prisma Studio

```bash
npm run prisma:studio
```

Jika berhasil connect, Prisma Studio akan terbuka di browser.

### Option C: Test via API Route

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Test Brand API:
   ```bash
   curl http://localhost:3000/api/brands
   ```

   Response yang diharapkan:
   ```json
   {
     "status": "success",
     "data": []
   }
   ```

---

## 7. Setup Row Level Security (RLS) - Optional

Untuk production, enable RLS pada tabel Supabase:

### Via Supabase Dashboard:
1. Klik **"Authentication"** → **"Policies"**
2. Enable RLS untuk tabel penting:
   - brands
   - assets
   - presets
   - posters
   - compositions
   - outputs

### Contoh Policy (Basic):
```sql
-- Allow authenticated users to read their own brand
CREATE POLICY "Users can view own brands"
ON brands FOR SELECT
USING ( auth.uid() = owner_user_id );

-- Allow authenticated users to create brand
CREATE POLICY "Users can create brands"
ON brands FOR INSERT
WITH CHECK ( auth.uid() = owner_user_id );
```

---

## 8. Troubleshooting

### ❌ Error: "Connection refused"
**Penyebab:** Database URL salah atau password salah

**Solusi:**
1. Cek DATABASE_URL di .env.local
2. Pastikan password benar (cek di Supabase Settings → Database)
3. Test koneksi manual:
   ```bash
   npx prisma db pull
   ```

### ❌ Error: "Invalid API key"
**Penyebab:** SUPABASE_ANON_KEY atau SERVICE_ROLE_KEY salah

**Solusi:**
1. Cek Supabase Settings → API
2. Copy ulang API keys
3. Pastikan tidak ada spasi atau karakter tersembunyi

### ❌ Error: "Bucket not found"
**Penyebab:** Bucket `posters` belum dibuat

**Solusi:**
1. Buka Supabase → Storage
2. Create bucket dengan nama `posters`
3. Pastikan nama bucket di .env.local sesuai

### ❌ Prisma Push Error: "Schema mismatch"
**Penyebab:** Ada perubahan schema yang belum di-sync

**Solusi:**
```bash
# Reset database (HATI-HATI: menghapus data!)
npx prisma db push --force-reset

# Atau gunakan migrations
npx prisma migrate dev --name init
```

### ❌ Error: "Cannot find module '@prisma/client'"
**Penyebab:** Prisma Client belum di-generate

**Solusi:**
```bash
npm run prisma:generate
```

---

## 9. Seed Data (Optional)

Untuk testing, Anda bisa seed data awal:

### Create seed script: `prisma/seed.ts`
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test brand
  const brand = await prisma.brand.create({
    data: {
      name: 'Loker Tuban',
      slug: 'loker-tuban',
      ownerUserId: 'test-user-id',
    },
  });

  console.log('Created brand:', brand);

  // Create test preset
  const preset = await prisma.preset.create({
    data: {
      brandId: brand.id,
      name: 'Feed 3:4 Default',
      isDefault: true,
      createdBy: 'test-user-id',
      settings: {
        canvas: { ratio: '3:4', width: 1080, height: 1440, backgroundColor: '#FFFFFF' },
        background: { mode: 'cover', blur: 0, tint: { color: '#000000', opacity: 0 } },
        poster: { paddingPct: 0, shadow: { enabled: true, blur: 20, opacity: 0.2, y: 4 }, border: { enabled: false, width: 2, color: '#FFFFFF', radius: 0 }, minScale: 0.2, maxFill: false },
        watermark: { mode: 'full', opacity: 0.12, containScale: 0.8, tile: { angleDeg: 30, gap: 160, scale: 0.6 } },
        footer: { enabled: true, text: 'Tidak dipungut biaya apapun.', font: { family: 'Inter', weight: 600, sizePx: 28, tracking: 0 }, color: '#111111', safePaddingPx: 32, logoAssetId: null, align: 'center' },
        exports: [{ tag: '3x4_1080x1440', w: 1080, h: 1440, format: 'png', quality: 92 }],
      },
    },
  });

  console.log('Created preset:', preset);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Add seed script to package.json:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

### Run seed:
```bash
npx prisma db seed
```

---

## 10. Checklist Akhir ✅

Pastikan semua ini berhasil:

- [ ] ✅ Project Supabase sudah dibuat
- [ ] ✅ .env.local sudah diisi dengan benar
- [ ] ✅ `npm run prisma:generate` berhasil
- [ ] ✅ `npm run prisma:push` berhasil (tabel terbuat)
- [ ] ✅ Bucket `posters` sudah dibuat di Storage
- [ ] ✅ Test koneksi berhasil (script atau API)
- [ ] ✅ `npm run dev` berjalan tanpa error
- [ ] ✅ API `/api/brands` bisa diakses

---

## 🎉 Selesai!

Supabase sudah ter-setup dengan lengkap. Anda bisa mulai development!

### Next Steps:
1. Test upload file ke Storage
2. Implement render engine
3. Build dashboard UI

### Useful Links:
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Supabase Docs:** https://supabase.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Storage Docs:** https://supabase.com/docs/guides/storage

---

**Need help?** Check `scripts/test-supabase-connection.js` untuk test koneksi.

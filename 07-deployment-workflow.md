## 🚀 **07-deployment-workflow.md**

### Judul

**Poster Composer Web — Deployment, Environment, CI/CD & Performance Optimization**

---

## 1) Tujuan

Memberikan panduan lengkap untuk **menjalankan, membuild, dan mendeploy** web Poster Composer di lingkungan **Vercel** (Frontend + API) dengan integrasi **Supabase** (Database + Storage), serta memastikan render cepat dan aman untuk file besar.

---

## 2) Struktur Infrastruktur

```
🌐 Frontend  → Next.js 15 (Vercel)
🧠 Database  → Supabase Postgres + Prisma
🗂️ Storage   → Supabase Storage / Cloudflare R2
⚙️ Render    → Sharp (Node.js, Serverless)
🔐 Auth      → Supabase Auth (Email+Password)
🧵 Queue     → (Opsional) Inngest / QStash / Vercel Cron
📦 CDN       → Supabase CDN atau Cloudflare CDN
```

---

## 3) 📁 Struktur Folder Produksi

```
root/
 ├─ /src/
 │   ├─ /app/               # Next.js App Router
 │   │   ├─ /api/           # Serverless API routes
 │   │   ├─ /dashboard/     # Admin panel UI
 │   │   └─ /login/         # Auth page
 │   ├─ /components/
 │   ├─ /lib/
 │   ├─ /hooks/
 │   └─ /styles/
 ├─ /public/
 ├─ .env.local
 ├─ package.json
 ├─ next.config.js
 ├─ vercel.json
 └─ prisma/schema.prisma
```

---

## 4) 🔧 Environment Variables

| Variable                                               | Deskripsi                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                             | URL proyek Supabase                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                        | Kunci publik untuk client                                            |
| `SUPABASE_SERVICE_ROLE_KEY`                            | Kunci server-side (untuk API render)                                 |
| `SUPABASE_BUCKET`                                      | Nama bucket penyimpanan (contoh: `posters`)                          |
| `JWT_SECRET`                                           | Secret untuk session token (fallback jika tidak pakai Supabase Auth) |
| `NEXT_PUBLIC_SITE_URL`                                 | URL domain utama                                                     |
| `RENDER_TMP_DIR`                                       | Temp folder (`/tmp` di serverless)                                   |
| `VERCEL_ENV`                                           | Environment saat ini (`development`, `preview`, `production`)        |
| `INNGEST_API_KEY`                                      | (opsional) untuk batch queue                                         |
| `TELEGRAM_BOT_TOKEN`                                   | (opsional) untuk notifikasi render selesai                           |
| `CLOUDFLARE_R2_ACCESS_KEY`, `CLOUDFLARE_R2_SECRET_KEY` | jika pakai Cloudflare R2                                             |

---

## 5) ⚙️ Build & Run

### Dev Mode

```bash
npm install
npm run dev
```

### Build & Production

```bash
npm run build
npm start
```

### Prisma Sync (Database)

```bash
npx prisma generate
npx prisma db push
```

---

## 6) 🚀 Deployment ke Vercel

### A. Hubungkan Repository

* Push repo ke **GitHub**.
* Import ke **Vercel Dashboard**.
* Pilih project → **Next.js**.
* Masukkan semua **ENV** di “Project Settings → Environment Variables”.

### B. Build Settings

| Setting         | Value            |
| --------------- | ---------------- |
| Build Command   | `npm run build`  |
| Output Dir      | `.next`          |
| Node Version    | `18.x atau 20.x` |
| Install Command | `npm install`    |

### C. Serverless Functions

* Semua file di `/app/api/*` otomatis jadi **Edge Function**.
* Sharp harus versi **WASM-compatible** agar berjalan di Vercel.
  → gunakan `sharp-wasm` atau build `sharp` dengan `--without-installation` opsional.

---

## 7) 🔄 CI/CD Workflow (GitHub)

### `.github/workflows/deploy.yml`

```yaml
name: Deploy Poster Composer
on:
  push:
    branches:
      - main
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 8) 🧵 Queue System (Batch Rendering)

Untuk batch rendering (mis. 20 poster sekaligus):

* Gunakan **Inngest** atau **Vercel Cron**.
* Endpoint `/api/batch` → enqueue job → worker (`/api/worker/render`).

**Inngest Example:**

```ts
import { inngest } from "@/lib/inngest";

export const renderBatch = inngest.createFunction(
  { id: "render-batch" },
  { event: "batch/render" },
  async ({ event, step }) => {
    const { posterUrls, presetId } = event.data;
    for (const url of posterUrls) {
      await step.run("render-one", async () => {
        await fetch("/api/render", {
          method: "POST",
          body: JSON.stringify({ preset_id: presetId, poster_url: url })
        });
      });
    }
  }
);
```

---

## 9) ⚡️ Optimasi Performa

### A. Render Cepat (Server)

* Cache image asset (background, watermark) di memory.
* Gunakan `sharp` dengan concurrency = 2 (agar efisien RAM).
* Hindari konversi besar di client; hanya preview ringan di Canvas.
* Limit ukuran upload ke 5MB, max 3000px per sisi.

### B. Render Cepat (Client)

* Gunakan OffscreenCanvas untuk preview.
* Render ulang layer spesifik (poster/watermark) saja saat diubah.
* Gunakan `useMemo` / `useDebounce` pada slider.

### C. CDN Caching

* Semua hasil output PNG/JPG di-serve dari Supabase CDN.
* Cache-control header:

  ```
  Cache-Control: public, max-age=31536000, immutable
  ```

---

## 10) 🧩 Rencana Versi (Release Flow)

| Versi    | Fokus                               | Target      |
| -------- | ----------------------------------- | ----------- |
| **v1.0** | MVP (Upload → Preview → Export PNG) | Minggu ke-1 |
| **v1.1** | Preset CRUD + Story Export          | Minggu ke-2 |
| **v1.2** | Batch Export + ZIP                  | Minggu ke-3 |
| **v1.3** | Caption Builder + Telegram Bot      | Minggu ke-4 |
| **v1.4** | OCR + Auto Caption (AI)             | Minggu ke-6 |

---

## 11) 🧠 Backup & Recovery

### Database

* Gunakan Supabase auto-backup harian.
* Simpan preset JSON di Git (`/presets/`).

### File

* Semua hasil & upload otomatis di Storage; gunakan versioning bucket.

### Restore

* Import preset JSON → insert manual ke DB (endpoint `/api/presets/import`).

---

## 12) 🧰 Monitoring & Logs

### A. Supabase Logs

* Query performance, storage access.

### B. Vercel Logs

* `vercel logs poster-composer.vercel.app --prod`
* Tambah alert ke Slack/Email bila render error > 10x.

### C. Internal Logs

Gunakan tabel `audit_logs`:

```ts
insertAudit({
  user_id: uid,
  action: "EXPORT",
  meta: { preset: "Loker Tuban", result: "success" }
});
```

---

## 13) 🌍 Domain & SEO

* Domain custom via Cloudflare (contoh: `poster.jobmate.id`).
* HTTPS aktif otomatis.
* Metadata dasar di Next.js `<head>`:

  ```tsx
  <meta name="theme-color" content="#14B8A6" />
  <meta property="og:title" content="Poster Composer JobMate" />
  ```

---

## 14) 🔐 Keamanan

* Auth wajib (Supabase / Email+Password).
* Role-based Access:

  * `owner` → semua API.
  * `editor` → render, edit preset.
  * `uploader` → upload saja.
  * `viewer` → hanya lihat hasil.
* Batasi origin (CORS whitelist domain resmi).
* Hapus metadata EXIF semua file render.
* Tambahkan invisible watermark (opsional SHA embed).

---

## 15) 🧩 Troubleshooting Cepat

| Masalah                        | Penyebab                   | Solusi                                                       |
| ------------------------------ | -------------------------- | ------------------------------------------------------------ |
| Gambar tidak muncul di preview | URL tidak diizinkan (CORS) | Tambahkan header `Access-Control-Allow-Origin: *` di storage |
| Render gagal di Vercel         | `sharp` tidak support Edge | Gunakan `sharp-wasm`                                         |
| Export PDF blur                | Poster kecil (low DPI)     | Gunakan render ulang 300dpi                                  |
| Upload gagal                   | File > 5MB                 | Kompres dulu di client                                       |
| Batch timeout                  | Terlalu banyak file        | Pindah ke queue async (Inngest)                              |

---

## 16) 📦 Backup Deployment Offline

Jika perlu deploy di server lokal:

1. Jalankan Docker Compose:

   ```yaml
   services:
     web:
       image: node:20
       volumes: [".:/app"]
       working_dir: /app
       command: npm run dev
       ports:
         - "3000:3000"
   ```
2. Pastikan ENV sama dengan Vercel.
3. Jalankan manual `npm run build && npm start`.

---

## 17) ✅ Deployment Checklist

| Langkah                             | Status |
| ----------------------------------- | ------ |
| Supabase DB & Storage dibuat        | ✅      |
| ENV variables diisi lengkap         | ✅      |
| Preset default dibuat (brand utama) | ✅      |
| Render test 3:4 berhasil            | ✅      |
| Export Story & PDF normal           | ✅      |
| Domain & HTTPS aktif                | ✅      |
| Log & Backup otomatis               | ✅      |

---

## 18) 🚀 Tips Optimalisasi Tambahan

* Gunakan **Edge Middleware** hanya untuk auth check (ringan).
* Split `sharp` logic ke file terpisah (`/lib/renderEngine.ts`).
* Simpan hasil render lokal `/tmp` untuk re-upload cepat.
* Gunakan format `.webp` untuk preview (lebih ringan).
* Aktifkan **lazy import** modul berat (`sharp`, `pdfkit`).

---

## 19) 🌐 Jalur Deployment Multi-Brand

Untuk platform multi-brand (Loker Tuban, Jombang, Lamongan, dll):

* Gunakan satu instance Poster Composer.
* Setiap brand punya domain alias:

  ```
  loker-tuban.jobmate.id
  loker-jombang.jobmate.id
  ```
* Branding (BG, WM, footer) otomatis berdasar preset brand slug.
* Supabase tabel `brands` jadi pusat konfigurasi multi-tenant.

---

## 20) 🔄 Maintenance Routine

| Frekuensi  | Tugas                                |
| ---------- | ------------------------------------ |
| Harian     | Cek render logs & error              |
| Mingguan   | Backup preset & hasil                |
| Bulanan    | Bersihkan file > 30 hari dari `/tmp` |
| Tiap rilis | Regenerate Prisma & Re-deploy        |

---

💡 **Kesimpulan:**

> Sistem ini 100% siap jalan di Vercel, scalable untuk multi-brand, aman, dan mudah dikembangkan.
> Dengan pipeline ini, kamu bisa upload → render → hasil → posting hanya dalam hitungan detik.

--


## 🧱 **01-architecture.md**

### Judul:

**Poster Composer Web — Architecture Overview**

---

### 🎯 **Tujuan Utama**

Sistem ini bertujuan untuk **menghasilkan poster lowongan kerja berukuran 3:4 secara otomatis dan konsisten**, dengan format brand tetap (background, watermark, footer), dari poster asli yang di-upload oleh admin.

Poster asli bisa berukuran berapa pun, dan sistem akan menempatkannya **tepat di tengah, proporsional (contain), dan dalam frame 3:4 presisi.**

---

### 🧩 **Komponen Utama Sistem**

1. **Frontend (Next.js + Tailwind + shadcn/ui)**

   * Tempat admin meng-upload poster.
   * Menampilkan **preview real-time** dengan background & watermark.
   * Mengatur parameter (padding, opacity, mode watermark, dll).
   * Menyediakan tombol **Export PNG / PDF / Story 9:16.**

2. **Render Engine (Canvas + Sharp)**

   * Canvas di client untuk preview.
   * Sharp di server (API route) untuk render akhir dengan kualitas tinggi.
   * Output default: **1080×1440 px (3:4)**.
   * Mode: COVER (background), CONTAIN (poster), TILE/FULL (watermark).

3. **Preset System**

   * Preset = template konfigurasi untuk tiap brand (misal: *Loker Tuban*).
   * Menyimpan background, watermark, font, padding, opacity, dan footer.
   * Admin tinggal pilih preset → hasil langsung sesuai branding.

4. **Storage Layer (Supabase / Cloudflare R2)**

   * Menyimpan file asli (poster), background, watermark, dan hasil export.
   * Setiap render menghasilkan file baru dengan struktur rapi:

     ```
     /brand/yyyy-mm/poster-slug_1080x1440.png
     ```

5. **Database (PostgreSQL via Prisma/Supabase)**

   * Menyimpan data brand, preset, poster, dan hasil render.
   * Relasional: brand → preset → poster → composition → output.

6. **API Backend (Next.js Route Handlers)**

   * `/api/render`: menerima input + preset → hasilkan PNG.
   * `/api/presets`: CRUD untuk preset brand.
   * `/api/batch`: multi render otomatis.

7. **Auth System (Firebase / Supabase Auth)**

   * Login hanya untuk admin terverifikasi (invite-only).
   * Role-based: Owner, Editor, Uploader, Viewer.
   * Audit: siapa upload, siapa render, waktu dan hasilnya.

---

### 🔄 **Alur Kerja User**

1. **Login** → masuk ke dashboard.
2. **Pilih Brand Preset** (misal: Loker Tuban).
3. **Upload Poster Asli** (ukuran bebas, JPG/PNG).
4. **Preview Otomatis** muncul di canvas:

   * Background dan watermark aktif sesuai preset.
   * Poster ter-center secara otomatis.
5. **Sesuaikan setting (optional)**

   * Padding, opacity watermark, footer ON/OFF.
6. **Klik Export** → sistem memproses:

   * Client-side preview cepat (Canvas).
   * Server-side render HD (Sharp) → upload ke Storage.
7. **Download hasil** (PNG / PDF / Story).
8. **(Opsional)**: Auto-post ke Telegram/WA bot.

---

### ⚙️ **Arsitektur Teknis**

```
[ Client / Next.js ]
     │
     ▼
Canvas Preview (JS)
     │
     ▼
/api/render (Serverless Function)
     │
     ▼
Sharp Renderer (Node)
     │
     ▼
Output PNG
     │
     ▼
Supabase Storage / Cloudflare R2
```

---

### 📁 **Struktur Folder (Next.js 15 / App Router)**

```
/src
 ├─ /app
 │   ├─ /dashboard
 │   │   ├─ page.tsx
 │   │   ├─ components/PosterComposer.tsx
 │   │   ├─ components/PreviewCanvas.tsx
 │   │   └─ components/ControlPanel.tsx
 │   ├─ /api
 │   │   ├─ /render/route.ts
 │   │   ├─ /presets/route.ts
 │   │   └─ /batch/route.ts
 ├─ /lib
 │   ├─ coverContain.ts        # Algoritma positioning
 │   ├─ tileWatermark.ts       # Logika watermark
 │   ├─ supabaseClient.ts
 │   └─ presetsSchema.ts
 ├─ /components/ui             # Shadcn Components
 ├─ /assets
 │   ├─ /bg                    # Background default
 │   ├─ /wm                    # Watermark default
 │   └─ /logo
 └─ /styles
     └─ globals.css
```

---

### 🌐 **Stack Teknis**

| Komponen  | Teknologi                            |
| --------- | ------------------------------------ |
| Frontend  | Next.js 15 + TailwindCSS + shadcn/ui |
| Rendering | HTMLCanvas (preview), Sharp (final)  |
| Backend   | Next.js API Route                    |
| Database  | Supabase (Postgres + Prisma)         |
| Storage   | Supabase Storage / Cloudflare R2     |
| Auth      | Supabase Auth / Firebase             |
| Deploy    | Vercel                               |
| Batch Job | Inngest / QStash (opsional)          |

---

### 🧱 **Arsitektur Modular**

* **Frontend App:** UI interaktif & kontrol preset.
* **Render Engine:** fungsi murni → input (poster + preset) → output (gambar).
* **Preset Manager:** JSON config manager untuk tiap brand.
* **Storage & CDN Layer:** semua hasil disimpan, bisa dishare via URL publik.
* **Auth & Audit:** keamanan + tracking aktivitas admin.

---

### 🧩 **Integrasi Opsional**

* **AI Caption Generator:** ambil teks dari poster → buat caption otomatis.
* **Telegram/WA Bot:** kirim hasil render ke grup operator.
* **Invisible Watermark:** kode unik tiap render (untuk anti duplikasi).

---

### 💡 **Prinsip Desain Sistem**

* 100% konsistensi rasio & brand identity.
* Minimal langkah upload → hasil (maks 3 klik).
* Real-time preview di browser.
* Serverless-friendly (render cepat).
* Semua aset dan preset reusable lintas brand.

---

Setelah ini selesai lanjutkan ke 02-database-schema.md

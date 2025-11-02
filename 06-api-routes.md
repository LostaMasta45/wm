## 🧩 **06-api-routes.md**

### Judul

**Poster Composer Web — API Routes & Backend Flow**

---

## 1) Tujuan

Menjelaskan semua endpoint backend (Next.js Route Handlers) yang mengatur:

* Upload aset & poster
* Render poster (Canvas/Sharp)
* Batch export
* Preset CRUD
* Auth & logging

Setiap endpoint berjalan di lingkungan **Serverless (Vercel Functions)** dan mengakses **Supabase (DB + Storage)**.

---

## 2) Arsitektur API Secara Umum

```
Client (Next.js UI)
  ↓
API Routes (Next.js /api/)
  ↓
Supabase (Database & Storage)
  ↓
Render Engine (Sharp)
```

---

## 3) Struktur Folder API (Next.js 15 / App Router)

```
/src/app/api
 ├─ /auth/
 │   ├─ /login/route.ts
 │   └─ /logout/route.ts
 ├─ /upload/route.ts
 ├─ /presets/
 │   ├─ /route.ts          (GET, POST)
 │   ├─ /[id]/route.ts     (GET, PATCH, DELETE)
 ├─ /render/route.ts
 ├─ /batch/route.ts
 ├─ /brands/route.ts
 └─ /outputs/route.ts
```

---

## 4) `/api/upload`

Upload file (poster, background, watermark, logo) ke Supabase Storage.

**Method:** `POST`
**Auth:** Admin only
**Body:** `multipart/form-data`

**Fields:**

| Field        | Type    | Keterangan                      |
| ------------ | ------- | ------------------------------- |
| `file`       | File    | Gambar poster/bg/wm/logo        |
| `type`       | string  | `poster` / `bg` / `wm` / `logo` |
| `brand_id`   | string  | ID brand                        |
| `project_id` | string? | Opsional, untuk batch           |

**Flow:**

1. Validasi MIME (hanya JPG/PNG ≤ 5MB)
2. Upload ke `supabase.storage`
3. Simpan metadata di tabel `assets` atau `posters`
4. Return URL publik

**Response:**

```json
{
  "status": "success",
  "file_url": "https://cdn.supabase.io/.../poster_abc.png",
  "meta": { "width": 1080, "height": 1440 }
}
```

---

## 5) `/api/presets`

CRUD untuk preset brand.

### **GET** → List semua preset

`/api/presets?brand=<slug>`

```json
[
  { "id": "uuid1", "name": "Feed 3:4", "is_default": true },
  { "id": "uuid2", "name": "Story 9:16" }
]
```

### **POST** → Tambah preset baru

```json
{
  "brand_id": "uuid-brand",
  "name": "Feed 3:4",
  "settings": { "poster": { "paddingPct": 10 } }
}
```

Response: `{ "status": "success", "id": "uuid" }`

---

## 6) `/api/presets/[id]`

### **GET**

Ambil satu preset detail (JSON settings)

### **PATCH**

Update sebagian field preset (misal ubah watermark opacity)

```json
{
  "settings": { "watermark": { "opacity": 0.15 } }
}
```

### **DELETE**

Hapus preset (dengan verifikasi role Owner)

---

## 7) `/api/render`

Endpoint inti untuk membuat hasil gambar (3:4 PNG / Story / PDF).

**Method:** `POST`
**Auth:** Admin
**Body:**

```json
{
  "brand_id": "uuid",
  "preset_id": "uuid",
  "poster_url": "https://cdn.supabase.io/...jpg",
  "overrides": {
    "watermark": { "opacity": 0.18 }
  },
  "size_tag": "3x4_1080x1440"
}
```

**Flow:**

1. Ambil preset dari DB.
2. Merge dengan `overrides`.
3. Jalankan fungsi `renderOneExport()` (lihat `03-render-engine.md`).
4. Upload hasil ke storage.
5. Simpan ke tabel `outputs`.

**Response:**

```json
{
  "status": "done",
  "output_url": "https://cdn.supabase.io/.../uuid_3x4_1080x1440.png",
  "bytes": 232412,
  "checksum": "a13e24c5..."
}
```

---

## 8) `/api/batch`

Render banyak poster sekaligus (dengan preset yang sama).

**Method:** `POST`
**Body:**

```json
{
  "brand_id": "uuid-brand",
  "preset_id": "uuid-preset",
  "poster_urls": [
    "https://cdn/.../p1.jpg",
    "https://cdn/.../p2.jpg"
  ],
  "size_tags": ["3x4_1080x1440", "story_1080x1920"]
}
```

**Flow:**

* Loop semua poster → buat job ke queue (Inngest/QStash).
* Kirim status via SSE / polling.

**Response:**

```json
{
  "queued": 2,
  "job_id": "batch_20251026_1453"
}
```

---

## 9) `/api/brands`

List semua brand user (untuk multi-admin).

### **GET**

`/api/brands?user=<uid>`

Response:

```json
[
  { "id": "uuid1", "name": "Loker Tuban", "slug": "loker-tuban" },
  { "id": "uuid2", "name": "Loker Jombang" }
]
```

---

## 10) `/api/outputs`

Ambil daftar hasil render.

### **GET**

`/api/outputs?composition_id=<uuid>`

Response:

```json
[
  {
    "tag": "3x4_1080x1440",
    "url": "https://cdn.supabase.io/...png",
    "created_at": "2025-10-26T13:00:00Z"
  }
]
```

---

## 11) `/api/auth/login`

**POST**

```json
{ "email": "admin@domain.com", "password": "****" }
```

* Menggunakan Supabase Auth.
* Return JWT & role info.

Response:

```json
{
  "status": "ok",
  "user": {
    "id": "uuid",
    "name": "Admin Tuban",
    "role": "owner"
  },
  "token": "jwt..."
}
```

---

## 12) Middleware & Guard

### `/src/middleware.ts`

```ts
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function middleware(req) {
  const user = await verifyAuth(req);
  if (!user) return NextResponse.redirect("/login");
  return NextResponse.next();
}
```

Guard:

* Hanya `role ∈ ['owner','editor','uploader']` bisa akses `/api/render`.
* Role `viewer` hanya bisa `GET`.

---

## 13) Error & Response Format

| Field     | Keterangan                                          |         |         |
| --------- | --------------------------------------------------- | ------- | ------- |
| `status`  | `"success"                                          | "error" | "done"` |
| `message` | Pesan error (jika ada)                              |         |         |
| `code`    | Kode error (e.g. `E_NO_PRESET`, `E_FILE_TOO_LARGE`) |         |         |
| `data`    | Optional payload                                    |         |         |

**Contoh:**

```json
{
  "status": "error",
  "code": "E_NO_PRESET",
  "message": "Preset not found for this brand"
}
```

---

## 14) Upload Handling (Streaming)

Untuk file besar:

* Gunakan `busboy` di Node.
* Simpan sementara ke `/tmp`.
* Upload ke Supabase Storage dengan SDK.

---

## 15) Security Notes

* Validasi semua URL input (harus domain resmi CDN).
* Batasi ukuran upload ≤ 5 MB.
* Semua output dibuat read-only (public link).
* Gunakan HTTPS-only endpoint.

---

## 16) Integrasi Webhook / Bot (Opsional)

Setelah render selesai:

* Kirim notifikasi ke **Telegram Bot** atau **WA Gateway**.
* Payload:

  ```json
  {
    "brand": "Loker Tuban",
    "filename": "Poster_Tuban_2025-10-26.png",
    "url": "https://cdn/...png"
  }
  ```

Webhook ditrigger dari `/api/render` (async).

---

## 17) Logging & Audit

Setiap event (upload/render/delete) dicatat ke tabel `audit_logs`:

```json
{
  "user_id": "uuid",
  "action": "RENDER",
  "subject_id": "composition_id",
  "meta": { "size": "3x4_1080x1440" }
}
```

---

## 18) Skema Response Cepat

| Endpoint       | Fungsi       | Response Singkat     |
| -------------- | ------------ | -------------------- |
| `/api/upload`  | Upload file  | `{status,file_url}`  |
| `/api/presets` | CRUD preset  | `{id,name,settings}` |
| `/api/render`  | Render satu  | `{output_url}`       |
| `/api/batch`   | Batch render | `{queued,job_id}`    |
| `/api/outputs` | Ambil hasil  | `[ {tag,url} ]`      |
| `/api/brands`  | List brand   | `[ {id,name,slug} ]` |

---

## 19) Contoh Alur Penuh (Request → Render → Output)

```bash
# 1. Upload poster
POST /api/upload
file=@poster.jpg&type=poster&brand_id=uuid-brand

# 2. Ambil preset
GET /api/presets/default?brand=loker-tuban

# 3. Render hasil
POST /api/render
{
  "brand_id": "uuid-brand",
  "preset_id": "uuid-preset",
  "poster_url": "https://cdn.supabase.io/poster.jpg",
  "size_tag": "3x4_1080x1440"
}

# 4. Dapatkan hasil PNG
→ output_url: https://cdn.supabase.io/.../uuid_3x4.png
```

---

## 20) Catatan Pengembangan

* Semua endpoint dikembangkan modular (`/api/**/route.ts`).
* Gunakan helper `lib/supabaseClient.ts` untuk semua operasi DB & Storage.
* Uji coba dengan Postman / Thunder Client.
* Tambahkan rate limit di `/api/render` untuk mencegah spam render.

---

Lanjutkan ke 07-deployment-workflow.md

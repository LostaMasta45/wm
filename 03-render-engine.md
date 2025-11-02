## 🗄️ **02-database-schema.md**

### Judul

**Poster Composer Web — Database Schema (Supabase/Postgres + Prisma)**

---

## 1) Tujuan & Prinsip

* Menyimpan **brand**, **aset** (BG/WM/Logo), **preset**, **poster asli**, **komposisi render**, dan **output** (PNG/JPG/PDF).
* Relasional, audit-able, dan siap **multi brand** + **multi user**.
* Simpan **settings** fleksibel sebagai JSON dengan validation schema.

---

## 2) ERD Ringkas

```
users (auth)
   ▲ 1..*
   │
brands ── 1..* ── assets
   │  └───────┬────────┐
   │          │        │
   │      1..*│    1..*│
   │        presets   projects
   │           │         │
   │           │     1..*│
   │           └──────┬──┘
   │                1..* 
   │               posters (file asli)
   │                   │
   │               1..* compositions (satu kombinasi poster+preset+override)
   │                          │
   │                       1..* outputs (PNG/JPG/PDF berbagai ukuran)
   │
audit_logs (siapa melakukan apa, kapan)
```

---

## 3) Tabel & Kolom

### 3.1 `brands`

| Kolom             | Tipe          | Keterangan                    |
| ----------------- | ------------- | ----------------------------- |
| id                | uuid (pk)     | default gen_random_uuid()     |
| name              | text          | Nama brand (Loker Tuban, dll) |
| slug              | text unique   | lowercase, untuk path         |
| owner_user_id     | uuid          | refer ke users.id             |
| default_preset_id | uuid nullable | refer ke presets.id           |
| created_at        | timestamptz   | default now()                 |
| updated_at        | timestamptz   | trigger update                |

**Index**: `uniq_slug`, `idx_owner`.

---

### 3.2 `assets`

| Kolom      | Tipe                   | Keterangan                     |
| ---------- | ---------------------- | ------------------------------ |
| id         | uuid (pk)              |                                |
| brand_id   | uuid fk → brands.id    |                                |
| type       | enum('bg','wm','logo') |                                |
| file_url   | text                   | URL di storage/CDN             |
| meta       | jsonb                  | {width,height,format,avgColor} |
| created_by | uuid                   | users.id                       |
| created_at | timestamptz            |                                |

**Index**: `(brand_id, type)`.

---

### 3.3 `presets`

| Kolom      | Tipe                  | Keterangan                         |
| ---------- | --------------------- | ---------------------------------- |
| id         | uuid (pk)             |                                    |
| brand_id   | uuid fk               |                                    |
| name       | text                  |                                    |
| is_default | boolean default false |                                    |
| settings   | jsonb                 | lihat **Schema Settings** di bawah |
| created_by | uuid                  |                                    |
| created_at | timestamptz           |                                    |
| updated_at | timestamptz           |                                    |

**Unique**: `(brand_id, name)`.

---

### 3.4 `projects` *(opsional, untuk batch/grouping)*

| Kolom      | Tipe        | Keterangan |
| ---------- | ----------- | ---------- |
| id         | uuid (pk)   |            |
| brand_id   | uuid fk     |            |
| title      | text        |            |
| notes      | text        |            |
| created_by | uuid        |            |
| created_at | timestamptz |            |

---

### 3.5 `posters`

| Kolom       | Tipe             | Keterangan        |
| ----------- | ---------------- | ----------------- |
| id          | uuid (pk)        |                   |
| brand_id    | uuid fk          |                   |
| project_id  | uuid nullable fk |                   |
| file_url    | text             | URL poster asli   |
| meta        | jsonb            | {w,h,format,hash} |
| uploaded_by | uuid             |                   |
| created_at  | timestamptz      |                   |

**Index**: `(brand_id, project_id)`.

---

### 3.6 `compositions`

Satu instance “render plan” = poster + preset + override.

| Kolom      | Tipe                                      | Keterangan                           |
| ---------- | ----------------------------------------- | ------------------------------------ |
| id         | uuid (pk)                                 |                                      |
| brand_id   | uuid fk                                   |                                      |
| poster_id  | uuid fk                                   |                                      |
| preset_id  | uuid fk                                   |                                      |
| overrides  | jsonb                                     | hanya field yang berbeda dari preset |
| status     | enum('draft','rendering','done','failed') |                                      |
| created_by | uuid                                      |                                      |
| created_at | timestamptz                               |                                      |
| updated_at | timestamptz                               |                                      |

**Index**: `(poster_id, preset_id)`, `status`.

---

### 3.7 `outputs`

| Kolom          | Tipe                    | Keterangan                                     |
| -------------- | ----------------------- | ---------------------------------------------- |
| id             | uuid (pk)               |                                                |
| composition_id | uuid fk                 |                                                |
| size_tag       | text                    | '3x4_1080x1440' / 'story_1080x1920' / 'a4_pdf' |
| file_url       | text                    |                                                |
| format         | enum('png','jpg','pdf') |                                                |
| checksum       | text                    | sha1/md5 untuk cache bust                      |
| bytes          | int                     |                                                |
| created_at     | timestamptz             |                                                |

**Unique**: `(composition_id, size_tag)`.

---

### 3.8 `audit_logs`

| Kolom      | Tipe           | Keterangan                                          |
| ---------- | -------------- | --------------------------------------------------- |
| id         | bigserial (pk) |                                                     |
| brand_id   | uuid           |                                                     |
| user_id    | uuid           |                                                     |
| action     | text           | 'UPLOAD_POSTER','RENDER','DOWNLOAD','UPDATE_PRESET' |
| subject_id | uuid nullable  | id terkait                                          |
| meta       | jsonb          |                                                     |
| created_at | timestamptz    |                                                     |

Index pada `(brand_id, created_at)`.

---

## 4) Schema Settings (JSON untuk `presets.settings`)

Validator boleh pakai Zod/Yup di FE & BE.

```json
{
  "canvas": { "ratio": "3:4", "width": 1080, "height": 1440, "backgroundColor": "#FFFFFF" },
  "background": {
    "assetId": "uuid-of-bg",
    "mode": "cover",         // cover only
    "blur": 0,               // px
    "tint": { "color": "#000000", "opacity": 0.0 } 
  },
  "poster": {
    "paddingPct": 0,         // 0..30 (% dari min(canvasW,H))
    "shadow": { "enabled": true, "blur": 20, "opacity": 0.2, "y": 4 },
    "border": { "enabled": false, "width": 2, "color": "#FFFFFF", "radius": 0 },
    "minScale": 0.2,         // agar tidak terlalu kecil
    "maxFill": false         // true = boleh sedikit crop (cover-ish)
  },
  "watermark": {
    "assetId": "uuid-of-wm",
    "mode": "full",          // full | contain | tile
    "opacity": 0.12,
    "containScale": 0.8,     // % dari canvas min dim (mode contain)
    "tile": { "angleDeg": 30, "gap": 160, "scale": 0.6 }
  },
  "footer": {
    "enabled": true,
    "text": "Tidak dipungut biaya apapun. Waspada penipuan.",
    "font": { "family": "Inter", "weight": 600, "sizePx": 28, "tracking": 0 },
    "color": "#111111",
    "safePaddingPx": 32,
    "logoAssetId": null,
    "align": "center"        // left|center|right
  },
  "exports": [
    { "tag": "3x4_1080x1440", "w": 1080, "h": 1440, "format": "png", "quality": 92 },
    { "tag": "story_1080x1920", "w": 1080, "h": 1920, "format": "jpg", "quality": 88 },
    { "tag": "a4_pdf", "mm": { "w": 210, "h": 297 }, "dpi": 300, "format": "pdf" }
  ]
}
```

---

## 5) Prisma Model (contoh ringkas)

```prisma
model Brand {
  id               String   @id @default(uuid())
  name             String
  slug             String   @unique
  ownerUserId      String
  defaultPresetId  String?  @db.Uuid
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  assets           Asset[]
  presets          Preset[]
  projects         Project[]
  posters          Poster[]
  compositions     Composition[]
}

model Asset {
  id         String   @id @default(uuid())
  brandId    String
  type       AssetType
  fileUrl    String
  meta       Json
  createdBy  String
  createdAt  DateTime @default(now())
  brand      Brand    @relation(fields: [brandId], references: [id])
}

enum AssetType { bg wm logo }

model Preset {
  id         String   @id @default(uuid())
  brandId    String
  name       String
  isDefault  Boolean  @default(false)
  settings   Json
  createdBy  String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  brand      Brand    @relation(fields: [brandId], references: [id])

  @@unique([brandId, name])
}

model Project {
  id         String   @id @default(uuid())
  brandId    String
  title      String
  notes      String?
  createdBy  String
  createdAt  DateTime @default(now())
  brand      Brand    @relation(fields: [brandId], references: [id])
  posters    Poster[]
}

model Poster {
  id          String   @id @default(uuid())
  brandId     String
  projectId   String?
  fileUrl     String
  meta        Json
  uploadedBy  String
  createdAt   DateTime @default(now())
  brand       Brand    @relation(fields: [brandId], references: [id])
  project     Project? @relation(fields: [projectId], references: [id])
  compositions Composition[]
}

model Composition {
  id         String   @id @default(uuid())
  brandId    String
  posterId   String
  presetId   String
  overrides  Json
  status     RenderStatus @default(draft)
  createdBy  String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  brand      Brand    @relation(fields: [brandId], references: [id])
  poster     Poster   @relation(fields: [posterId], references: [id])
  preset     Preset   @relation(fields: [presetId], references: [id])
  outputs    Output[]
}

enum RenderStatus { draft rendering done failed }

model Output {
  id             String   @id @default(uuid())
  compositionId  String
  sizeTag        String
  fileUrl        String
  format         OutputFormat
  checksum       String?
  bytes          Int?
  createdAt      DateTime @default(now())
  composition    Composition @relation(fields: [compositionId], references: [id])

  @@unique([compositionId, sizeTag])
}

enum OutputFormat { png jpg pdf }

model AuditLog {
  id         BigInt   @id @default(autoincrement())
  brandId    String
  userId     String
  action     String
  subjectId  String?
  meta       Json?
  createdAt  DateTime @default(now())
}
```

---

## 6) Rekomendasi RLS (Supabase)

* **Policy level brand**: user hanya bisa baca/tulis baris dengan `brand_id` yang dimiliki/diundang.
* **Read public outputs** (opsional): `outputs.file_url` bisa public-read via Storage, tapi row tetap dilindungi.
* **Audit**: insert by default pada setiap aksi penting (trigger atau aplikasi).

Contoh policy (pseudo):

* `brands`: owner dapat `ALL`; member `SELECT`.
* `assets/presets/posters/compositions/outputs`: `brand_id IN (brands where user is member)`.

---

## 7) Penamaan & Path Storage

```
/{brandSlug}/{yyyy-mm}/
  bg/{assetId}.png
  wm/{assetId}.png
  logo/{assetId}.png
  posters/{posterId}_{origName}.jpg
  outputs/{compositionId}/{sizeTag}.{ext}
```

---

## 8) Seed Contoh (Preset Loker Tuban)

```sql
-- brand
insert into brands(id, name, slug, owner_user_id) 
values (gen_random_uuid(), 'Loker Tuban', 'loker-tuban', 'USER_UUID');

-- asset bg & wm (anggap sudah upload ke storage, isi URL di bawah)
insert into assets(id, brand_id, type, file_url, meta, created_by)
values
  (gen_random_uuid(), (select id from brands where slug='loker-tuban'), 'bg', 'https://cdn/.../bg1.png', '{"w":1440,"h":1440}', 'USER_UUID'),
  (gen_random_uuid(), (select id from brands where slug='loker-tuban'), 'wm', 'https://cdn/.../wm1.png', '{"w":1000,"h":1000}', 'USER_UUID');
```

Settings JSON sesuai schema pada §4 (isi `assetId` dengan UUID asset yang dibuat).

---

## 9) Validasi & Constraint Tambahan

* `check` untuk `size_tag` hanya karakter `[a-z0-9_-]`.
* Trigger `updatedAt` pada tabel yang perlu.
* Unique `(brand_id, name)` di presets mencegah duplikasi.
* `outputs` unique per `(composition_id, size_tag)` menjaga idempoten render ulang.

---

## 10) Catatan Migrasi

* Awali dengan tabel inti: `brands, assets, presets, posters`.
* Tambah `compositions` & `outputs` ketika render endpoint siap.
* `projects` & `audit_logs` dapat menyusul (V1.5).

---

lanjutkan ke 03-render-engine.md

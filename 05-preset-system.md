## 🌈 **05-preset-system.md**

### Judul

**Poster Composer Web — Preset System (Brand Configuration & JSON Schema)**

---

## 1) Tujuan

Preset system adalah **inti otomatisasi desain**:
semua pengaturan (background, watermark, padding, footer, export) disimpan dalam satu file JSON per brand.

Admin tinggal **pilih preset** → hasil render langsung mengikuti gaya brand tanpa setting manual.

---

## 2) Struktur Konsep

```
Brand (misal: Loker Tuban)
 ├── Assets (BG, WM, Logo)
 ├── Preset Default (settings JSON)
 ├── Posters (upload harian)
 ├── Composition (poster + preset)
 └── Outputs (hasil render)
```

Satu brand dapat memiliki **banyak preset**, misal:

* Feed 3:4
* Story 9:16
* Cetak A4
* Minimalist Style
* Gradient BG

---

## 3) Tujuan Preset JSON

* Menentukan **tata letak visual lengkap**.
* Menyimpan seluruh **setting parameter UI**.
* Dapat digunakan lintas halaman (client + API render).
* Dapat diimpor/ekspor (share antar brand).

---

## 4) Struktur JSON Lengkap

```json
{
  "canvas": {
    "ratio": "3:4",
    "width": 1080,
    "height": 1440,
    "backgroundColor": "#ffffff"
  },
  "background": {
    "assetId": "uuid-bg",
    "mode": "cover",
    "blur": 0,
    "tint": {
      "color": "#000000",
      "opacity": 0.0
    }
  },
  "poster": {
    "paddingPct": 0,
    "shadow": { "enabled": true, "blur": 20, "opacity": 0.2, "y": 4 },
    "border": { "enabled": false, "width": 2, "color": "#ffffff", "radius": 0 },
    "minScale": 0.2,
    "maxFill": false
  },
  "watermark": {
    "assetId": "uuid-wm",
    "mode": "full",
    "opacity": 0.12,
    "containScale": 0.8,
    "tile": { "angleDeg": 30, "gap": 160, "scale": 0.6 }
  },
  "footer": {
    "enabled": true,
    "text": "Tidak dipungut biaya apapun. Hati-hati penipuan.",
    "font": { "family": "Inter", "weight": 600, "sizePx": 28 },
    "color": "#111111",
    "safePaddingPx": 32,
    "logoAssetId": null,
    "align": "center"
  },
  "exports": [
    { "tag": "3x4_1080x1440", "w": 1080, "h": 1440, "format": "png", "quality": 92 },
    { "tag": "story_1080x1920", "w": 1080, "h": 1920, "format": "jpg", "quality": 88 },
    { "tag": "a4_pdf", "mm": { "w": 210, "h": 297 }, "dpi": 300, "format": "pdf" }
  ]
}
```

---

## 5) Penyimpanan Preset

### A. Di Database (Tabel `presets`)

| Kolom        | Jenis       | Keterangan                     |
| ------------ | ----------- | ------------------------------ |
| `id`         | uuid        | Primary key                    |
| `brand_id`   | uuid        | Brand asal preset              |
| `name`       | text        | Nama preset (Feed, Story, dll) |
| `is_default` | bool        | Preset utama                   |
| `settings`   | jsonb       | Objek seperti di atas          |
| `created_by` | uuid        | User pembuat                   |
| `created_at` | timestamptz | Timestamp                      |

---

### B. Di Local Storage (client)

Saat user ubah setting di UI, semua setting disimpan sementara di:

```
localStorage.poster_composer_state_<uid>
```

Supaya kalau reload, konfigurasi tidak hilang.

---

### C. Export / Import File

Preset bisa diunduh sebagai file `.preset.json` dan diimpor ulang.

**Contoh nama file:**
`Loker_Tuban_Feed3x4.preset.json`

**Struktur file sama persis dengan schema di atas.**

---

## 6) Implementasi di Frontend

### A. Hook State

```ts
const [preset, setPreset] = useState<PosterPreset | null>(null);

useEffect(() => {
  // fetch preset default
  fetch(`/api/presets/default?brand=${brandSlug}`)
    .then(r => r.json())
    .then(setPreset);
}, [brandSlug]);
```

### B. Terapkan ke UI

Semua slider/input terhubung langsung ke `preset.settings`:

```ts
<Slider
  value={[preset.poster.paddingPct]}
  onValueChange={(v) => setPreset({ ...preset, poster: { ...preset.poster, paddingPct: v[0] } })}
/>
```

---

## 7) API Preset CRUD

### GET `/api/presets?brand=<slug>`

→ List semua preset per brand

### GET `/api/presets/:id`

→ Detail satu preset (settings JSON)

### POST `/api/presets`

→ Buat preset baru
Body: `{ brand_id, name, settings }`

### PATCH `/api/presets/:id`

→ Update setting preset

### DELETE `/api/presets/:id`

→ Hapus preset

---

## 8) Preset Manager UI

**Tombol di Dashboard:**

```
[Pilih Preset ▼] [Tambah Preset] [💾 Simpan Perubahan]
```

**Modal "Tambah Preset Baru":**

* Input: Nama preset
* Tombol: "Gunakan setting saat ini"
* Auto simpan ke DB

---

## 9) Mekanisme Override

Ketika user ubah sedikit setting di UI tanpa menyimpan ke preset:

* Simpan perubahan hanya di field `overrides` milik `compositions`
* Contoh:

  ```json
  {
    "poster": { "paddingPct": 10 },
    "watermark": { "opacity": 0.2 }
  }
  ```
* Saat render:

  * Ambil preset JSON
  * Merge dengan overrides → hasil final

---

## 10) Validasi & Defaulting

Gunakan **Zod schema** untuk validasi:

```ts
import { z } from "zod";

export const PresetSchema = z.object({
  canvas: z.object({ ratio: z.string(), width: z.number(), height: z.number() }),
  background: z.object({
    assetId: z.string().uuid().optional(),
    mode: z.enum(["cover"]),
    blur: z.number().min(0).max(40),
    tint: z.object({ color: z.string(), opacity: z.number().min(0).max(1) })
  }),
  poster: z.object({
    paddingPct: z.number().min(0).max(30),
    shadow: z.object({ enabled: z.boolean(), blur: z.number(), opacity: z.number(), y: z.number() }),
    border: z.object({ enabled: z.boolean(), width: z.number(), color: z.string(), radius: z.number() }),
    minScale: z.number(),
    maxFill: z.boolean()
  }),
  watermark: z.object({
    assetId: z.string().uuid().optional(),
    mode: z.enum(["full", "contain", "tile"]),
    opacity: z.number().min(0).max(1),
    containScale: z.number().min(0).max(2),
    tile: z.object({
      angleDeg: z.number().min(0).max(90),
      gap: z.number().min(10).max(300),
      scale: z.number().min(0.1).max(2)
    })
  }),
  footer: z.object({
    enabled: z.boolean(),
    text: z.string(),
    font: z.object({
      family: z.string(),
      weight: z.number(),
      sizePx: z.number()
    }),
    color: z.string(),
    safePaddingPx: z.number(),
    logoAssetId: z.string().uuid().nullable(),
    align: z.enum(["left", "center", "right"])
  }),
  exports: z.array(z.object({
    tag: z.string(),
    w: z.number().optional(),
    h: z.number().optional(),
    mm: z.object({ w: z.number(), h: z.number() }).optional(),
    dpi: z.number().optional(),
    format: z.enum(["png", "jpg", "pdf"]),
    quality: z.number().min(50).max(100)
  }))
});
```

---

## 11) Preset Default per Brand

Setiap brand minimal memiliki satu preset default.
Contoh:

**Preset:** *Loker Tuban – Feed 3:4*

```json
{
  "background": { "assetId": "bg-tuban", "tint": { "opacity": 0.05 } },
  "poster": { "paddingPct": 0, "shadow": { "enabled": true } },
  "watermark": { "mode": "full", "opacity": 0.12 },
  "footer": { "enabled": true, "text": "Tidak dipungut biaya apapun." }
}
```

---

## 12) Reuse Preset untuk Output Lain

Preset utama 3:4 bisa digunakan ulang untuk Story 9:16 atau A4 PDF, hanya ubah bagian `exports`.

Contoh:

```json
"exports": [
  { "tag": "story_1080x1920", "w": 1080, "h": 1920, "format": "jpg", "quality": 88 }
]
```

---

## 13) Versi & History

* Setiap kali preset diubah → simpan versi lama (field `revision` atau tabel `preset_versions`).
* Bisa rollback kapan saja.

---

## 14) UX Bonus

* Tombol “🧩 Simpan Sebagai Preset Baru” di dashboard.
* Dropdown “✨ Gunakan Preset Brand Lain” (import).
* Badge “*Modified*” jika setting di UI berbeda dari preset asli.
* Shortcut `Ctrl+S` → simpan preset.

---

## 15) Rekomendasi Workflow Developer

* Semua preset disimpan di DB (untuk multi-admin).
* Saat build awal, seed beberapa preset default.
* Backup preset ke `.json` di `/presets/` folder (Vercel-friendly).
* Update UI langsung update `settings` di Firestore/Supabase realtime.

---

## 16) Ringkasan Relasi

```
Brand (1)
 ├─ Presets (n)
 │    ├─ Assets (bg, wm, logo)
 │    ├─ Settings JSON
 │    └─ Default Flag
 ├─ Posters (n)
 └─ Compositions (n)
       ├─ Uses Preset
       └─ Overrides JSON
```

---

## 17) Checklist QA Preset

✅ Semua field valid JSON (Zod pass).
✅ Asset ID valid dan tersedia.
✅ Padding/opacity tidak out of range.
✅ Footer tidak tumpang tindih poster.
✅ Export path benar.
✅ Preset default ada satu per brand.
✅ Import/export berfungsi sempurna.

---


Lanjutkan ke 06-api-routes.md 
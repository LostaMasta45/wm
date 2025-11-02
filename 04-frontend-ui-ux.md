## 🎨 **04-frontend-ui-ux.md**

### Judul

**Poster Composer Web — Frontend UI/UX Design (Editor & Dashboard)**

---

## 1) Tujuan Utama UI

Memberikan **pengalaman cepat dan intuitif** bagi admin untuk:

* Upload poster → lihat preview instan 3:4
* Atur background, watermark, padding, footer, dan preset
* Export hasil final (PNG/JPG/PDF) hanya dalam beberapa klik

UI harus minimalis, cepat, dan bisa dijalankan bahkan di laptop spek rendah.

---

## 2) Struktur Halaman Utama

```
📁 /dashboard/poster-composer
│
├── 🖼️ Preview Area (kiri) — Canvas 3:4 real-time
│
└── ⚙️ Control Panel (kanan)
     ├── Tab: Background | Poster | Watermark | Footer | Export
     ├── Tombol Preset Selector
     ├── Tombol Export PNG / PDF / Story
     └── Info resolusi & progress
```

---

## 3) Alur UX Singkat

1. **Login Dashboard** → masuk ke `/dashboard/poster-composer`.
2. **Pilih Preset Brand** → misal “Loker Tuban”.
3. **Upload Poster** → otomatis muncul preview tengah.
4. (Opsional) Sesuaikan: padding, opacity, watermark mode.
5. **Klik Export** → hasil muncul di bawah atau otomatis diunduh.
6. **(Batch)**: upload banyak poster sekaligus → auto-generate ZIP hasil.

---

## 4) Layout Grid (Tailwind)

```html
<div class="flex flex-col md:flex-row h-screen">
  <!-- LEFT: Preview -->
  <div class="flex-1 flex items-center justify-center bg-gray-50">
    <canvas id="previewCanvas" class="rounded-xl shadow-lg"></canvas>
  </div>

  <!-- RIGHT: Control Panel -->
  <div class="w-full md:w-96 bg-white border-l p-4 overflow-y-auto">
    <Tabs defaultValue="poster">
      <TabsList class="grid grid-cols-4 mb-2">
        <TabsTrigger value="background">BG</TabsTrigger>
        <TabsTrigger value="poster">Poster</TabsTrigger>
        <TabsTrigger value="watermark">WM</TabsTrigger>
        <TabsTrigger value="footer">Footer</TabsTrigger>
      </TabsList>

      <TabsContent value="background">...</TabsContent>
      <TabsContent value="poster">...</TabsContent>
      <TabsContent value="watermark">...</TabsContent>
      <TabsContent value="footer">...</TabsContent>
    </Tabs>
  </div>
</div>
```

---

## 5) Komponen UI (shadcn/ui)

| Komponen       | Fungsi                                  |
| -------------- | --------------------------------------- |
| `Button`       | Upload, Export, Apply Preset            |
| `Tabs`         | Navigasi layer (BG, Poster, WM, Footer) |
| `Slider`       | Atur padding, opacity, scale            |
| `Select`       | Mode watermark (full, contain, tile)    |
| `Input`        | Footer text                             |
| `Card`         | Menampilkan preset / hasil render       |
| `Dialog`       | Konfirmasi export / batch               |
| `Progress`     | Render progress                         |
| `Switch`       | Toggle fitur (footer aktif/tidak)       |
| `DropdownMenu` | Pilih ukuran export                     |
| `Toast`        | Notifikasi sukses / error               |

---

## 6) Desain Visual

* **Style:** clean, modern, sedikit futuristik seperti Figma mini.
* **Palet:** putih abu-abu lembut (#f8fafc) + aksen biru/toska (#14b8a6).
* **Typography:** Inter / Poppins, medium-weight.
* **Kontras tinggi:** kontrol selalu jelas di atas background putih.
* **Shadow lembut:** untuk elemen utama (kanvas, card, button).

---

## 7) Responsif & Mobile

* **Desktop-first**: mode dua kolom (preview + panel).
* **Mobile:** panel di bawah, canvas di atas (auto stack).
* Gunakan **Tailwind responsive utilities**.
* Canvas auto-fit lebar layar (max 90vw).

---

## 8) Real-time Preview UX

* Canvas 1080×1440, scaled responsively.
* Auto refresh saat:

  * Upload gambar baru.
  * Ganti preset.
  * Ubah slider (padding, opacity).
* Gunakan `requestAnimationFrame` atau `debounce` update 200 ms.
* Tombol “🔄 Reset View” untuk kembali ke default preset.

---

## 9) Panel Kontrol Detail

### A. Background Tab

* Upload tombol “Ganti Background”
* Slider `blur` (0–20 px)
* Slider `tint opacity` (0–0.4)
* Warna tint (color picker)
* Preview kecil (thumbnail BG)

### B. Poster Tab

* Upload Poster
* Slider Padding (%)
* Toggle Drop Shadow
* Border Radius & Border ON/OFF
* MinScale (0.2–1.0)

### C. Watermark Tab

* Upload Watermark
* Mode Select: **Full / Contain / Tile**
* Opacity Slider
* Jika “Contain”: scale (0.4–1.0)
* Jika “Tile”: angle (0–60°), gap (50–300 px), scale (0.4–1.0)
* Toggle “Preview Tile Grid”

### D. Footer Tab

* Toggle Aktif
* Textarea “Isi Footer”
* Font Size slider (16–36 px)
* Font Weight Select (400–700)
* Align: Left / Center / Right
* Logo upload (opsional)
* Safe Padding slider (10–80 px)

---

## 10) Preset Selector UX

* Tombol di navbar atas:
  `[Preset: Loker Tuban ▼]`
* Dropdown berisi semua preset milik brand.
* Saat preset dipilih:

  * Semua setting diupdate.
  * Toast “Preset Loker Tuban diterapkan.”
  * Auto refresh canvas.

---

## 11) Export Section

* Tombol besar: **[Export PNG 3:4]**
* Dropdown:

  * 3×4 PNG (1080×1440)
  * Story JPG (1080×1920)
  * A4 PDF (300 DPI)
* Tombol “Batch Export” jika banyak poster.
* Progress bar render.
* Setelah selesai:

  * Thumbnail hasil muncul.
  * Tombol “📂 Lihat File” (link CDN).

---

## 12) Hotkeys

| Tombol    | Fungsi                       |
| --------- | ---------------------------- |
| **U**     | Upload Poster                |
| **P**     | Ganti Preset                 |
| **E**     | Export PNG                   |
| **W**     | Toggle Watermark             |
| **[`]**   | Kurangi opacity WM           |
| **[']**   | Tambah opacity WM            |
| **R**     | Reset View                   |
| **← / →** | Pindah tab control           |
| **Esc**   | Tutup dialog / cancel render |

---

## 13) UX Detail Kecil

* Saat drag file → area preview berubah warna (dropzone glow).
* Saat render → overlay semi transparan “Rendering…” dengan spinner.
* Saat export sukses → notifikasi toast kanan bawah.
* Error → toast merah + log detail.
* Menyimpan setting terakhir di `localStorage` per user:
  `poster_composer_state_<uid>`

---

## 14) Batch UX Flow

1. Klik “Batch Mode” → upload banyak file (drag multiple).
2. Preview grid kecil (semua 3:4, pakai preset sama).
3. Klik “Render All”.
4. Progress per file (baris per baris).
5. Hasil → tombol “Download ZIP”.

---

## 15) UX Premium / Polishing Ideas

* **Grid & Safe Area Overlay:** garis bantu 3:4, tengah, dan footer zone.
* **Dark Mode** toggle.
* **Drag-poster manual adjust** (opsional, advanced mode).
* **Auto Color Sync:** warna BG/tint menyesuaikan tone poster.
* **History panel (Undo/Redo)** untuk edit preset.
* **Snapshot Preview:** simpan beberapa versi setting untuk perbandingan.

---

## 16) Komponen Reusable

* `PreviewCanvas.tsx`
* `ControlPanel.tsx`
* `LayerControls.tsx` (per tab)
* `ExportPanel.tsx`
* `PresetDropdown.tsx`
* `BatchUploader.tsx`
* `usePosterComposer.ts` (state hook utama)

---

## 17) UX Skenario Edge

* Poster landscape → auto contain + BG visible.
* Poster terlalu kecil → alert “Perbesar padding 0% atau pilih contain scale lebih besar.”
* File error → tampil placeholder merah dengan teks error.
* Watermark hilang → warning di tab watermark.

---

## 18) Microinteractions

* Slider → tampil value real-time.
* Hover watermark opacity → ubah preview cepat.
* Ganti preset → smooth transition 300 ms (Framer Motion).
* Export selesai → animasi muncul thumbnail hasil.

---

## 19) Performance

* Render preview pakai **OffscreenCanvas** (browser support).
* Re-render hanya layer berubah.
* Optimalkan event listener (debounce).
* Preview disimpan dalam `Blob` sementara (tanpa upload).
* Batasi ukuran file upload 5 MB (poster, bg, wm).

---

## 20) UI Testing Checklist

✅ Semua kontrol berfungsi dan sinkron dengan preview.
✅ Canvas tetap presisi 3:4 di semua viewport.
✅ Export sesuai preset.
✅ State tersimpan antar reload.
✅ Batch process tampil benar & efisien.
✅ Dark mode, overlay, toast semua tampil baik.

---


Lanjutkan ke 05-preset-system.md

# 🔄 CARA CLEAR CACHE & MUNCUL TEMPLATE DYNAMIC COLOR

## ⚠️ Masalah:
Template 🎨 Dynamic Color tidak muncul karena localStorage masih pakai data lama!

## ✅ SOLUSI CEPAT:

### **Option 1: Clear Browser LocalStorage (RECOMMENDED)**

1. Buka aplikasi di browser: http://localhost:3004/dashboard
2. Tekan **F12** (buka Developer Tools)
3. Pilih tab **Console**
4. Copy paste command ini:

```javascript
// Clear all localStorage
localStorage.clear();
// Reload page
window.location.reload();
```

5. Tekan **Enter**
6. Page akan reload otomatis
7. Template 🎨 Dynamic Color akan muncul!

---

### **Option 2: Clear Specific Store Only**

1. Buka Developer Tools (F12)
2. Pilih tab **Application** (atau **Storage**)
3. Klik **Local Storage** di sidebar kiri
4. Klik domain kamu (localhost:3004)
5. Cari key: **poster-store** atau **poster-storage**
6. Klik kanan → **Delete**
7. Refresh page (F5)

---

### **Option 3: Incognito Mode (Testing)**

1. Buka browser Incognito/Private mode
2. Buka: http://localhost:3004/dashboard
3. Template Dynamic Color akan muncul!
4. (Tapi data tidak persist)

---

## 🎯 Cara Verify Template Muncul:

Setelah clear cache, kamu akan lihat **4 templates**:

```
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│  + ADD    │  │🎨 Dynamic │  │ IG putih  │  │ Jombang   │
│ Template  │  │   Color   │  │     I     │  │ VIP   J   │
└───────────┘  └───────────┘  └───────────┘  └───────────┘
```

**Template Dynamic Color** = Purple-Pink-Orange gradient dengan Palette icon 🎨

---

## 💡 Kenapa Ini Terjadi?

Store menggunakan **localStorage persistence** (zustand persist):
- Data templates di-save ke localStorage
- Data lama tidak auto-update ketika code berubah
- Perlu clear cache manual untuk force refresh

---

## 🚀 Cara Pakai Dynamic Color Template:

1. Clear cache dulu (pakai Option 1)
2. Refresh → Template Dynamic Color muncul
3. Klik template **🎨 Dynamic Color**
4. Upload poster (gambar apa saja)
5. Background otomatis match warna poster! ✨

---

**IMPORTANT:** Setelah clear cache, semua data history & templates akan reset ke default!

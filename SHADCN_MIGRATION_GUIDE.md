# Panduan Migrasi ke shadcn/ui

## ✅ Status: shadcn/ui Sudah Terinstall!

Komponen shadcn/ui yang sudah terinstall:
- ✅ Button
- ✅ Card (CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- ✅ Dialog
- ✅ Badge
- ✅ Slider
- ✅ Separator
- ✅ ScrollArea

## 🎯 Perubahan Yang Diperlukan

### 1. Import Statements

**GANTI:**
```tsx
// Custom button
<button className="px-8 py-4 bg-gradient-to-r ...">
```

**DENGAN:**
```tsx
import { Button } from '@/components/ui/button';

<Button size="lg" className="...">
```

### 2. Template Cards

**GANTI:**
```tsx
<div className="bg-white rounded-2xl shadow-lg ...">
  <div className="p-4">
    <h3>Template Name</h3>
    <p>Description</p>
  </div>
</div>
```

**DENGAN:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Template Name</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### 3. Badges

**GANTI:**
```tsx
<span className="px-4 py-2 bg-blue-500 text-white rounded-xl">
  {padding}%
</span>
```

**DENGAN:**
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="secondary">{padding}%</Badge>
```

### 4. Sliders

**GANTI:**
```tsx
<input
  type="range"
  min="0"
  max="30"
  value={padding}
  onChange={(e) => setPadding(Number(e.target.value))}
  className="modern-slider w-full"
/>
```

**DENGAN:**
```tsx
import { Slider } from '@/components/ui/slider';

<Slider
  value={[padding]}
  onValueChange={([value]) => setPadding(value)}
  min={0}
  max={30}
  step={1}
  className="w-full"
/>
```

### 5. Separators

**GANTI:**
```tsx
<div className="border-t border-gray-200 my-8" />
```

**DENGAN:**
```tsx
import { Separator } from '@/components/ui/separator';

<Separator className="my-8" />
```

### 6. Scroll Areas

**GANTI:**
```tsx
<div className="overflow-x-auto">
  {/* Content */}
</div>
```

**DENGAN:**
```tsx
import { ScrollArea } from '@/components/ui/scroll-area';

<ScrollArea className="w-full">
  {/* Content */}
</ScrollArea>
```

## 📝 File yang Perlu Diupdate

### File: `app/dashboard/components/PosterComposerJobMate.tsx`

#### Import Section (Lines 1-10)
```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { usePosterStore } from '@/lib/store';
import { toast, Toaster } from 'sonner';
import { Download, Upload, Sparkles, Check, X, Sun, Moon, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import TemplateSettingsModal from './TemplateSettingsModal';

// Tambahkan import shadcn/ui
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
```

#### Theme Toggle Button (Around line 280)
**GANTI:**
```tsx
{mounted && (
  <button
    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    className="p-2.5 sm:p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? (
      <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
    ) : (
      <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
    )}
  </button>
)}
```

**DENGAN:**
```tsx
{mounted && (
  <Button
    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    variant="outline"
    size="icon"
    className="shrink-0"
  >
    {theme === 'dark' ? (
      <Sun className="h-[1.2rem] w-[1.2rem]" />
    ) : (
      <Moon className="h-[1.2rem] w-[1.2rem]" />
    )}
    <span className="sr-only">Toggle theme</span>
  </Button>
)}
```

#### Section Headers (Multiple locations)
**GANTI:**
```tsx
<h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
  <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs sm:text-sm font-bold flex-shrink-0">
    1
  </span>
  <span className="truncate">Pilih Template Brand</span>
</h2>
<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 ml-9 sm:ml-10">
  Pilih template sesuai brand Anda
</p>
```

**DENGAN:**
```tsx
<div className="flex items-center gap-3 mb-2">
  <Badge className="shrink-0" variant="default">1</Badge>
  <h2 className="text-lg sm:text-xl font-bold">Pilih Template Brand</h2>
</div>
<p className="text-xs sm:text-sm text-muted-foreground ml-9">
  Pilih template sesuai brand Anda
</p>
```

#### Template Cards Section (Around line 300-400)
**GANTI template card structure dengan:**
```tsx
<ScrollArea className="w-full">
  <div className="flex gap-3 sm:gap-4 pb-4">
    {templates.map((template, index) => (
      <motion.div
        key={template.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="shrink-0"
      >
        <Card 
          className={`w-48 sm:w-56 lg:w-64 cursor-pointer transition-all ${
            selectedTemplate?.id === template.id
              ? 'ring-2 ring-primary shadow-lg'
              : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedTemplate(template)}
        >
          <CardContent className="p-0 relative aspect-[3/4] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50">
            {/* Preview content */}
            {selectedTemplate?.id === template.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3"
              >
                <Badge className="bg-primary">
                  <Check className="w-3 h-3" />
                </Badge>
              </motion.div>
            )}
          </CardContent>

          <CardHeader className={`p-3 sm:p-4 ${
            selectedTemplate?.id === template.id
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              : ''
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg truncate">
                  {template.name}
                </CardTitle>
                <CardDescription className={`text-xs sm:text-sm mt-0.5 truncate ${
                  selectedTemplate?.id === template.id ? 'text-blue-100' : ''
                }`}>
                  {template.brandSlug}
                </CardDescription>
              </div>
              
              <Button
                variant={selectedTemplate?.id === template.id ? "secondary" : "ghost"}
                size="icon"
                className="shrink-0 h-7 w-7"
                onClick={(e) => handleOpenSettings(e, template)}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    ))}
  </div>
</ScrollArea>
```

#### Upload Button (Around line 450)
**GANTI:**
```tsx
<button
  onClick={() => fileInputRef.current?.click()}
  disabled={!selectedTemplate || isUploading}
  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
>
  {/* Content */}
</button>
```

**DENGAN:**
```tsx
<Button
  onClick={() => fileInputRef.current?.click()}
  disabled={!selectedTemplate || isUploading}
  size="lg"
  className="relative"
>
  {isUploading ? (
    <>
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      Uploading...
    </>
  ) : (
    <>
      <Upload className="mr-2 h-4 w-4" />
      Pilih File
    </>
  )}
</Button>
```

#### Preview Card (Around line 400-500)
**GANTI:**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden">
  <div className="p-4 sm:p-6 lg:p-8">
    {/* Content */}
  </div>
</div>
```

**DENGAN:**
```tsx
<Card>
  <CardContent className="p-4 sm:p-6 lg:p-8">
    {/* Content */}
  </CardContent>
</Card>
```

#### Canvas Info Badges (Around line 480)
**GANTI:**
```tsx
<div className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-1 sm:px-4 sm:py-2 bg-black/70 backdrop-blur-sm rounded-lg sm:rounded-xl text-white text-xs sm:text-sm font-medium truncate max-w-[60%]">
  {selectedTemplate?.name}
</div>

<div className="absolute top-2 right-2 sm:top-4 sm:right-4 px-2 py-1 sm:px-4 sm:py-2 bg-black/70 backdrop-blur-sm rounded-lg sm:rounded-xl text-white text-[10px] sm:text-xs font-mono">
  1080 × 1440
</div>
```

**DENGAN:**
```tsx
<Badge className="absolute top-2 left-2 sm:top-4 sm:left-4">
  {selectedTemplate?.name}
</Badge>

<Badge variant="secondary" className="absolute top-2 right-2 sm:top-4 sm:right-4">
  1080 × 1440
</Badge>
```

#### Change Button (Around line 495)
**GANTI:**
```tsx
<button
  onClick={() => {
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }}
  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg sm:rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
>
  <X className="w-4 h-4 sm:w-5 sm:h-5" />
  <span className="hidden xs:inline">Upload Poster Lain</span>
  <span className="xs:hidden">Ganti Poster</span>
</button>
```

**DENGAN:**
```tsx
<Button
  variant="outline"
  className="w-full"
  onClick={() => {
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }}
>
  <X className="mr-2 h-4 w-4" />
  Upload Poster Lain
</Button>
```

#### Separators (After each section)
**TAMBAHKAN:**
```tsx
<Separator />
```

#### Settings Card (Around line 520)
**GANTI:**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
    {/* Settings controls */}
  </div>
</div>
```

**DENGAN:**
```tsx
<Card>
  <CardContent className="p-4 sm:p-6 lg:p-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
      {/* Settings controls */}
    </div>
  </CardContent>
</Card>
```

#### Slider Controls (Around line 530-560)
**GANTI:**
```tsx
<div>
  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
    <label className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
      Padding (Jarak Tepi)
    </label>
    <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg sm:rounded-xl font-bold text-base sm:text-lg min-w-[60px] sm:min-w-[80px] text-center flex-shrink-0">
      {padding}%
    </div>
  </div>
  <input
    type="range"
    min="0"
    max="30"
    value={padding}
    onChange={(e) => setPadding(Number(e.target.value))}
    className="modern-slider w-full"
  />
  <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2">
    <span>Tidak ada</span>
    <span>Maximum</span>
  </div>
</div>
```

**DENGAN:**
```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <label className="text-sm font-semibold">Padding (Jarak Tepi)</label>
    <Badge variant="secondary" className="ml-2">{padding}%</Badge>
  </div>
  <Slider
    value={[padding]}
    onValueChange={([value]) => setPadding(value)}
    min={0}
    max={30}
    step={1}
    className="w-full"
  />
  <div className="flex justify-between text-xs text-muted-foreground">
    <span>Tidak ada</span>
    <span>Maximum</span>
  </div>
</div>
```

#### Download Section (Around line 600)
**GANTI:**
```tsx
<div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-6 sm:p-8 text-center">
  <div className="mb-4 sm:mb-6">
    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
      Poster Siap Download! 🎉
    </h2>
    <p className="text-sm sm:text-base text-blue-100 px-4">
      Klik tombol di bawah untuk download poster Anda
    </p>
  </div>

  <button
    onClick={handleExport}
    disabled={isExporting}
    className="group relative px-6 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 bg-white text-blue-600 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg lg:text-xl shadow-xl sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center gap-2 sm:gap-3"
  >
    {/* Button content */}
  </button>

  <p className="text-xs sm:text-sm text-blue-100 mt-3 sm:mt-4 px-4">
    Format: PNG • Ukuran: 1080 × 1440 pixels • High Quality
  </p>
</div>
```

**DENGAN:**
```tsx
<Card className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 border-0 text-white">
  <CardHeader className="text-center pb-4">
    <CardTitle className="text-2xl sm:text-3xl">Poster Siap Download! 🎉</CardTitle>
    <CardDescription className="text-blue-100">
      Klik tombol di bawah untuk download poster Anda
    </CardDescription>
  </CardHeader>
  <CardContent className="flex justify-center">
    <Button
      onClick={handleExport}
      disabled={isExporting}
      size="lg"
      variant="secondary"
      className="font-bold text-lg shadow-xl"
    >
      {isExporting ? (
        <>
          <div className="w-5 h-5 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-5 w-5" />
          Download Poster PNG
        </>
      )}
    </Button>
  </CardContent>
  <CardFooter className="justify-center text-sm text-blue-100">
    Format: PNG • Ukuran: 1080 × 1440 pixels • High Quality
  </CardFooter>
</Card>
```

## 🎨 Styling Changes

### Remove Custom Styles
**HAPUS** section `<style jsx>` di bagian bawah file karena sudah diganti dengan shadcn Slider component.

## ✅ Benefits shadcn/ui

1. **Konsisten** - Semua komponen mengikuti design system yang sama
2. **Accessible** - Built-in accessibility features (ARIA labels, keyboard navigation)
3. **Customizable** - Mudah di-customize dengan Tailwind classes
4. **Type-safe** - Full TypeScript support
5. **Dark Mode** - Otomatis support dark mode
6. **Responsive** - Mobile-first design
7. **Maintainable** - Lebih mudah maintenance
8. **Professional** - Tampilan yang lebih modern dan professional

## 🚀 Testing

Setelah migrasi, test:
- ✅ Theme toggle
- ✅ Template selection
- ✅ File upload
- ✅ Slider controls
- ✅ Export functionality
- ✅ Responsive design
- ✅ Dark mode
- ✅ Accessibility (keyboard navigation)

## 📚 Documentation

- shadcn/ui: https://ui.shadcn.com/
- Button: https://ui.shadcn.com/docs/components/button
- Card: https://ui.shadcn.com/docs/components/card
- Dialog: https://ui.shadcn.com/docs/components/dialog
- Badge: https://ui.shadcn.com/docs/components/badge
- Slider: https://ui.shadcn.com/docs/components/slider

## 💡 Tips

1. Gunakan `variant` prop untuk styling berbeda (default, outline, ghost, etc)
2. Gunakan `size` prop untuk ukuran berbeda (default, sm, lg, icon)
3. Gunakan `className` untuk custom styling tambahan
4. Semua komponen support dark mode otomatis
5. Gunakan `muted-foreground` untuk text sekunder
6. Gunakan `Card` dengan sub-components untuk struktur yang jelas

Selamat migrasi! 🎉

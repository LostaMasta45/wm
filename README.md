# Poster Composer Web

Sistem otomatis untuk menghasilkan poster lowongan kerja berformat 3:4 dengan branding konsisten.

## 🚀 Features

- **Automated Poster Generation**: Upload poster asli → output branded poster dalam format 3:4, 9:16 (Story), atau A4 PDF
- **Brand Preset System**: Template konfigurasi untuk setiap brand (background, watermark, footer)
- **Real-time Preview**: Canvas preview di browser dengan update langsung
- **Multi-brand Support**: Kelola berbagai brand dalam satu platform
- **Batch Export**: Render banyak poster sekaligus
- **Audit Logging**: Track semua aktivitas admin

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes (Serverless)
- **Database**: PostgreSQL (via Supabase/Prisma)
- **Storage**: Supabase Storage / Cloudflare R2
- **Image Processing**: Sharp (server-side), Canvas API (client-side preview)
- **Authentication**: Supabase Auth
- **Validation**: Zod

## 📋 Prerequisites

- Node.js 18+ atau 20+
- npm atau yarn
- PostgreSQL database (Supabase recommended)
- Supabase project untuk storage dan auth

## 🔧 Setup Instructions

### 1. Install Dependencies

Proyek sudah berada di direktori root.

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env.local` dan isi dengan kredensial Anda:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/poster_composer"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_BUCKET="posters"
```

### 3. Setup Database dengan Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database (development)
npx prisma db push

# Atau jalankan migration (production)
npx prisma migrate dev --name init
```

### 4. Setup Supabase Storage

1. Buat bucket baru di Supabase Dashboard: `posters`
2. Set bucket sebagai **public** (untuk akses URL hasil)
3. (Optional) Setup RLS policies sesuai kebutuhan

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
poster-composer/
├── app/
│   ├── api/              # API Routes
│   │   ├── upload/       # Upload poster & assets
│   │   ├── presets/      # Preset CRUD
│   │   ├── render/       # Render engine endpoint
│   │   ├── batch/        # Batch processing
│   │   ├── brands/       # Brand management
│   │   └── outputs/      # Output results
│   ├── dashboard/        # Admin dashboard UI
│   └── page.tsx          # Landing page
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── supabaseClient.ts # Supabase helpers
│   ├── presetSchema.ts   # Zod validation schemas
│   ├── coverContain.ts   # Image positioning algorithms
│   ├── tileWatermark.ts  # Watermark tiling logic
│   └── utils.ts          # Utility functions
├── components/
│   └── ui/               # shadcn/ui components
├── prisma/
│   └── schema.prisma     # Database schema
├── assets/               # Default assets (bg, wm, logo)
└── public/               # Static files
```

## 🎨 Usage

### 1. Create a Brand

```typescript
// POST /api/brands
{
  "name": "Loker Tuban",
  "slug": "loker-tuban",
  "ownerUserId": "user-uuid"
}
```

### 2. Upload Assets (Background, Watermark)

```typescript
// POST /api/upload
FormData {
  file: File,
  type: "bg" | "wm" | "logo",
  brand_id: "brand-uuid"
}
```

### 3. Create Preset

```typescript
// POST /api/presets
{
  "brand_id": "brand-uuid",
  "name": "Feed 3:4",
  "is_default": true,
  "settings": {
    // See lib/presetSchema.ts for full schema
  }
}
```

### 4. Upload Poster & Render

```typescript
// POST /api/render
{
  "brand_id": "brand-uuid",
  "preset_id": "preset-uuid",
  "poster_url": "https://cdn.supabase.co/.../poster.jpg",
  "size_tag": "3x4_1080x1440"
}
```

## 🧪 Development Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Prisma commands
npx prisma studio    # Open Prisma Studio (DB GUI)
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema to database
npx prisma migrate   # Create and run migrations
```

## 🔐 Authentication

Default menggunakan Supabase Auth. Setup:

1. Enable Email/Password authentication di Supabase Dashboard
2. (Optional) Enable OAuth providers (Google, GitHub, dll)
3. Configure redirect URLs: `http://localhost:3000/auth/callback`

## 🚀 Deployment

### Vercel (Recommended)

1. Push ke GitHub
2. Import project di Vercel Dashboard
3. Set environment variables di Project Settings
4. Deploy otomatis dari `main` branch

### Database Setup for Production

1. Use Supabase Postgres (recommended)
2. Or setup your own PostgreSQL instance
3. Run migrations: `npx prisma migrate deploy`

## 📚 Documentation

Lihat folder dokumen spesifikasi lengkap:
- `01-architecture.md` - System architecture overview
- `02-database-schema.md` - Database schema & models
- `03-render-engine.md` - Render engine specifications
- `04-frontend-ui-ux.md` - Frontend design guide
- `05-preset-system.md` - Preset configuration system
- `06-api-routes.md` - API endpoints documentation
- `07-deployment-workflow.md` - Deployment guide

## 🤝 Contributing

This is a private project. For access, contact the project owner.

## 📝 License

Proprietary - All rights reserved

## 🐛 Troubleshooting

### Sharp Installation Issues

```bash
npm install --platform=win32 --arch=x64 sharp
```

### Prisma Client Not Found

```bash
npx prisma generate
```

### Supabase Connection Issues

Check your environment variables and ensure:
- Database URL is correct
- Supabase keys are valid
- Network allows connection to Supabase

---

**Built with ❤️ for efficient poster production**

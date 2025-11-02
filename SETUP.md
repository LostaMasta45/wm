# Poster Composer - Setup Guide

## ✅ Initialization Complete!

Proyek telah berhasil diinisialisasi dengan struktur lengkap sesuai spesifikasi.

## 📁 Project Structure

```
WM/ (root directory)
├── app/
│   ├── api/
│   │   ├── brands/route.ts         ✅ Brand CRUD
│   │   ├── presets/route.ts        ✅ Preset list & create
│   │   ├── presets/[id]/route.ts   ✅ Preset detail, update, delete
│   │   ├── upload/                 ⏳ TODO
│   │   ├── render/                 ⏳ TODO
│   │   ├── batch/                  ⏳ TODO
│   │   └── outputs/                ⏳ TODO
│   ├── dashboard/page.tsx          ✅ Dashboard UI skeleton
│   └── page.tsx                    ✅ Landing page
├── lib/
│   ├── prisma.ts                   ✅ Prisma client singleton
│   ├── supabaseClient.ts           ✅ Supabase helpers
│   ├── presetSchema.ts             ✅ Zod validation schemas
│   ├── coverContain.ts             ✅ Image positioning algorithms
│   ├── tileWatermark.ts            ✅ Watermark tiling logic
│   └── utils.ts                    ✅ Utility functions
├── prisma/
│   └── schema.prisma               ✅ Complete database schema
├── components/
│   └── ui/                         ✅ Ready for shadcn components
├── assets/                         ✅ For default brand assets
├── .env.example                    ✅ Environment template
├── next.config.ts                  ✅ Configured for Sharp & images
├── package.json                    ✅ With Prisma scripts
└── README.md                       ✅ Complete documentation
```

## 🚀 Next Steps

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local dengan kredensial Anda
```

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_BUCKET` - Storage bucket name (e.g., "posters")

### 2. Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database (development)
npm run prisma:push

# Or create migration (production)
npm run prisma:migrate
```

### 3. Setup Supabase Storage

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `posters`
3. Set bucket as **public** for CDN access
4. (Optional) Configure RLS policies

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 🧪 Testing API Endpoints

### Create a Brand

```bash
curl -X POST http://localhost:3000/api/brands \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Loker Tuban",
    "slug": "loker-tuban",
    "ownerUserId": "user-uuid-here"
  }'
```

### Create a Preset

```bash
curl -X POST http://localhost:3000/api/presets \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand-uuid",
    "name": "Feed 3:4",
    "isDefault": true,
    "createdBy": "user-uuid",
    "settings": {
      "canvas": { "ratio": "3:4", "width": 1080, "height": 1440, "backgroundColor": "#FFFFFF" },
      "background": { "mode": "cover", "blur": 0, "tint": { "color": "#000000", "opacity": 0 } },
      "poster": { "paddingPct": 0, "shadow": { "enabled": true, "blur": 20, "opacity": 0.2, "y": 4 }, "border": { "enabled": false, "width": 2, "color": "#FFFFFF", "radius": 0 }, "minScale": 0.2, "maxFill": false },
      "watermark": { "mode": "full", "opacity": 0.12, "containScale": 0.8, "tile": { "angleDeg": 30, "gap": 160, "scale": 0.6 } },
      "footer": { "enabled": true, "text": "Tidak dipungut biaya apapun.", "font": { "family": "Inter", "weight": 600, "sizePx": 28, "tracking": 0 }, "color": "#111111", "safePaddingPx": 32, "logoAssetId": null, "align": "center" },
      "exports": [{ "tag": "3x4_1080x1440", "w": 1080, "h": 1440, "format": "png", "quality": 92 }]
    }
  }'
```

### Get All Brands

```bash
curl http://localhost:3000/api/brands
```

### Get Presets by Brand Slug

```bash
curl http://localhost:3000/api/presets?slug=loker-tuban
```

## 📝 What's Implemented

✅ **Core Infrastructure**
- Next.js 15 with App Router
- TypeScript configuration
- Tailwind CSS 4
- Prisma ORM with complete schema
- Supabase client setup

✅ **Database Models**
- Brand, Asset, Preset, Project, Poster
- Composition, Output, AuditLog
- Complete relationships and indexes

✅ **Validation & Types**
- Zod schemas for preset settings
- TypeScript types for all models
- Deep merge for preset overrides

✅ **Algorithms**
- Cover/Contain positioning
- Tile watermark calculations
- Scale and dimension utilities

✅ **API Routes**
- Brand CRUD (GET, POST)
- Preset CRUD (GET, POST, PATCH, DELETE)
- Error handling and validation

✅ **UI Pages**
- Landing page with features
- Dashboard skeleton

## ⏳ TODO (Implementation Priority)

### High Priority
1. **Upload API** (`/api/upload/route.ts`)
   - File upload to Supabase Storage
   - Image validation and metadata extraction
   - Asset registration in database

2. **Render Engine** (`/api/render/route.ts`)
   - Sharp-based server-side rendering
   - Background compositing (cover mode)
   - Poster positioning (contain mode)
   - Watermark overlay (full/contain/tile)
   - Footer text rendering
   - Export to PNG/JPG/PDF

3. **Dashboard Components**
   - Preset selector dropdown
   - File uploader with drag & drop
   - Canvas preview component
   - Control panel tabs
   - Export buttons

### Medium Priority
4. **Batch Processing** (`/api/batch/route.ts`)
   - Queue system integration
   - Multi-poster rendering
   - ZIP export

5. **Output Management** (`/api/outputs/route.ts`)
   - List recent outputs
   - Download management
   - Caching

### Low Priority
6. **Authentication**
   - Supabase Auth integration
   - Protected routes
   - Role-based access

7. **Advanced Features**
   - AI caption generator
   - Telegram/WhatsApp bot
   - Invisible watermark

## 🔧 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Push schema (dev)
npm run prisma:migrate   # Create migration (prod)
npm run prisma:studio    # Open DB GUI

# Code Quality
npm run lint             # Run ESLint
```

## 📖 Documentation References

- `01-architecture.md` - System architecture
- `02-database-schema.md` - Database design
- `03-render-engine.md` - Rendering specifications
- `04-frontend-ui-ux.md` - UI/UX guidelines
- `05-preset-system.md` - Preset configuration
- `06-api-routes.md` - API documentation
- `07-deployment-workflow.md` - Deployment guide

## 🐛 Common Issues

### Sharp Installation
```bash
npm install --platform=win32 --arch=x64 sharp
```

### Prisma Client Not Found
```bash
npx prisma generate
```

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

---

**Status: ✅ Core infrastructure ready for development**

Next: Implement render engine and upload functionality

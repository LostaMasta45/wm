# Dokumentasi Spesifikasi

Folder ini berisi dokumen spesifikasi lengkap untuk Poster Composer Web.

## 📚 Daftar Dokumen

1. **[01-architecture.md](../01-architecture.md)** - System Architecture Overview
   - Tujuan utama sistem
   - Komponen utama
   - Alur kerja user
   - Stack teknis

2. **[02-database-schema.md](../02-database-schema.md)** - Database Schema & Models
   - ERD (Entity Relationship Diagram)
   - Tabel dan kolom lengkap
   - Prisma model
   - Storage path structure

3. **[03-render-engine.md](../03-render-engine.md)** - Render Engine Specifications
   - Algoritma positioning (cover/contain)
   - Watermark modes (full/contain/tile)
   - Sharp rendering pipeline
   - Export formats

4. **[04-frontend-ui-ux.md](../04-frontend-ui-ux.md)** - Frontend UI/UX Design
   - Layout structure
   - Component design
   - Control panels
   - Hotkeys & interactions

5. **[05-preset-system.md](../05-preset-system.md)** - Preset Configuration System
   - JSON schema structure
   - Preset storage & management
   - Override mechanism
   - Validation rules

6. **[06-api-routes.md](../06-api-routes.md)** - API Endpoints Documentation
   - Upload API
   - Preset CRUD
   - Render endpoint
   - Batch processing
   - Response formats

7. **[07-deployment-workflow.md](../07-deployment-workflow.md)** - Deployment Guide
   - Infrastructure setup
   - Environment variables
   - CI/CD pipeline
   - Vercel deployment
   - Performance optimization

## 🔗 Quick Links

- [Back to Main README](../README.md)
- [Setup Guide](../SETUP.md)
- [Project Status](../PROJECT_STATUS.md)

## 📖 How to Use These Docs

1. **For Developers**: Start with `01-architecture.md` untuk memahami big picture
2. **For Database Setup**: Refer to `02-database-schema.md`
3. **For Render Implementation**: Study `03-render-engine.md` carefully
4. **For UI Development**: Follow guidelines in `04-frontend-ui-ux.md`
5. **For API Development**: Reference `06-api-routes.md`
6. **For Deployment**: Follow steps in `07-deployment-workflow.md`

---

**Note:** Semua spesifikasi ini adalah sumber kebenaran (source of truth) untuk implementasi proyek.

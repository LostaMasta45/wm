-- Safe version: Can run multiple times without errors
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lmkejerwmuayyfeeikuc/editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_brands_slug;
DROP INDEX IF EXISTS idx_brands_owner;
DROP INDEX IF EXISTS idx_assets_brand_type;
DROP INDEX IF EXISTS idx_presets_brand;
DROP INDEX IF EXISTS idx_projects_brand;
DROP INDEX IF EXISTS idx_posters_brand_project;
DROP INDEX IF EXISTS idx_compositions_poster_preset;
DROP INDEX IF EXISTS idx_compositions_status;
DROP INDEX IF EXISTS idx_outputs_composition;
DROP INDEX IF EXISTS idx_audit_logs_brand_time;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
DROP TRIGGER IF EXISTS update_presets_updated_at ON presets;
DROP TRIGGER IF EXISTS update_compositions_updated_at ON compositions;

-- Drop existing function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create tables (IF NOT EXISTS protects from errors)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id UUID NOT NULL,
  default_preset_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bg', 'wm', 'logo')),
  file_url TEXT NOT NULL,
  meta JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  settings JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  meta JSONB,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  poster_id UUID NOT NULL REFERENCES posters(id) ON DELETE CASCADE,
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE RESTRICT,
  overrides JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'rendering', 'done', 'failed')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  composition_id UUID NOT NULL REFERENCES compositions(id) ON DELETE CASCADE,
  size_tag TEXT NOT NULL,
  file_url TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('png', 'jpg', 'pdf')),
  checksum TEXT,
  bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(composition_id, size_tag)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  subject_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes (after dropping old ones, no conflicts)
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_owner ON brands(owner_user_id);
CREATE INDEX idx_assets_brand_type ON assets(brand_id, type);
CREATE INDEX idx_presets_brand ON presets(brand_id);
CREATE INDEX idx_projects_brand ON projects(brand_id);
CREATE INDEX idx_posters_brand_project ON posters(brand_id, project_id);
CREATE INDEX idx_compositions_poster_preset ON compositions(poster_id, preset_id);
CREATE INDEX idx_compositions_status ON compositions(status);
CREATE INDEX idx_outputs_composition ON outputs(composition_id);
CREATE INDEX idx_audit_logs_brand_time ON audit_logs(brand_id, created_at);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON presets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_compositions_updated_at BEFORE UPDATE ON compositions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE posters ENABLE ROW LEVEL SECURITY;
ALTER TABLE compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can do everything" ON brands;
DROP POLICY IF EXISTS "Service role can do everything" ON assets;
DROP POLICY IF EXISTS "Service role can do everything" ON presets;
DROP POLICY IF EXISTS "Service role can do everything" ON projects;
DROP POLICY IF EXISTS "Service role can do everything" ON posters;
DROP POLICY IF EXISTS "Service role can do everything" ON compositions;
DROP POLICY IF EXISTS "Service role can do everything" ON outputs;
DROP POLICY IF EXISTS "Service role can do everything" ON audit_logs;

-- Create RLS policies (allow service role full access)
CREATE POLICY "Service role can do everything" ON brands FOR ALL USING (true);
CREATE POLICY "Service role can do everything" ON assets FOR ALL USING (true);
CREATE POLICY "Service role can do everything" ON presets FOR ALL USING (true);
CREATE POLICY "Service role can do everything" ON projects FOR ALL USING (true);
CREATE POLICY "Service role can do everything" ON posters FOR ALL USING (true);
CREATE POLICY "Service role can do everything" ON compositions FOR ALL USING (true);
CREATE POLICY "Service role can do everything" ON outputs FOR ALL USING (true);
CREATE POLICY "Service role can do everything" ON audit_logs FOR ALL USING (true);

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ All tables, indexes, triggers, and policies created successfully!';
END $$;

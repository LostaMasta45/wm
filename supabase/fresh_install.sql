-- FRESH INSTALL - Run this for clean setup
-- This will DROP all tables and recreate them

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all tables in correct order (handle foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS outputs CASCADE;
DROP TABLE IF EXISTS compositions CASCADE;
DROP TABLE IF EXISTS posters CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS presets CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS brands CASCADE;

-- Brands table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id TEXT NOT NULL,
  default_preset_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bg', 'wm', 'logo')),
  file_url TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Presets/Templates table
CREATE TABLE presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posters table
CREATE TABLE posters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compositions table
CREATE TABLE compositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  poster_id UUID NOT NULL REFERENCES posters(id) ON DELETE CASCADE,
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE RESTRICT,
  overrides JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'rendering', 'done', 'failed')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outputs table
CREATE TABLE outputs (
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

-- Audit logs table
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  subject_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_assets_brand_type ON assets(brand_id, type);
CREATE INDEX idx_presets_brand ON presets(brand_id);
CREATE INDEX idx_presets_brand_default ON presets(brand_id, is_default);
CREATE INDEX idx_projects_brand ON projects(brand_id);
CREATE INDEX idx_posters_brand_project ON posters(brand_id, project_id);
CREATE INDEX idx_compositions_poster_preset ON compositions(poster_id, preset_id);
CREATE INDEX idx_compositions_status ON compositions(status);
CREATE INDEX idx_outputs_composition ON outputs(composition_id);
CREATE INDEX idx_audit_logs_brand_created ON audit_logs(brand_id, created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_presets_updated_at ON presets;
CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compositions_updated_at ON compositions;
CREATE TRIGGER update_compositions_updated_at BEFORE UPDATE ON compositions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default brand
INSERT INTO brands (name, slug, owner_user_id)
VALUES ('Default Brand', 'default', 'system');

-- Verify
SELECT 'Setup complete!' as status;
SELECT * FROM brands WHERE slug = 'default';

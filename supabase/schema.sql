-- Poster Composer Database Schema for Supabase
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brands table
DROP TABLE IF EXISTS brands CASCADE;
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
DROP TABLE IF EXISTS assets CASCADE;
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
DROP TABLE IF EXISTS presets CASCADE;
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
DROP TABLE IF EXISTS projects CASCADE;
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posters table
DROP TABLE IF EXISTS posters CASCADE;
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
DROP TABLE IF EXISTS compositions CASCADE;
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
DROP TABLE IF EXISTS outputs CASCADE;
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
DROP TABLE IF EXISTS audit_logs CASCADE;
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
CREATE INDEX IF NOT EXISTS idx_assets_brand_type ON assets(brand_id, type);
CREATE INDEX IF NOT EXISTS idx_presets_brand ON presets(brand_id);
CREATE INDEX IF NOT EXISTS idx_presets_brand_default ON presets(brand_id, is_default);
CREATE INDEX IF NOT EXISTS idx_projects_brand ON projects(brand_id);
CREATE INDEX IF NOT EXISTS idx_posters_brand_project ON posters(brand_id, project_id);
CREATE INDEX IF NOT EXISTS idx_compositions_poster_preset ON compositions(poster_id, preset_id);
CREATE INDEX IF NOT EXISTS idx_compositions_status ON compositions(status);
CREATE INDEX IF NOT EXISTS idx_outputs_composition ON outputs(composition_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_brand_created ON audit_logs(brand_id, created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_presets_updated_at ON presets;
CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compositions_updated_at ON compositions;
CREATE TRIGGER update_compositions_updated_at BEFORE UPDATE ON compositions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default brand (optional)
INSERT INTO brands (name, slug, owner_user_id)
VALUES ('Default Brand', 'default', 'system')
ON CONFLICT (slug) DO NOTHING;

-- Row Level Security (RLS) - Optional, uncomment if needed
-- ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE posters ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE compositions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE outputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all for now (adjust based on your needs)
-- CREATE POLICY "Allow all access to brands" ON brands FOR ALL USING (true);
-- CREATE POLICY "Allow all access to presets" ON presets FOR ALL USING (true);
-- CREATE POLICY "Allow all access to assets" ON assets FOR ALL USING (true);

COMMENT ON TABLE brands IS 'Brand/organization records';
COMMENT ON TABLE presets IS 'Template presets with settings (backgrounds, watermarks, etc)';
COMMENT ON TABLE assets IS 'Uploaded assets (backgrounds, watermarks, logos)';
COMMENT ON TABLE projects IS 'Project groupings for posters';
COMMENT ON TABLE posters IS 'Uploaded poster images';
COMMENT ON TABLE compositions IS 'Rendered compositions combining posters with presets';
COMMENT ON TABLE outputs IS 'Final exported outputs in various formats';
COMMENT ON TABLE audit_logs IS 'Audit trail for all actions';

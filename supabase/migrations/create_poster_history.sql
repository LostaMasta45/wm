-- Create poster_history table
CREATE TABLE IF NOT EXISTS poster_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template info
  template_id VARCHAR(255) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  brand_slug VARCHAR(255) NOT NULL,
  
  -- Poster data
  poster_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Settings used
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: {"padding": 15, "watermarkOpacity": 50, "watermarkSize": 87, "aspectRatio": "3:4"}
  
  -- Export info
  dimensions VARCHAR(50), -- e.g., "1080 × 1440"
  file_size VARCHAR(50),  -- e.g., "2.5 MB"
  format VARCHAR(10) DEFAULT 'png',
  
  -- User info (optional for future auth)
  user_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_poster_history_created_at ON poster_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poster_history_user_id ON poster_history(user_id);
CREATE INDEX IF NOT EXISTS idx_poster_history_template ON poster_history(template_id);
CREATE INDEX IF NOT EXISTS idx_poster_history_brand ON poster_history(brand_slug);

-- Enable Row Level Security (RLS)
ALTER TABLE poster_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict later with auth)
CREATE POLICY "Allow all operations on poster_history" ON poster_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_poster_history_updated_at
  BEFORE UPDATE ON poster_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE poster_history IS 'Stores history of generated/exported posters with all settings used';

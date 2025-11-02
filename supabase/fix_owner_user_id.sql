-- Fix owner_user_id column type from UUID to TEXT
-- Run this ONLY if you get error: invalid input syntax for type uuid: "system"

-- Step 1: Drop existing default brand if exists (with CASCADE to remove dependent rows)
DELETE FROM brands WHERE slug = 'default';

-- Step 2: Alter column type if table exists
DO $$ 
BEGIN
  -- Check if column is UUID type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'brands' 
    AND column_name = 'owner_user_id' 
    AND data_type = 'uuid'
  ) THEN
    -- Change from UUID to TEXT
    ALTER TABLE brands ALTER COLUMN owner_user_id TYPE TEXT;
    RAISE NOTICE 'Changed owner_user_id from UUID to TEXT';
  ELSE
    RAISE NOTICE 'Column owner_user_id is already TEXT or table does not exist';
  END IF;
END $$;

-- Step 3: Insert default brand
INSERT INTO brands (name, slug, owner_user_id)
VALUES ('Default Brand', 'default', 'system')
ON CONFLICT (slug) DO NOTHING;

-- Verify
SELECT id, name, slug, owner_user_id FROM brands WHERE slug = 'default';

import { createClient } from '@supabase/supabase-js';

// Environment variables with fallback for build time
// Use dummy values during build if not set - will fail at runtime if actually used
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Client for browser/frontend (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database types (manually defined - no Prisma needed)
export type Brand = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  default_preset_id?: string;
  created_at: string;
  updated_at: string;
};

export type Asset = {
  id: string;
  brand_id: string;
  type: 'bg' | 'wm' | 'logo';
  file_url: string;
  meta: any;
  created_by: string;
  created_at: string;
};

export type Preset = {
  id: string;
  brand_id: string;
  name: string;
  is_default: boolean;
  settings: any;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Poster = {
  id: string;
  brand_id: string;
  project_id?: string;
  file_url: string;
  meta: any;
  uploaded_by: string;
  created_at: string;
};

export type Composition = {
  id: string;
  brand_id: string;
  poster_id: string;
  preset_id: string;
  overrides: any;
  status: 'draft' | 'rendering' | 'done' | 'failed';
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Output = {
  id: string;
  composition_id: string;
  size_tag: string;
  file_url: string;
  format: 'png' | 'jpg' | 'pdf';
  checksum?: string;
  bytes?: number;
  created_at: string;
};

export type PosterHistory = {
  id: string;
  template_id: string;
  template_name: string;
  brand_slug: string;
  poster_url: string;
  thumbnail_url?: string;
  settings: {
    padding: number;
    watermarkOpacity: number;
    watermarkSize: number;
    aspectRatio: '3:4' | '4:5';
    backgroundColor?: string;
  };
  dimensions?: string;
  file_size?: string;
  format?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
};

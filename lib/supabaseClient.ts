import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser usage (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Storage helper functions
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File | Buffer,
  options?: { contentType?: string; cacheControl?: string }
) => {
  const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    cacheControl: options?.cacheControl || '3600',
    upsert: false,
  });

  if (error) throw error;
  return data;
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) throw error;
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Create a supabase client (or a dummy one if not configured)
// This allows the backend to run without Supabase when using mobile backend MongoDB directly
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://dummy.supabase.co', 'dummy-key');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);


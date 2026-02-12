import { createClient } from '@supabase/supabase-js';

// Access environment variables with import.meta.env (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('❌ CRITICAL: Supabase environment variables are missing (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

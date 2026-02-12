import { createClient } from '@supabase/supabase-js';

// Access environment variables with import.meta.env (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xbfzrmpuagcbqchohohm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZnpybXB1YWdjYnFjaG9ob2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MjYzOTcsImV4cCI6MjA4NjAwMjM5N30.8iVnF9e4F1J3_IdQk4-DshdE6hXn33_kE8wGkC-L4I8';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials using Pablo defaults. Set VITE_SUPABASE_URL for other environments.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

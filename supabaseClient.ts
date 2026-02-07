import { createClient } from '@supabase/supabase-js';

// Access environment variables with import.meta.env (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xbfzrmpuagcbqchohohm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZnpybXB1YWdjYnFjaG9ob2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MjYzOTcsImV4cCI6MjA4NjAwMjM5N30.2ybYG9vHK2M2QUGKQIWMf2lLR-gkeK-GgxKNUCup9i4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

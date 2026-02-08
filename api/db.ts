import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials in .env');
}

/**
 * Admin Client (Service Role)
 * Used for background tasks (CRON) or operations where we explicitly control 
 * the user context via filters.
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Helper to get a client scoped to a specific user using their Access Token.
 * This ensures RLS policies are applied automatically.
 */
export const getSupabaseUserClient = (accessToken: string) => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // We still use the key to init, but...
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}` // ... we override Auth header to impersonate the user
        }
      }
    }
  );
};

export default supabaseAdmin;

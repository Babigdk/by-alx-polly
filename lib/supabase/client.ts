import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase Browser Client Module
 * 
 * This module provides a function to create a Supabase client for browser environments.
 * It's used for client-side interactions with the Supabase backend.
 */

/**
 * Creates a Supabase client for browser environments
 * 
 * @returns A configured Supabase client instance for browser usage
 * 
 * This function initializes a Supabase client using environment variables
 * for the Supabase URL and anonymous key. It's designed for client-side
 * components that need to interact with Supabase.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

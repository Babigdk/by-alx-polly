import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase Server Client Module
 * 
 * This module provides a function to create a Supabase client for server environments.
 * It's used for server-side interactions with the Supabase backend, particularly
 * within Server Components and Server Actions.
 */

/**
 * Creates a Supabase client for server environments
 * 
 * @returns A configured Supabase client instance for server usage
 * 
 * This function initializes a Supabase client using environment variables
 * and configures it to work with Next.js cookies for session management.
 * It's designed for server-side components and actions that need to
 * interact with Supabase.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
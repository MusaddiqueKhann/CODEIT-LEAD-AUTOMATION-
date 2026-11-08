import { createClient } from '@supabase/supabase-js'

/**
 * The one Supabase client. Only files in src/data/ import it: pages and components reach the
 * server through those files, never directly.
 *
 * Both values come from .env.local (see README). The key is the public one (publishable / anon);
 * it can only do what row-level security and the server functions allow.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local')

export const supabase = createClient(url, key)

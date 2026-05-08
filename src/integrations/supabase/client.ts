import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseClient() {
  const getEnv = (key: string) => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
    if (typeof process !== 'undefined' && process.env?.[`VITE_${key}`]) return process.env[`VITE_${key}`];
    if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
    return undefined;
  };

  const SUPABASE_URL = getEnv('SUPABASE_URL');
  const SUPABASE_PUBLISHABLE_KEY = getEnv('SUPABASE_PUBLISHABLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

let _supabase: any;
export const supabase = new Proxy({} as any, {
  get(_, prop) {
    if (!_supabase) _supabase = createSupabaseClient();
    return _supabase[prop];
  }
});

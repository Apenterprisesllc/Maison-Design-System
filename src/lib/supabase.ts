import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';
import type { Database } from './types/db';

export const supabase = createClient<Database>(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibxuzodulxhrfzlbebuu.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_qBXoIxt8cNONTkNO9m3ycw_SfDbPznY';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}

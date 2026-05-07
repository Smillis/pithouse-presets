import { createClient } from '@supabase/supabase-js';

// Server-side client using service role key — only use in API routes, never in client components
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

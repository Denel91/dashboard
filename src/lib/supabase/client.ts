import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

/**
 * Client Supabase per il browser. Si usa solo per due cose (Fase 3, sezione 5):
 * l'accesso con Google e, dallo Sprint 6, il tempo reale.
 * Letture e scritture passano dal server.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

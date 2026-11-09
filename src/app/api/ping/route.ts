import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { richiestaAutorizzata } from '@/lib/ping';

/**
 * T-20: tiene sveglio il progetto Supabase. Supabase Free lo mette in pausa
 * dopo una settimana senza attività; il cron di Vercel (vercel.json) chiama
 * questa route una volta al giorno, e lei fa una query vera con ping().
 *
 * Niente sessione: client con la chiave publishable (ruolo anon). La route
 * non passa dal proxy (vedi il matcher in src/proxy.ts) e si protegge da
 * sola con CRON_SECRET, che Vercel manda come "Authorization: Bearer …".
 */
export async function GET(request: Request) {
  if (!richiestaAutorizzata(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return new Response('Non autorizzato', { status: 401 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase.rpc('ping');

  if (error || data !== true) {
    // Finisce nei log di Vercel e il cron risulta fallito
    console.error('[ping] il database non ha risposto', error?.code, error?.message);
    return Response.json({ ok: false }, { status: 503 });
  }

  return Response.json({ ok: true });
}

import { timingSafeEqual } from 'node:crypto';
import type { Database } from '@/lib/database.types';

// T-20: il cron di Vercel chiama /api/ping con l'intestazione
// "Authorization: Bearer <CRON_SECRET>". Senza segreto configurato, o con
// un segreto troppo corto, nessuno passa.

const LUNGHEZZA_MINIMA = 16;

/** Vero se l'intestazione Authorization porta esattamente il segreto del cron. */
export function richiestaAutorizzata(intestazione: string | null, segreto: string | undefined): boolean {
  if (!segreto || segreto.length < LUNGHEZZA_MINIMA || !intestazione) return false;

  const attesa = Buffer.from(`Bearer ${segreto}`);
  const ricevuta = Buffer.from(intestazione);
  // timingSafeEqual vuole lunghezze uguali; il confronto a tempo costante
  // evita di far indovinare il segreto un carattere alla volta
  return attesa.length === ricevuta.length && timingSafeEqual(attesa, ricevuta);
}

/**
 * Risposta del ping per un progetto Supabase (T-20, T-30): controlla il
 * segreto del cron, poi chiama ping() con la chiave publishable (ruolo anon,
 * nessuna sessione). 401 senza segreto giusto, 503 se il database non
 * risponde (il cron risulta fallito nei log di Vercel).
 */
export async function rispondiAlPing(
  request: Request,
  progetto: { nome: string; url: string | undefined; chiave: string | undefined },
): Promise<Response> {
  if (!richiestaAutorizzata(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return new Response('Non autorizzato', { status: 401 });
  }
  if (!progetto.url || !progetto.chiave) {
    console.error(`[ping] mancano URL o chiave del progetto ${progetto.nome}`);
    return Response.json({ ok: false }, { status: 503 });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient<Database>(progetto.url, progetto.chiave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc('ping');

  if (error || data !== true) {
    console.error(`[ping] il database ${progetto.nome} non ha risposto`, error?.code, error?.message);
    return Response.json({ ok: false }, { status: 503 });
  }
  return Response.json({ ok: true });
}

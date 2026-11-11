import { rispondiAlPing } from '@/lib/ping';

/**
 * T-20: tiene sveglio il progetto Supabase a cui punta questo deploy (in
 * produzione, quello di produzione). Supabase Free lo mette in pausa dopo
 * una settimana senza attività; il cron di Vercel (vercel.json) chiama
 * questa route una volta al giorno. Lo staging ha il suo ping
 * (/api/ping/staging, T-30). Niente sessione: la route non passa dal proxy
 * (matcher in src/proxy.ts) e si protegge con CRON_SECRET.
 */
export async function GET(request: Request) {
  return rispondiAlPing(request, {
    nome: 'di questo deploy',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    chiave: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

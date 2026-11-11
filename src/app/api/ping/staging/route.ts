import { rispondiAlPing } from '@/lib/ping';

/**
 * T-30: dalla Release 0.1 la produzione punta al suo progetto Supabase, e il
 * ping di /api/ping non sveglia più lo staging. Senza questo, lo staging
 * andrebbe in pausa dopo una settimana senza anteprime (T-20, nota in Fase 2).
 * Il cron di Vercel chiama questa route una volta al giorno, sul deploy di
 * produzione, con l'URL e la chiave publishable dello staging (variabili
 * STAGING_SUPABASE_URL e STAGING_SUPABASE_PUBLISHABLE_KEY, solo Production).
 */
export async function GET(request: Request) {
  return rispondiAlPing(request, {
    nome: 'staging',
    url: process.env.STAGING_SUPABASE_URL,
    chiave: process.env.STAGING_SUPABASE_PUBLISHABLE_KEY,
  });
}

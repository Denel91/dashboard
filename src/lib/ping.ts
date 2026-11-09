import { timingSafeEqual } from 'node:crypto';

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

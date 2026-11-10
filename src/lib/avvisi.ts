import type { Persona } from '@/lib/nucleo/corrente';

// Contenuto degli avvisi della pagina (tavole 19b F7, 19c F2, 20). Sta qui
// e non in components/ui/avviso.tsx, che è un file "use client": così lo
// possono costruire anche le Server Actions.

export type ContenutoAvviso = {
  /** Prima riga, in grassetto: "Spesa salvata". */
  testo: string;
  /** Seconda riga: "Esselunga · 47,30 € · Spesa". */
  dettaglio?: string;
  /** Terza riga, con l'iniziale di chi deve: "Simona ti deve 47,05 €". */
  saldo?: { testo: string; importo?: string; nome?: string; persona?: Persona };
  /** Spunta a sinistra, per le azioni riuscite (F7). */
  conferma?: boolean;
};

'use server';

import { z } from 'zod';
import type { ContenutoAvviso } from '@/lib/avvisi';
import { oggiIso } from '@/lib/date';
import { euroInCentesimi, formattaEuro } from '@/lib/money';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';
import { partiSaldo } from '@/lib/spese/testi';
import { createClient } from '@/lib/supabase/server';

// US-31, US-32, US-33: registrare e annullare un rimborso. I controlli che
// contano li fa il database (registra_rimborso e annulla_rimborso,
// migrazione 20261110180000_rimborsi.sql): chi dà e chi riceve, importo non
// oltre il saldo, saldo ancora quello visto, un'operazione alla volta per
// nucleo. Qui si controllano i campi per dare messaggi chiari.

export type StatoRimborso = {
  errori?: Record<string, string>;
  messaggio?: string;
  /** P0004: nel frattempo il saldo è cambiato; il foglio mostra quello nuovo (positivo = me lo devono). */
  saldoCambiato?: number;
  /** Registrato: l'avviso da mostrare dopo. */
  registrato?: { avviso: ContenutoAvviso };
};

export type EsitoAnnullamento = { avviso?: string | ContenutoAvviso; messaggio?: string };

const ERRORE_IMPREVISTO = 'Non sono riuscito a registrare il rimborso. Controlla la connessione e riprova.';

const schemaRimborso = z.object({
  importo: z
    .string()
    .transform((t) => euroInCentesimi(t))
    .refine((c): c is number => c !== null, 'Scrivi un importo valido, per esempio 23,40.')
    .refine((c) => c > 0, 'Scrivi un importo maggiore di zero.'),
  saldo_atteso: z.coerce.number().int(),
  nota: z.string().trim().max(200, 'Al massimo 200 caratteri.'),
});

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Nucleo = NonNullable<Awaited<ReturnType<typeof leggiNucleoCorrente>>>;

async function saldoMio(supabase: Supabase, nucleo: Nucleo): Promise<number | null> {
  const { data } = await supabase.from('saldi').select('saldo_centesimi').eq('membro_id', nucleo.io.id).maybeSingle();
  return data?.saldo_centesimi ?? null;
}

/** Terza riga degli avvisi: il saldo dopo l'operazione, con l'iniziale di chi deve (come F7). */
function rigaSaldo(saldo: number | null, nucleo: Nucleo) {
  const altra = nucleo.membri.find((m) => !m.sonoIo);
  return saldo === null || !altra ? undefined : partiSaldo(saldo, { io: nucleo.io, altra });
}

/** "Segna come saldato" (US-31) e rimborso parziale (US-32), dal foglio della tavola 08b. */
export async function registraRimborso(_prima: StatoRimborso, dati: FormData): Promise<StatoRimborso> {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) return { messaggio: ERRORE_IMPREVISTO };

  const campi = schemaRimborso.safeParse({
    importo: dati.get('importo') ?? '',
    saldo_atteso: dati.get('saldo_atteso') ?? '',
    nota: dati.get('nota') ?? '',
  });
  if (!campi.success) {
    const errori: Record<string, string> = {};
    for (const p of campi.error.issues) errori[String(p.path[0])] ??= p.message;
    if (errori.saldo_atteso) return { messaggio: ERRORE_IMPREVISTO };
    return { errori };
  }
  const { importo, saldo_atteso, nota } = campi.data;
  // Stesso controllo del database, per l'errore sotto il campo
  if (importo > Math.abs(saldo_atteso)) return { errori: { importo: `Al massimo ${formattaEuro(Math.abs(saldo_atteso))}, il saldo attuale.` } };

  const supabase = await createClient();
  const { error } = await supabase.rpc('registra_rimborso', {
    p_nucleo_id: nucleo.id,
    p_importo_centesimi: importo,
    p_saldo_atteso_centesimi: saldo_atteso,
    p_data_rimborso: oggiIso(new Date()),
    p_nota: nota || undefined,
  });
  if (error) {
    switch (error.code) {
      case 'P0004':
      case 'P0005': {
        // Nel frattempo è cambiato qualcosa (per esempio l'altra persona ha
        // appena segnato come saldato): il foglio mostra il saldo nuovo
        const nuovo = await saldoMio(supabase, nucleo);
        return nuovo === null ? { messaggio: ERRORE_IMPREVISTO } : { saldoCambiato: nuovo };
      }
      case 'P0006':
        return { errori: { importo: 'L’importo non può superare il saldo.' } };
      case 'P0007':
        return { messaggio: 'Nel nucleo non c’è ancora l’altra persona.' };
      default:
        console.error('[rimborsi] registrazione non riuscita', error.code, error.message);
        return { messaggio: ERRORE_IMPREVISTO };
    }
  }

  const altra = nucleo.membri.find((m) => !m.sonoIo);
  const [da, a] = saldo_atteso > 0 ? [altra?.nome, nucleo.io.nome] : [nucleo.io.nome, altra?.nome];
  return {
    registrato: {
      avviso: {
        testo: importo === Math.abs(saldo_atteso) ? 'Saldato' : 'Rimborso registrato',
        dettaglio: [`${da} → ${a}`, formattaEuro(importo), nota || null].filter(Boolean).join(' · '),
        conferma: true,
        saldo: rigaSaldo(await saldoMio(supabase, nucleo), nucleo),
      },
    },
  };
}

/** Annulla un rimborso (US-33), dopo la conferma F5 della tavola 19e. */
export async function annullaRimborso(id: string): Promise<EsitoAnnullamento> {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo || !z.uuid().safeParse(id).success) return { messaggio: 'Non sono riuscito ad annullare il rimborso. Riprova.' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('annulla_rimborso', { p_rimborso_id: id });
  if (error) {
    if (error.code === 'P0008') return { avviso: 'Questo rimborso non c’è più' };
    console.error('[rimborsi] annullamento non riuscito', error.code, error.message);
    return { messaggio: 'Non sono riuscito ad annullare il rimborso. Controlla la connessione e riprova.' };
  }
  // false: già annullato, per esempio dall'altra persona. Va bene lo stesso
  if (!data) return { avviso: 'Il rimborso era già annullato' };
  return { avviso: { testo: 'Rimborso annullato', conferma: true, saldo: rigaSaldo(await saldoMio(supabase, nucleo), nucleo) } };
}

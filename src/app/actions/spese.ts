'use server';

import { z } from 'zod';
import { oggiIso } from '@/lib/date';
import { euroInCentesimi } from '@/lib/money';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';
import type { ContenutoAvviso } from '@/lib/avvisi';
import { avvisoSpesa } from '@/lib/spese/testi';
import { createClient } from '@/lib/supabase/server';

// US-10, US-11, US-12: salvare una spesa. Il database controlla di nuovo
// tutto quello che conta (RLS, permessi per colonna, foreign key composte
// sul nucleo, vincoli su importo e testi, D11): qui si controllano i campi
// per dare messaggi chiari sotto ciascun campo.

export type StatoSpesa = {
  errori?: Record<string, string>;
  messaggio?: string;
  /** Salvata: l'avviso F7 da mostrare dopo (tavola 19b). */
  salvata?: { avviso: ContenutoAvviso };
  /** F3: nel frattempo qualcuno ha modificato la spesa (NF-06, tavola 17). */
  conflitto?: Conflitto;
};

/**
 * Cosa sappiamo della modifica arrivata nel frattempo, per il testo di F3:
 * chi l'ha fatta (l'ultima voce della cronologia) e l'importo di adesso.
 * `eliminata`: nel frattempo la spesa è finita nel Cestino.
 */
export type Conflitto = { autore: string | null; importoCentesimi: number | null; eliminata: boolean };

export type EsitoEliminazione = { avviso?: string | ContenutoAvviso; messaggio?: string };

const ERRORE_IMPREVISTO = 'Non sono riuscito a salvare. Controlla la connessione e riprova.';

const facoltativo = (massimo: number, messaggio: string) =>
  z
    .string()
    .trim()
    .max(massimo, messaggio)
    .transform((v) => v || null);

const schemaSpesa = z.object({
  importo: z
    .string()
    .transform((t) => euroInCentesimi(t))
    .refine((c): c is number => c !== null, 'Scrivi un importo valido, per esempio 47,30.')
    .refine((c) => c > 0, 'Scrivi un importo maggiore di zero.'),
  pagata_da: z.uuid('Scegli chi ha pagato.'),
  per_altra_persona: z.literal('on').optional(),
  categoria_id: z.union([z.literal(''), z.uuid()]).transform((v) => v || null),
  data_spesa: z.iso.date('Scegli una data.'),
  descrizione: facoltativo(80, 'Al massimo 80 caratteri.'),
  metodo_pagamento: z.enum(['carta', 'contanti', 'bonifico']),
  note: facoltativo(500, 'Al massimo 500 caratteri.'),
});

function campo(dati: FormData, nome: string, predefinito = '') {
  const v = dati.get(nome);
  return typeof v === 'string' ? v : predefinito;
}

type Nucleo = NonNullable<Awaited<ReturnType<typeof leggiNucleoCorrente>>>;

/** Controlla i campi del modulo; restituisce i valori per il database o gli errori per campo. */
function leggiCampi(dati: FormData, nucleo: Nucleo) {
  const campi = schemaSpesa.safeParse({
    importo: campo(dati, 'importo'),
    pagata_da: campo(dati, 'pagata_da', nucleo.io.id),
    per_altra_persona: dati.get('per_altra_persona') ?? undefined,
    categoria_id: campo(dati, 'categoria_id'),
    data_spesa: campo(dati, 'data_spesa'),
    descrizione: campo(dati, 'descrizione'),
    metodo_pagamento: campo(dati, 'metodo_pagamento', 'carta'),
    note: campo(dati, 'note'),
  });
  if (!campi.success) {
    const errori: Record<string, string> = {};
    for (const p of campi.error.issues) errori[String(p.path[0])] ??= p.message;
    return { errori } as const;
  }
  const s = campi.data;
  // Niente spese nel futuro: "oggi" nel fuso italiano, come nel campo
  if (s.data_spesa > oggiIso(new Date())) return { errori: { data_spesa: 'La data non può essere nel futuro.' } } as const;
  // Chi ha pagato deve essere uno dei due (lo ricontrolla la foreign key)
  if (!nucleo.membri.some((m) => m.id === s.pagata_da)) return { errori: { pagata_da: 'Scegli chi ha pagato.' } } as const;

  return {
    valori: {
      pagata_da: s.pagata_da,
      importo_centesimi: s.importo,
      divisione: s.per_altra_persona ? ('per_altra_persona' as const) : ('a_meta' as const),
      categoria_id: s.categoria_id,
      data_spesa: s.data_spesa,
      descrizione: s.descrizione,
      metodo_pagamento: s.metodo_pagamento,
      note: s.note,
    },
  } as const;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

type ValoriAvviso = { descrizione: string | null; importo_centesimi: number; categoria_id: string | null };

/**
 * Avviso dopo un salvataggio (F7, tavola 19b): la spesa in breve e il saldo
 * aggiornato dalla vista `saldi`. Se una lettura non riesce, la spesa è
 * comunque salvata: l'avviso dice solo quello che sa.
 */
async function avvisoConSaldo(supabase: Supabase, nucleo: Nucleo, titolo: string, spesa: ValoriAvviso) {
  const altra = nucleo.membri.find((m) => !m.sonoIo) ?? null;
  const [saldo, categoria] = await Promise.all([
    altra ? supabase.from('saldi').select('saldo_centesimi').eq('membro_id', nucleo.io.id).maybeSingle() : null,
    spesa.categoria_id ? supabase.from('categorie').select('nome').eq('id', spesa.categoria_id).maybeSingle() : null,
  ]);
  return avvisoSpesa({
    titolo,
    descrizione: spesa.descrizione,
    importoCentesimi: spesa.importo_centesimi,
    categoria: categoria?.data?.nome ?? null,
    saldoCentesimi: saldo?.data?.saldo_centesimi ?? null,
    persone: { io: nucleo.io, altra },
  });
}

/** F3: rilegge la spesa per dire chi l'ha cambiata e come (tavola 17). */
async function leggiConflitto(supabase: Supabase, id: string): Promise<Conflitto> {
  const [spesa, ultima] = await Promise.all([
    supabase.from('spese').select('importo_centesimi, data_eliminazione').eq('id', id).maybeSingle(),
    supabase
      .from('cronologia')
      .select('autore')
      .eq('tabella', 'spese')
      .eq('riga_id', id)
      .order('data_azione', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    autore: ultima.data?.autore ?? null,
    importoCentesimi: spesa.data?.importo_centesimi ?? null,
    eliminata: !spesa.data || spesa.data.data_eliminazione !== null,
  };
}

/** Nuova spesa (US-10, US-11, US-12). */
export async function creaSpesa(_prima: StatoSpesa, dati: FormData): Promise<StatoSpesa> {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) return { messaggio: ERRORE_IMPREVISTO };

  const letti = leggiCampi(dati, nucleo);
  if ('errori' in letti) return { errori: letti.errori };

  const supabase = await createClient();
  const { error } = await supabase.from('spese').insert({ nucleo_id: nucleo.id, ...letti.valori });
  if (error) {
    console.error('[spese] inserimento non riuscito', error.code, error.message);
    return { messaggio: ERRORE_IMPREVISTO };
  }
  return { salvata: { avviso: await avvisoConSaldo(supabase, nucleo, 'Spesa salvata', letti.valori) } };
}

/**
 * Modifica spesa (US-13, tavola 07). Concorrenza ottimistica (NF-06): la
 * riga si aggiorna solo se `data_modifica` è ancora quella letta quando si
 * è aperto il modulo. Se nel frattempo l'altra persona l'ha cambiata, non
 * si aggiorna niente e compare F3.
 */
export async function modificaSpesa(_prima: StatoSpesa, dati: FormData): Promise<StatoSpesa> {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) return { messaggio: ERRORE_IMPREVISTO };

  const id = z.uuid().safeParse(campo(dati, 'id'));
  const letta = campo(dati, 'data_modifica');
  if (!id.success || !letta) return { messaggio: ERRORE_IMPREVISTO };

  const letti = leggiCampi(dati, nucleo);
  if ('errori' in letti) return { errori: letti.errori };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('spese')
    .update(letti.valori)
    .eq('id', id.data)
    .eq('nucleo_id', nucleo.id)
    .eq('data_modifica', letta)
    .is('data_eliminazione', null)
    .select('id');
  if (error) {
    console.error('[spese] modifica non riuscita', error.code, error.message);
    return { messaggio: ERRORE_IMPREVISTO };
  }
  if (!data.length) return { conflitto: await leggiConflitto(supabase, id.data) };
  return { salvata: { avviso: await avvisoConSaldo(supabase, nucleo, 'Spesa modificata', letti.valori) } };
}

/**
 * Elimina (US-13, US-14, dopo la conferma F5): la spesa va nel Cestino,
 * cioè prende `data_eliminazione`. Mai un DELETE vero (D10): si recupera
 * per 30 giorni, e la cronologia lo registra.
 */
export async function eliminaSpesa(id: string): Promise<EsitoEliminazione> {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo || !z.uuid().safeParse(id).success) return { messaggio: ERRORE_IMPREVISTO };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('spese')
    .update({ data_eliminazione: new Date().toISOString() })
    .eq('id', id)
    .eq('nucleo_id', nucleo.id)
    .is('data_eliminazione', null)
    .select('descrizione, importo_centesimi, categoria_id');
  if (error) {
    console.error('[spese] eliminazione non riuscita', error.code, error.message);
    return { messaggio: ERRORE_IMPREVISTO };
  }
  // Già nel Cestino (per esempio eliminata dall'altra persona): va bene lo stesso
  if (!data.length) return { avviso: 'La spesa era già nel Cestino' };
  return { avviso: await avvisoConSaldo(supabase, nucleo, 'Spesa spostata nel Cestino', data[0]) };
}

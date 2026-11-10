'use server';

import { z } from 'zod';
import { oggiIso } from '@/lib/date';
import { euroInCentesimi } from '@/lib/money';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';
import { testoSpesaSalvata } from '@/lib/spese/testi';
import { createClient } from '@/lib/supabase/server';

// US-10, US-11, US-12: salvare una spesa. Il database controlla di nuovo
// tutto quello che conta (RLS, permessi per colonna, foreign key composte
// sul nucleo, vincoli su importo e testi, D11): qui si controllano i campi
// per dare messaggi chiari sotto ciascun campo.

export type StatoSpesa = {
  errori?: Record<string, string>;
  messaggio?: string;
  /** Salvata: testo dell'avviso F7 da mostrare dopo. */
  salvata?: { avviso: string };
};

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

export async function creaSpesa(_prima: StatoSpesa, dati: FormData): Promise<StatoSpesa> {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) return { messaggio: ERRORE_IMPREVISTO };

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
    return { errori };
  }
  const s = campi.data;

  // Niente spese nel futuro: "oggi" nel fuso italiano, come nel campo
  if (s.data_spesa > oggiIso(new Date())) return { errori: { data_spesa: 'La data non può essere nel futuro.' } };
  // Chi ha pagato deve essere uno dei due (lo ricontrolla la foreign key)
  if (!nucleo.membri.some((m) => m.id === s.pagata_da)) return { errori: { pagata_da: 'Scegli chi ha pagato.' } };

  const supabase = await createClient();
  const { error } = await supabase.from('spese').insert({
    nucleo_id: nucleo.id,
    pagata_da: s.pagata_da,
    importo_centesimi: s.importo,
    divisione: s.per_altra_persona ? 'per_altra_persona' : 'a_meta',
    categoria_id: s.categoria_id,
    data_spesa: s.data_spesa,
    descrizione: s.descrizione,
    metodo_pagamento: s.metodo_pagamento,
    note: s.note,
  });
  if (error) {
    console.error('[spese] inserimento non riuscito', error.code, error.message);
    return { messaggio: ERRORE_IMPREVISTO };
  }

  // Saldo aggiornato per l'avviso F7. Se la lettura non riesce, la spesa è
  // comunque salvata: l'avviso dice solo "Spesa salvata".
  const altra = nucleo.membri.find((m) => !m.sonoIo);
  let saldo: number | null = null;
  if (altra) {
    const { data } = await supabase.from('saldi').select('saldo_centesimi').eq('membro_id', nucleo.io.id).maybeSingle();
    saldo = data?.saldo_centesimi ?? null;
  }
  return { salvata: { avviso: testoSpesaSalvata(saldo, altra?.nome ?? null) } };
}

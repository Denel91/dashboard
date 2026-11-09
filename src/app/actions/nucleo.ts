'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { codiceErroreNucleo, erroreNucleo, type ErroreNucleo } from '@/lib/nucleo/errori';
import { codiceInvitoValido } from '@/lib/nucleo/invito';
import { createClient } from '@/lib/supabase/server';

// US-02: creare il nucleo ed entrarci con il link. Le regole vere (una persona
// in un solo nucleo, al massimo due persone, blocco contro due ingressi
// simultanei) stanno nel database, dentro crea_nucleo() ed entra_nel_nucleo()
// (D12). Qui si controllano solo i campi e si traducono gli errori.

export type StatoModulo = {
  /** Errori per campo, da mostrare sotto il campo (FieldError di React Aria). */
  errori?: Record<string, string>;
  /** Errore del nucleo (P0001–P0003), da mostrare al posto del modulo. */
  erroreNucleo?: ErroreNucleo;
  /** Errore imprevisto (rete, database). */
  messaggio?: string;
};

const nomeVisualizzato = z
  .string()
  .trim()
  .min(1, 'Scrivi il tuo nome.')
  .max(40, 'Al massimo 40 caratteri.');

const schemaCrea = z.object({
  nome: nomeVisualizzato,
  nomeNucleo: z
    .string()
    .trim()
    .max(60, 'Al massimo 60 caratteri.')
    .transform((v) => v || 'Casa nostra'),
});

function erroriPerCampo(errore: z.ZodError): Record<string, string> {
  const errori: Record<string, string> = {};
  for (const problema of errore.issues) {
    const campo = String(problema.path[0] ?? '');
    errori[campo] ??= problema.message;
  }
  return errori;
}

const ERRORE_IMPREVISTO = 'Qualcosa non ha funzionato. Controlla la connessione e riprova.';

/** Passo 1 (tavola 02a): crea il nucleo e porta al link d'invito (tavola 02b). */
export async function creaNucleo(_prima: StatoModulo, dati: FormData): Promise<StatoModulo> {
  const campi = schemaCrea.safeParse({ nome: dati.get('nome') ?? '', nomeNucleo: dati.get('nomeNucleo') ?? '' });
  if (!campi.success) return { errori: erroriPerCampo(campi.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc('crea_nucleo', {
    p_nome_visualizzato: campi.data.nome,
    p_nome_nucleo: campi.data.nomeNucleo,
  });

  if (error) {
    const codice = codiceErroreNucleo(error);
    // Già in un nucleo (per esempio doppio tocco su Crea): si va alla Home
    if (codice === 'P0003') redirect('/');
    return { messaggio: ERRORE_IMPREVISTO };
  }

  redirect('/benvenuto/invita');
}

/** Tavola 03b: entra nel nucleo del link con il proprio nome. */
export async function entraNelNucleo(codice: string, _prima: StatoModulo, dati: FormData): Promise<StatoModulo> {
  if (!codiceInvitoValido(codice)) return { erroreNucleo: erroreNucleo('P0002') };

  const nome = nomeVisualizzato.safeParse(dati.get('nome') ?? '');
  if (!nome.success) return { errori: { nome: nome.error.issues[0]?.message ?? 'Scrivi il tuo nome.' } };

  const supabase = await createClient();
  const { error } = await supabase.rpc('entra_nel_nucleo', {
    p_codice_invito: codice,
    p_nome_visualizzato: nome.data,
  });

  if (error) {
    const codiceErrore = codiceErroreNucleo(error);
    if (codiceErrore) return { erroreNucleo: erroreNucleo(codiceErrore) };
    return { messaggio: ERRORE_IMPREVISTO };
  }

  redirect('/');
}

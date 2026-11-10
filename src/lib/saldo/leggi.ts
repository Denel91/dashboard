import type { NucleoCorrente } from '@/lib/nucleo/corrente';
import { createClient } from '@/lib/supabase/server';
import { rimborsiInElenco, statoSaldo, type RimborsoInElenco, type StatoSaldo } from './saldo';

// Letture del saldo e dei rimborsi per le pagine (US-30). La RLS fa leggere
// solo il proprio nucleo; un errore ferma la pagina (error.tsx) invece di
// mostrare un saldo sbagliato, e finisce nei log di Vercel.

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Il saldo di chi è collegato, dalla vista `saldi`, già tradotto in "chi deve a chi". */
export async function leggiStatoSaldo(supabase: Supabase, nucleo: NucleoCorrente): Promise<StatoSaldo> {
  const { data, error } = await supabase.from('saldi').select('saldo_centesimi').eq('membro_id', nucleo.io.id).maybeSingle();
  if (error) throw erroreLettura('saldo', error);
  return statoSaldo(data?.saldo_centesimi ?? 0, nucleo);
}

/**
 * I rimborsi del nucleo, dal più recente, annullati compresi (restano in
 * elenco barrati, tavola 08a). Per due persone bastano gli ultimi 100.
 */
export async function leggiRimborsi(supabase: Supabase, nucleo: NucleoCorrente): Promise<RimborsoInElenco[]> {
  const [rimborsi, membri] = await Promise.all([
    supabase
      .from('rimborsi')
      .select('id, da_membro, a_membro, importo_centesimi, data_rimborso, nota, data_eliminazione')
      .eq('nucleo_id', nucleo.id)
      .order('data_rimborso', { ascending: false })
      .order('data_creazione', { ascending: false })
      .limit(100),
    // Anche chi è uscito, per i nomi dei rimborsi vecchi
    supabase.from('membri').select('id, nome_visualizzato').eq('nucleo_id', nucleo.id).order('data_ingresso'),
  ]);
  if (rimborsi.error) throw erroreLettura('rimborsi', rimborsi.error);
  if (membri.error) throw erroreLettura('membri', membri.error);
  return rimborsiInElenco(
    rimborsi.data ?? [],
    (membri.data ?? []).map((m) => ({ id: m.id, nome: m.nome_visualizzato })),
    nucleo,
  );
}

function erroreLettura(cosa: string, errore: { code?: string; message: string }): Error {
  console.error(`[saldo] lettura di ${cosa} non riuscita`, errore.code, errore.message);
  return new Error(`Lettura di ${cosa} non riuscita (${errore.code ?? 'senza codice'})`);
}

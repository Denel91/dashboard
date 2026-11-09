import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

// Il nucleo di chi è collegato, con i membri in ordine di ingresso.
// Il primo membro ha il colore persona-a (blu), il secondo persona-b (rosa).
// `cache` evita di ripetere le stesse letture nella stessa richiesta
// (layout, barra laterale e pagina). La RLS fa leggere solo il proprio nucleo.

export type Persona = 'a' | 'b';
export type Membro = { id: string; nome: string; persona: Persona; sonoIo: boolean };
export type NucleoCorrente = {
  id: string;
  nome: string;
  codiceInvito: string;
  membri: Membro[];
  io: Membro;
  completo: boolean;
  /** Email dell'account Google in uso (K4). */
  email: string;
};

export const leggiNucleoCorrente = cache(async (): Promise<NucleoCorrente | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mio } = await supabase
    .from('membri')
    .select('nucleo_id')
    .eq('utente_id', user.id)
    .is('data_uscita', null)
    .maybeSingle();
  if (!mio) return null;

  const [{ data: nucleo }, { data: membri }] = await Promise.all([
    supabase.from('nuclei').select('id, nome, codice_invito').eq('id', mio.nucleo_id).single(),
    supabase
      .from('membri')
      .select('id, utente_id, nome_visualizzato')
      .eq('nucleo_id', mio.nucleo_id)
      .is('data_uscita', null)
      .order('data_ingresso'),
  ]);
  if (!nucleo || !membri) return null;

  const elenco: Membro[] = membri.map((m, i) => ({
    id: m.id,
    nome: m.nome_visualizzato,
    persona: i === 0 ? 'a' : 'b',
    sonoIo: m.utente_id === user.id,
  }));
  const io = elenco.find((m) => m.sonoIo);
  if (!io) return null;

  return {
    id: nucleo.id,
    nome: nucleo.nome,
    codiceInvito: nucleo.codice_invito,
    membri: elenco,
    io,
    completo: elenco.length >= 2,
    email: user.email ?? '',
  };
});

export { nomeDaAccountGoogle } from './nome';

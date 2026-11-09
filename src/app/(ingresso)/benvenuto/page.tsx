import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { leggiNucleoCorrente, nomeDaAccountGoogle } from '@/lib/nucleo/corrente';
import { createClient } from '@/lib/supabase/server';
import { IntestazioneIngresso } from '../intestazione';
import { ModuloCreaNucleo } from './modulo';

export const metadata: Metadata = { title: 'Crea il nucleo · Nucleo' };

// Tavola 02a (US-02, passo 1): primo accesso di chi non fa parte di un nucleo.
export default function PaginaBenvenuto() {
  return (
    <>
      <IntestazioneIngresso titolo="Crea il vostro nucleo">
        Il nucleo è lo spazio che condividi con l’altra persona: spese, saldo e budget. Poi la inviti con un link.
      </IntestazioneIngresso>
      {/* Legge la sessione (cookie): con cacheComponents va dentro Suspense */}
      <Suspense fallback={null}>
        <Contenuto />
      </Suspense>
    </>
  );
}

async function Contenuto() {
  if (await leggiNucleoCorrente()) redirect('/');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <ModuloCreaNucleo nomeIniziale={nomeDaAccountGoogle(user?.user_metadata)} />;
}

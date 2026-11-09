import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { BottoneGoogle, BottoneGoogleInAttesa } from '@/app/(auth)/accesso/bottone-google';
import { eBrowserInterno } from '@/lib/browser-interno';
import { leggiNucleoCorrente, nomeDaAccountGoogle } from '@/lib/nucleo/corrente';
import { erroreNucleo } from '@/lib/nucleo/errori';
import { codiceInvitoValido } from '@/lib/nucleo/invito';
import { createClient } from '@/lib/supabase/server';
import { SchermataErroreNucleo } from '../../errore-nucleo';
import { IntestazioneIngresso } from '../../intestazione';
import { ApriNelBrowser } from './apri-nel-browser';
import { ModuloEntra } from './modulo';

export const metadata: Metadata = { title: 'Invito · Nucleo' };

// Tavole 03a, 03b e 16 (US-02). La pagina è pubblica (D14): prima
// dell'accesso mostra chi invita e in quale nucleo, letti con
// anteprima_invito(); "Il nucleo è già completo" (P0001) e "Invito non
// valido" (P0002) compaiono subito, prima di Google. Dopo l'accesso si
// conferma il nome e si entra; "Fai già parte di un nucleo" (P0003) compare qui.
export default function PaginaInvito({ params }: PageProps<'/invito/[codice]'>) {
  return (
    <Suspense fallback={null}>
      <Contenuto params={params} />
    </Suspense>
  );
}

async function Contenuto({ params }: { params: PageProps<'/invito/[codice]'>['params'] }) {
  const { codice } = await params;
  if (!codiceInvitoValido(codice)) return <SchermataErroreNucleo errore={erroreNucleo('P0002')} />;

  const supabase = await createClient();
  const [{ data: anteprime }, { data: datiUtente }] = await Promise.all([
    supabase.rpc('anteprima_invito', { p_codice_invito: codice }),
    supabase.auth.getUser(),
  ]);
  const anteprima = anteprime?.[0];
  const utente = datiUtente.user;

  // Chi fa già parte di questo nucleo (per esempio riapre il link) va alla Home
  const mio = utente ? await leggiNucleoCorrente() : null;
  if (mio && mio.codiceInvito === codice) redirect('/');

  if (!anteprima) return <SchermataErroreNucleo errore={erroreNucleo('P0002')} />;
  if (anteprima.completo) return <SchermataErroreNucleo errore={erroreNucleo('P0001')} />;
  if (mio) return <SchermataErroreNucleo errore={erroreNucleo('P0003')} />;

  const invito = (
    <IntestazioneIngresso
      titolo={
        <>
          {anteprima.nome_invitante} ti ha invitato in <span className="text-accento">{anteprima.nome_nucleo}</span>
        </>
      }
    >
      Su Nucleo registrate le spese comuni e vedete sempre chi deve cosa all’altro.
    </IntestazioneIngresso>
  );

  // Tavola 03a: senza accesso
  if (!utente) {
    const userAgent = (await headers()).get('user-agent');
    return (
      <>
        <div className="flex-1">{invito}</div>
        <div className="mt-8">
          {eBrowserInterno(userAgent) ? (
            <ApriNelBrowser />
          ) : (
            <>
              <Suspense fallback={<BottoneGoogleInAttesa />}>
                <BottoneGoogle destinazione={`/invito/${codice}`} />
              </Suspense>
              <p className="mt-3 text-center text-nota text-testo-secondario">Niente password: usi il tuo account Google.</p>
            </>
          )}
        </div>
      </>
    );
  }

  // Tavola 03b: dopo l'accesso, conferma del nome ed "Entra"
  return (
    <>
      {invito}
      <ModuloEntra codice={codice} nomeIniziale={nomeDaAccountGoogle(utente.user_metadata)} email={utente.email ?? ''} />
    </>
  );
}

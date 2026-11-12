'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { destinazioneSicura } from '@/lib/destinazione';
import { createClient } from '@/lib/supabase/client';

// Tavola 01: capsula bianca con il logo di Google (non il viola dell'accento),
// alta 50 px, con area di tocco ampia (linee guida iOS 27, sezioni 3 e 5)
const STILE_BOTTONE =
  'flex h-12.5 w-full items-center justify-center gap-2.5 rounded-capsula bg-superficie ' +
  'text-intestazione text-testo shadow-sm ring-1 ring-separatore transition ' +
  'active:scale-98 active:opacity-80 disabled:opacity-60';

/** Logo "G" di Google, nei colori ufficiali (public/logo-google.svg): è il marchio di un altro, non usa i nostri token. */
function LogoGoogle() {
  // eslint-disable-next-line @next/next/no-img-element -- icona di 18 px, niente ottimizzazione da fare
  return <img src="/logo-google.svg" alt="" width={18} height={18} />;
}

/**
 * `destinazione`: dove tornare dopo Google. Se manca, si usa ?next= della
 * pagina (accesso) e altrimenti la Home. La pagina d'invito la passa così
 * si torna all'invito (US-02).
 */
export function BottoneGoogle({ destinazione }: { destinazione?: string } = {}) {
  const params = useSearchParams();
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(
    params.get('errore') ? 'L’accesso non è riuscito. Riprova.' : null,
  );

  async function accedi() {
    setInCorso(true);
    setErrore(null);

    // Dopo Google si torna su /auth/callback dello stesso sito (locale,
    // preview o produzione), che poi apre la pagina richiesta.
    const ritorno = new URL('/auth/callback', window.location.origin);
    ritorno.searchParams.set('next', destinazioneSicura(destinazione ?? params.get('next')));

    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: ritorno.toString() },
    });

    // Se va tutto bene il browser è già partito verso Google
    if (error) {
      setErrore('Non riesco a contattare Google. Controlla la connessione e riprova.');
      setInCorso(false);
    }
  }

  return (
    <>
      {errore && (
        <p role="alert" className="mb-4 rounded-card bg-superficie p-3 text-sottotitolo text-pericolo">
          {errore}
        </p>
      )}
      <button type="button" onClick={accedi} disabled={inCorso} className={STILE_BOTTONE}>
        <LogoGoogle />
        {inCorso ? 'Apro Google…' : 'Continua con Google'}
      </button>
    </>
  );
}

/** Mostrato per un istante mentre la pagina legge i parametri dell'indirizzo. */
export function BottoneGoogleInAttesa() {
  return (
    <button type="button" disabled className={STILE_BOTTONE}>
      <LogoGoogle />
      Continua con Google
    </button>
  );
}

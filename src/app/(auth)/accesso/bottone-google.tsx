'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { destinazioneSicura } from '@/lib/destinazione';
import { createClient } from '@/lib/supabase/client';

const STILE_BOTTONE =
  'w-full rounded-campo bg-accento px-6 py-4 text-lg font-semibold text-su-accento ' +
  'disabled:opacity-60';

export function BottoneGoogle() {
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
    ritorno.searchParams.set('next', destinazioneSicura(params.get('next')));

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
        <p role="alert" className="mb-4 rounded-campo bg-superficie p-3 text-sm text-pericolo">
          {errore}
        </p>
      )}
      <button type="button" onClick={accedi} disabled={inCorso} className={STILE_BOTTONE}>
        {inCorso ? 'Apro Google…' : 'Continua con Google'}
      </button>
    </>
  );
}

/** Mostrato per un istante mentre la pagina legge i parametri dell'indirizzo. */
export function BottoneGoogleInAttesa() {
  return (
    <button type="button" disabled className={STILE_BOTTONE}>
      Continua con Google
    </button>
  );
}

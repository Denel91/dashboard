'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Check, Copy, RefreshCw, Share } from 'lucide-react';
import { PulsanteSecondario, PulsanteTesto } from '@/components/ui';

// "Copia link" (Clipboard API, solo su HTTPS o localhost) e "Condividi"
// (Web Share API: su iPhone apre il foglio di condivisione di iOS; dove
// manca, per esempio su alcuni browser del computer, resta solo "Copia link").

export function CondividiInvito({ link, nomeNucleo }: { link: string; nomeNucleo: string }) {
  const [copiato, setCopiato] = useState(false);
  const [puoCondividere, setPuoCondividere] = useState(false);

  // Si sa solo nel browser: prima del primo disegno il pulsante non c'è
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capacità del browser, letta una volta
    setPuoCondividere(typeof navigator.share === 'function');
  }, []);

  async function copia() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2500);
    } catch {
      // Clipboard non disponibile: si può sempre tenere premuto sul link
    }
  }

  async function condividi() {
    try {
      await navigator.share({ title: `Entra in ${nomeNucleo}`, text: `Ti invito in ${nomeNucleo} su Nucleo:`, url: link });
    } catch {
      // Condivisione annullata dall'utente: niente da fare
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <PulsanteSecondario onPress={copia} aria-live="polite">
        {copiato ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
        {copiato ? 'Copiato' : 'Copia link'}
      </PulsanteSecondario>
      {puoCondividere && (
        <PulsanteSecondario onPress={condividi}>
          <Share aria-hidden="true" size={18} />
          Condividi
        </PulsanteSecondario>
      )}
    </div>
  );
}

/** "Aggiorna" fino allo Sprint 6 (tempo reale): rilegge la pagina dal server. */
export function AggiornaStato() {
  const router = useRouter();
  const [inCorso, avvia] = useTransition();
  return (
    <PulsanteTesto onPress={() => avvia(() => router.refresh())} isPending={inCorso}>
      <RefreshCw aria-hidden="true" size={16} className={inCorso ? 'animate-spin motion-reduce:animate-none' : undefined} />
      Aggiorna
    </PulsanteTesto>
  );
}

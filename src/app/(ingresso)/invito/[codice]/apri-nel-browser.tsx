'use client';

import { useState } from 'react';
import { Check, Compass, Copy } from 'lucide-react';
import { PulsantePrincipale } from '@/components/ui';

// Browser interno di un'app (Instagram, Facebook, Messenger…): Google non
// permette l'accesso da qui (403 disallowed_useragent). Al posto di
// "Continua con Google" si chiede di aprire il link in Safari o Chrome
// (decisione del 9 novembre 2026, US-02).
export function ApriNelBrowser() {
  const [copiato, setCopiato] = useState(false);

  async function copia() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiato(true);
    } catch {
      // Clipboard non disponibile: resta il suggerimento con i tre puntini
    }
  }

  return (
    <div role="alert" className="flex flex-col gap-4">
      <div className="flex gap-3 rounded-card bg-superficie p-4 md:bg-superficie-2">
        <Compass aria-hidden="true" size={22} className="mt-0.5 shrink-0 text-accento" />
        <div>
          <p className="text-intestazione">Apri il link in Safari o Chrome</p>
          <p className="mt-1 text-sottotitolo text-testo-secondario">
            Dentro questa app, Google non permette l’accesso. Tocca i tre puntini in alto e scegli “Apri nel browser”, oppure
            copia il link e incollalo in Safari.
          </p>
        </div>
      </div>
      <PulsantePrincipale onPress={copia} className="md:w-full">
        {copiato ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
        {copiato ? 'Link copiato: ora incollalo in Safari' : 'Copia il link'}
      </PulsantePrincipale>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  ApriFoglio,
  Foglio,
  PulsanteDistruttivo,
  PulsantePrincipale,
  PulsanteSecondario,
  PulsanteTesto,
  mostraAvviso,
} from '@/components/ui';

// PAGINA DI PROVA TEMPORANEA (T-22): le parti interattive. Va tolta con la
// pagina prima del merge su main.

export function ProvaFoglio() {
  return (
    <ApriFoglio>
      <PulsanteSecondario>Apri il foglio (F4)</PulsanteSecondario>
      <Foglio titolo="Segna come saldato">
        {({ chiudi }) => (
          <div className="flex flex-col gap-4">
            <p className="text-corpo text-testo-secondario">
              Simona ti dà <span className="importo text-testo">23,40 €</span>. Puoi cambiare l’importo se è un
              rimborso parziale.
            </p>
            <div className="h-24 rounded-campo bg-superficie-2" aria-hidden="true" />
            <PulsantePrincipale
              onPress={() => {
                chiudi();
                mostraAvviso('Rimborso registrato · Siete in pari');
              }}
            >
              Conferma
            </PulsantePrincipale>
            <PulsanteTesto className="self-center" onPress={chiudi}>
              Annulla
            </PulsanteTesto>
          </div>
        )}
      </Foglio>
    </ApriFoglio>
  );
}

export function ProvaFoglioControllato() {
  const [aperto, setAperto] = useState(false);
  return (
    <>
      <PulsanteDistruttivo onPress={() => setAperto(true)}>Elimina (F5)</PulsanteDistruttivo>
      <Foglio titolo="Spostare nel Cestino?" isOpen={aperto} onOpenChange={setAperto}>
        <div className="flex flex-col gap-4">
          <p className="text-corpo text-testo-secondario">Potrai recuperarla per 30 giorni.</p>
          <PulsanteDistruttivo
            variante="pieno"
            onPress={() => {
              setAperto(false);
              mostraAvviso('Spesa spostata nel Cestino');
            }}
          >
            Sposta nel Cestino
          </PulsanteDistruttivo>
          <PulsanteTesto className="self-center" onPress={() => setAperto(false)}>
            Annulla
          </PulsanteTesto>
        </div>
      </Foglio>
    </>
  );
}

export function ProvaAvviso() {
  return (
    <PulsanteSecondario onPress={() => mostraAvviso('Spesa salvata · Simona ti deve 47,05 €')}>
      Mostra un avviso (F7)
    </PulsanteSecondario>
  );
}

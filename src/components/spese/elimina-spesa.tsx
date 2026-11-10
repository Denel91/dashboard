'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { EsitoEliminazione } from '@/app/actions/spese';
import { ApriFoglio, Foglio, PulsanteDistruttivo, PulsanteTesto, mostraAvviso } from '@/components/ui';

// Elimina in Modifica spesa (tavola 07, US-13) con la conferma F5 (tavola
// 19d): "Spostare nel Cestino? Potrai recuperarla per 30 giorni". Sul
// telefono è un foglio dal basso, da 768 px una finestra al centro.
// Confermando, la spesa va nel Cestino (D10) e si torna all'elenco.

export function EliminaSpesa({
  elimina,
  dopo,
}: {
  /** eliminaSpesa già legata all'id della spesa. */
  elimina: () => Promise<EsitoEliminazione>;
  dopo: string;
}) {
  const router = useRouter();
  const [inCorso, avvia] = useTransition();
  const [errore, setErrore] = useState<string | null>(null);

  function conferma(chiudi: () => void) {
    setErrore(null);
    avvia(async () => {
      const esito = await elimina();
      if (esito.messaggio) {
        setErrore(esito.messaggio);
        return;
      }
      chiudi();
      if (esito.avviso) mostraAvviso(esito.avviso);
      router.replace(dopo);
      router.refresh();
    });
  }

  return (
    <ApriFoglio>
      <PulsanteDistruttivo>Elimina</PulsanteDistruttivo>
      <Foglio titolo="Spostare nel Cestino?">
        {({ chiudi }) => (
          <div className="flex flex-col gap-5">
            <p className="text-corpo text-testo-secondario">Potrai recuperarla per 30 giorni.</p>
            {errore && (
              <p role="alert" className="text-sottotitolo text-pericolo">
                {errore}
              </p>
            )}
            <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
              <PulsanteDistruttivo variante="pieno" isPending={inCorso} onPress={() => conferma(chiudi)}>
                {inCorso ? 'Sposto…' : 'Sposta nel Cestino'}
              </PulsanteDistruttivo>
              <PulsanteTesto onPress={chiudi}>Annulla</PulsanteTesto>
            </div>
          </div>
        )}
      </Foglio>
    </ApriFoglio>
  );
}

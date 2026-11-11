'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { EsitoEliminazione } from '@/app/actions/spese';
import { ApriFoglio, Foglio, IconaFoglio, PulsanteDistruttivo, PulsanteTesto, mostraAvviso } from '@/components/ui';

// Elimina in Modifica spesa (tavola 07, US-13), sotto Salva, con la
// conferma F5 (tavola 19d): "Pizzeria Da Gino · 38,00 €. Potrai recuperarla
// dal Cestino per 30 giorni. Nel frattempo non conta nel saldo." Sul
// telefono è un foglio dal basso, da 768 px una finestra al centro.
// Confermando, la spesa va nel Cestino (D10) e si torna all'elenco.

export function EliminaSpesa({
  elimina,
  dopo,
  riassunto,
}: {
  /** eliminaSpesa già legata all'id della spesa. */
  elimina: () => Promise<EsitoEliminazione>;
  dopo: string;
  /** La spesa in breve, in grassetto nel testo di F5: "Pizzeria Da Gino · 38,00 €". */
  riassunto: string;
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
      <PulsanteDistruttivo className="gap-1.5 px-3 font-semibold">
        <Trash2 aria-hidden className="size-4.5 largo:hidden" />
        Elimina
      </PulsanteDistruttivo>
      <Foglio
        titolo="Spostare nel Cestino?"
        icona={
          <IconaFoglio tono="pericolo">
            <Trash2 className="size-5" />
          </IconaFoglio>
        }
      >
        {({ chiudi }) => (
          <div className="flex flex-col gap-5">
            <p className="text-corpo text-testo">
              <strong className="font-semibold">{riassunto}</strong>. Potrai recuperarla dal Cestino per 30 giorni. Nel
              frattempo non conta nel saldo.
            </p>
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

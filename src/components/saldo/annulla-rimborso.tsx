'use client';

import { ArrowRight, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { EsitoAnnullamento } from '@/app/actions/rimborsi';
import { ApriFoglio, Foglio, IconaFoglio, Iniziale, PulsanteDistruttivo, PulsantePillola, PulsanteTesto, mostraAvviso } from '@/components/ui';
import { dataIsoBreve } from '@/lib/date';
import { formattaEuro } from '@/lib/money';
import type { RimborsoInElenco } from '@/lib/saldo/saldo';

// "↶ Annulla" su un rimborso (tavola 08a) con la conferma F5 (tavola 19e,
// US-33): "Annullare il rimborso? Simona → Daniele · 40,00 € del
// 28/10/2026. Il rimborso resterà in elenco, barrato. Il saldo tornerà a
// 63,40 €." Confermando, il rimborso non conta più nel saldo e la cronologia
// lo registra; non si cancella mai (D10).

export function AnnullaRimborso({
  rimborso: r,
  annulla,
  fraseSaldo,
}: {
  rimborso: RimborsoInElenco;
  /** annullaRimborso già legata all'id del rimborso. */
  annulla: () => Promise<EsitoAnnullamento>;
  /** "Il saldo tornerà a 63,40 €.", calcolata dalla pagina (saldoDopoAnnullamento). */
  fraseSaldo: string;
}) {
  const router = useRouter();
  const [inCorso, avvia] = useTransition();
  const [errore, setErrore] = useState<string | null>(null);

  function conferma(chiudi: () => void) {
    setErrore(null);
    avvia(async () => {
      const esito = await annulla();
      if (esito.messaggio) {
        setErrore(esito.messaggio);
        return;
      }
      chiudi();
      if (esito.avviso) mostraAvviso(esito.avviso);
      router.refresh();
    });
  }

  return (
    <ApriFoglio>
      <PulsantePillola aria-label={`Annulla il rimborso di ${formattaEuro(r.importoCentesimi)} del ${dataIsoBreve(r.data)}`}>
        <Undo2 aria-hidden="true" className="size-3" />
        Annulla
      </PulsantePillola>
      <Foglio
        titolo="Annullare il rimborso?"
        icona={
          <IconaFoglio tono="pericolo">
            <Undo2 className="size-5" />
          </IconaFoglio>
        }
      >
        {({ chiudi }) => (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 text-corpo text-testo">
              <p className="flex flex-wrap items-center gap-1.5 text-sottotitolo">
                <span className="sr-only">
                  {r.da.nome} a {r.a.nome}
                </span>
                <span aria-hidden="true" className="flex items-center gap-1.5">
                  <Iniziale nome={r.da.nome} persona={r.da.persona} dimensione="piccola" decorativa />
                  {r.da.nome}
                  <ArrowRight className="size-4" />
                  <Iniziale nome={r.a.nome} persona={r.a.persona} dimensione="piccola" decorativa />
                  {r.a.nome}
                </span>
                · <strong className="importo font-semibold">{formattaEuro(r.importoCentesimi)}</strong>
              </p>
              <p>del {dataIsoBreve(r.data)}.</p>
              <p>
                Il rimborso resterà in elenco, barrato. <ImportiInGrassetto testo={fraseSaldo} />
              </p>
            </div>
            {errore && (
              <p role="alert" className="text-sottotitolo text-pericolo">
                {errore}
              </p>
            )}
            <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
              <PulsanteDistruttivo variante="pieno" isPending={inCorso} onPress={() => conferma(chiudi)}>
                {inCorso ? 'Annullo…' : 'Annulla il rimborso'}
              </PulsanteDistruttivo>
              <PulsanteTesto onPress={chiudi}>Tienilo</PulsanteTesto>
            </div>
          </div>
        )}
      </Foglio>
    </ApriFoglio>
  );
}

/** "Il saldo tornerà a 63,40 €." con l'importo in grassetto, come nella tavola 19e. */
function ImportiInGrassetto({ testo }: { testo: string }) {
  return testo.split(/(\d[\d.]*,\d{2}\s€)/).map((parte, i) =>
    i % 2 ? (
      <strong key={i} className="importo font-semibold">
        {parte}
      </strong>
    ) : (
      parte
    ),
  );
}

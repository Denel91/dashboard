import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Iniziale } from '@/components/ui';
import { formattaEuro } from '@/lib/money';
import { sottotitoloRimborso, type RimborsoInElenco } from '@/lib/saldo/saldo';

// Elenco dei rimborsi (tavola 08a, US-30): chi ha dato → chi ha ricevuto,
// data e nota, importo. Un rimborso annullato (US-33) resta in elenco
// barrato, con l'etichetta "Annullato": il segno è la parola e la riga
// barrata, non il colore (NF-09). Il pulsante Annulla lo passa la pagina
// con `azione` (US-33).

export function ElencoRimborsi({
  rimborsi,
  azione,
}: {
  rimborsi: RimborsoInElenco[];
  /** A destra dell'importo, solo per i rimborsi validi: "↶ Annulla" (US-33). */
  azione?: (r: RimborsoInElenco) => ReactNode;
}) {
  return (
    <section aria-labelledby="titolo-rimborsi" className="flex flex-col gap-2">
      <h2 id="titolo-rimborsi" className="px-1 text-titolo-3 font-bold">
        Rimborsi
      </h2>
      {rimborsi.length === 0 ? (
        <p className="vetro-card rounded-card px-4 py-6 text-center text-sottotitolo text-testo-secondario">
          Nessun rimborso finora.
        </p>
      ) : (
        <ul className="vetro-card overflow-hidden rounded-card">
          {rimborsi.map((r, i) => (
            <li key={r.id} className="pl-4">
              <div
                className={`flex min-h-14 items-center gap-3 py-2.5 pr-3 ${i > 0 ? 'border-t border-separatore' : ''} ${r.annullato ? 'text-testo-secondario' : ''}`}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className={`flex min-w-0 items-center gap-1.5 text-sottotitolo ${r.annullato ? 'line-through' : ''}`}>
                    <span className="sr-only">
                      {r.annullato ? 'Rimborso annullato: ' : 'Rimborso: '}
                      {r.da.nome} a {r.a.nome}
                    </span>
                    <span aria-hidden="true" className="flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap">
                      <Iniziale nome={r.da.nome} persona={r.da.persona} dimensione="piccola" decorativa />
                      <span>{r.da.nome}</span>
                      <ArrowRight className="mx-0.5 size-3.5 shrink-0" />
                      <Iniziale nome={r.a.nome} persona={r.a.persona} dimensione="piccola" decorativa />
                      <span>{r.a.nome}</span>
                    </span>
                  </p>
                  <p className={`truncate text-didascalia text-testo-secondario ${r.annullato ? 'line-through' : ''}`}>
                    {sottotitoloRimborso(r)}
                  </p>
                </div>
                <p className={`importo shrink-0 text-richiamo font-semibold ${r.annullato ? 'line-through' : ''}`}>
                  {formattaEuro(r.importoCentesimi)}
                </p>
                {r.annullato ? (
                  <span className="shrink-0 rounded-md bg-superficie-2 px-2 py-0.5 text-didascalia text-testo-secondario">
                    Annullato
                  </span>
                ) : (
                  azione?.(r)
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

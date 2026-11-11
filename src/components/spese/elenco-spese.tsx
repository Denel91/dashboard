import { GruppoRighe, IconaCategoria, Iniziale, Riga } from '@/components/ui';
import { etichettaGiorno } from '@/lib/date';
import { formattaEuro } from '@/lib/money';
import type { Membro } from '@/lib/nucleo/corrente';
import { etichetteSpesa, type GiornoDiSpese } from '@/lib/spese/elenco';

// Elenco delle spese di un mese, raggruppato per giorno (tavola 05, US-13).
// Ogni riga: icona della categoria, descrizione, importo e iniziale di chi
// ha pagato; sotto, la categoria e le etichette dei casi particolari
// ("per l’altra persona", "anticipo per Marco", "reso", "120 USD") in pillole.
// Intestazione del giorno con il totale del giorno (anticipi esclusi).
// Da 1024 px (tavola C2) i giorni stanno in una sola card di vetro, e sotto
// il titolo c'è anche chi ha pagato ("Spesa · Daniele") al posto
// dell'iniziale a destra.

export type CategoriaInElenco = { nome: string; icona: string; colore: string };

const GRIGIO = '#8b8b91';

export function ElencoSpese({
  giorni,
  categorie,
  membri,
  oggi,
  hrefSpesa,
  scelta,
}: {
  giorni: GiornoDiSpese[];
  categorie: Map<string, CategoriaInElenco>;
  membri: Membro[];
  oggi: string;
  /** Indirizzo di Modifica spesa per una riga. */
  hrefSpesa?: (id: string) => string;
  /** La spesa aperta accanto all'elenco, evidenziata (D21, tavola C2). */
  scelta?: string;
}) {
  const perId = new Map(membri.map((m) => [m.id, m]));

  return (
    <div className="elenco-in-una-card flex flex-col gap-6 lg:gap-4">
      {giorni.map((g) => (
        <GruppoRighe
          key={g.giorno}
          titolo={etichettaGiorno(g.giorno, oggi)}
          nota={<span aria-label={`Totale del giorno ${formattaEuro(g.totaleCentesimi)}`}>{formattaEuro(g.totaleCentesimi)}</span>}
        >
          {g.spese.map((s) => {
            const categoria = s.categoria_id ? categorie.get(s.categoria_id) : undefined;
            const chi = perId.get(s.pagata_da);
            const titolo = s.descrizione ?? categoria?.nome ?? 'Senza categoria';
            const nomeSotto = s.descrizione ? categoria?.nome : null;
            const etichette = etichetteSpesa(s);
            // Sotto il titolo la categoria e le etichette dei casi particolari, in pillole grigie (tavola 05)
            const sotto =
              nomeSotto || etichette.length || chi ? (
                <span className="flex items-center gap-1.5">
                  {nomeSotto && <span className="truncate">{nomeSotto}</span>}
                  {chi && (
                    <span aria-hidden className="hidden shrink-0 lg:inline">
                      {nomeSotto ? '· ' : ''}
                      {chi.nome}
                    </span>
                  )}
                  {etichette.map((e) => (
                    <span key={e} className="shrink-0 rounded-[0.375rem] bg-superficie-2 px-1.5 py-px text-didascalia text-testo-secondario">
                      {e}
                    </span>
                  ))}
                </span>
              ) : undefined;
            return (
              <Riga
                key={s.id}
                icona={<IconaCategoria icona={categoria?.icona ?? 'tag'} colore={categoria?.colore ?? GRIGIO} />}
                titolo={titolo}
                sottotitolo={sotto}
                href={hrefSpesa?.(s.id)}
                scelta={s.id === scelta}
                valore={
                  <span className="flex items-center gap-2">
                    <span className="importo text-testo">{formattaEuro(s.importo_centesimi)}</span>
                    {chi && (
                      <>
                        <span className="lg:hidden">
                          <Iniziale nome={chi.nome} persona={chi.persona} dimensione="piccola" decorativa />
                        </span>
                        <span className="sr-only">pagata da {chi.sonoIo ? 'te' : chi.nome}</span>
                      </>
                    )}
                  </span>
                }
              />
            );
          })}
        </GruppoRighe>
      ))}
    </div>
  );
}

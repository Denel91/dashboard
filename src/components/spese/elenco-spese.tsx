import { GruppoRighe, IconaCategoria, Iniziale, Riga } from '@/components/ui';
import { etichettaGiorno } from '@/lib/date';
import { formattaEuro } from '@/lib/money';
import type { Membro } from '@/lib/nucleo/corrente';
import { etichetteSpesa, type GiornoDiSpese } from '@/lib/spese/elenco';

// Elenco delle spese di un mese, raggruppato per giorno (tavola 05, US-13).
// Ogni riga: icona della categoria, descrizione, importo e iniziale di chi
// ha pagato; sotto, la categoria e le etichette dei casi particolari.
// Intestazione del giorno con il totale del giorno (anticipi esclusi).

export type CategoriaInElenco = { nome: string; icona: string; colore: string };

const GRIGIO = '#8b8b91';

export function ElencoSpese({
  giorni,
  categorie,
  membri,
  oggi,
}: {
  giorni: GiornoDiSpese[];
  categorie: Map<string, CategoriaInElenco>;
  membri: Membro[];
  oggi: string;
}) {
  const perId = new Map(membri.map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-6">
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
            const sotto = [s.descrizione ? categoria?.nome : null, ...etichetteSpesa(s)].filter(Boolean).join(' · ');
            return (
              <Riga
                key={s.id}
                icona={<IconaCategoria icona={categoria?.icona ?? 'tag'} colore={categoria?.colore ?? GRIGIO} />}
                titolo={titolo}
                sottotitolo={sotto || undefined}
                valore={
                  <span className="flex items-center gap-2">
                    <span className="importo text-testo">{formattaEuro(s.importo_centesimi)}</span>
                    {chi && (
                      <>
                        <Iniziale nome={chi.nome} persona={chi.persona} dimensione="piccola" decorativa />
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

import { FAMIGLIE } from '@/lib/categorie';

// Le voci del menu Altro (tavola 09) e cosa dire nelle pagine che non ci
// sono ancora (T-31). Finché una pagina non arriva con la sua storia, il suo
// indirizzo mostra quando arriva, invece di un errore 404: la barra laterale
// sul computer (D23) ci porta già.
//
// Il colore dell'icona viene dalla tavola 09: accento per la Cronologia,
// poi i colori delle famiglie delle categorie (sezione 3.1 delle linee
// guida), che hanno il contrasto giusto con l'icona bianca.

export type PaginaAltro = {
  /** Ultimo pezzo dell'indirizzo: /altro/<slug>. */
  slug: 'cronologia' | 'cestino' | 'da-riavere' | 'categorie';
  titolo: string;
  /** Seconda riga nel menu (tavola 09). */
  descrizione: string;
  /** Colore del quadratino dell'icona: `accento` o un colore della tavolozza. */
  colore: 'accento' | string;
  /** Cosa dice la pagina finché non c'è: cosa succede già oggi a quei dati. */
  inAttesa: string;
};

export const PAGINE_ALTRO_IN_ARRIVO: readonly PaginaAltro[] = [
  {
    slug: 'cronologia',
    titolo: 'Cronologia',
    descrizione: 'Chi ha cambiato cosa',
    colore: 'accento',
    inAttesa: 'Ogni modifica a spese e rimborsi viene già registrata: qui la vedrete tutta, dalla prima.',
  },
  {
    slug: 'cestino',
    titolo: 'Cestino',
    descrizione: 'Spese eliminate negli ultimi 30 giorni',
    colore: FAMIGLIE.altro.colore,
    inAttesa: 'Le spese eliminate non sono perse: qui potrete vederle e recuperarle.',
  },
  {
    slug: 'da-riavere',
    titolo: 'Da riavere',
    descrizione: 'Anticipi fatti per altre persone',
    colore: FAMIGLIE.tempoLibero.colore,
    inAttesa: 'Con questa pagina arriverà anche la spesa anticipata per un’altra persona.',
  },
  {
    slug: 'categorie',
    titolo: 'Categorie e budget',
    descrizione: 'Icone, colori e tetti mensili',
    colore: FAMIGLIE.utenze.colore,
    inAttesa: 'Per ora ci sono le 20 categorie predefinite. Qui potrete cambiarle e darvi un budget al mese.',
  },
];

export function paginaAltro(slug: string): PaginaAltro | null {
  return PAGINE_ALTRO_IN_ARRIVO.find((p) => p.slug === slug) ?? null;
}

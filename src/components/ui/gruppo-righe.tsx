import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

// Liste raggruppate (linee guida sezione 3, tavole 05 e 09–14): righe su
// `superficie` dentro un gruppo `rounded-card`, separatori `separatore`
// rientrati dopo l'icona, intestazione del gruppo in `text-nota` maiuscolo.
// Una riga con `href` porta a un'altra pagina: è un Link di Next.js con il
// chevron › (regola della sezione 10.2).

export function GruppoRighe({
  titolo,
  nota,
  className,
  children,
}: {
  /** Intestazione sopra il gruppo (OGGI · MERCOLEDÌ 4 NOVEMBRE, PROFILO). */
  titolo?: ReactNode;
  /** Testo a destra dell'intestazione, per esempio il totale del giorno. */
  nota?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={className}>
      {(titolo || nota) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3 px-4 text-nota uppercase text-testo-secondario">
          {titolo && <h2>{titolo}</h2>}
          {nota && <span className="importo normal-case">{nota}</span>}
        </div>
      )}
      {/* Il separatore sta sopra ogni riga tranne la prima e parte dal testo,
          non dal bordo: per questo è sul blocco del testo, non sulla riga. */}
      <ul className="overflow-hidden rounded-card bg-superficie [&>li:first-child_[data-riga-testo]]:border-t-0">
        {children}
      </ul>
    </section>
  );
}

type PropsRiga = {
  /** Icona a sinistra (per esempio l'icona della categoria o l'iniziale). */
  icona?: ReactNode;
  titolo: ReactNode;
  /** Seconda riga in `testo-secondario` (data, chi ha pagato, etichette). */
  sottotitolo?: ReactNode;
  /** A destra: importo, valore dell'impostazione o un pulsante. */
  valore?: ReactNode;
  /** Se c'è, la riga porta a quella pagina e mostra il chevron ›. */
  href?: string;
  /** Evidenzia la riga scelta (lista affiancata al dettaglio, D21). */
  scelta?: boolean;
};

export function Riga({ icona, titolo, sottotitolo, valore, href, scelta }: PropsRiga) {
  const contenuto = (
    <>
      {icona && <span className="flex shrink-0 items-center py-2.5">{icona}</span>}
      <span
        data-riga-testo=""
        className="flex min-h-11 flex-1 items-center gap-3 border-t border-separatore py-2.5 pr-4"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-corpo text-testo">{titolo}</span>
          {sottotitolo && <span className="truncate text-sottotitolo text-testo-secondario">{sottotitolo}</span>}
        </span>
        {valore && <span className="shrink-0 text-corpo text-testo-secondario">{valore}</span>}
        {href && <ChevronRight aria-hidden="true" size={18} className="-mr-1 shrink-0 text-testo-secondario" />}
      </span>
    </>
  );

  const base = 'flex items-stretch gap-3 pl-4 ' + (scelta ? 'bg-accento-tenue' : '');

  return (
    <li>
      {href ? (
        <Link
          href={href}
          aria-current={scelta ? 'page' : undefined}
          className={
            base +
            ' outline-hidden transition-colors duration-150 hover:bg-superficie-2 active:bg-superficie-2 ' +
            'focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-accento'
          }
        >
          {contenuto}
        </Link>
      ) : (
        <div className={base}>{contenuto}</div>
      )}
    </li>
  );
}

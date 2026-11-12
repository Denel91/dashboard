import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { MiniGrafico } from './grafici';

// Pezzi della Home sul computer (tavola C1 v2, D23), solo da 1024 px:
// riquadri numerici, azioni rapide e la card delle ultime spese. Card di
// vetro (`vetro-card`), confronto col mese prima in una pillola NEUTRA:
// mai verde o rosso, che sono del budget (D17).

export function Riquadro({
  icona: Icona,
  pillola,
  valore,
  etichetta,
  serie,
}: {
  icona: LucideIcon;
  pillola?: ReactNode;
  valore: string;
  etichetta: string;
  serie: number[];
}) {
  return (
    <section className="vetro-card flex flex-col gap-3 rounded-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-campo bg-superficie-2 text-testo">
          <Icona className="size-4.5" />
        </span>
        {pillola && <span className="rounded-capsula bg-superficie-2 px-2 py-0.5 text-didascalia text-testo">{pillola}</span>}
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="flex min-w-0 flex-col">
          <span className="importo text-titolo-2 font-bold">{valore}</span>
          <span className="text-nota text-testo-secondario">{etichetta}</span>
        </p>
        <MiniGrafico valori={serie} />
      </div>
    </section>
  );
}

/** "↗ 6% su ottobre": confronto con lo stesso periodo del mese prima. */
export function Confronto({ punti, mesePrima }: { punti: number; mesePrima: string }) {
  const Freccia = punti >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-0.5">
      <Freccia aria-hidden="true" className="size-3.5" />
      <span className="sr-only">{punti >= 0 ? 'più ' : 'meno '}</span>
      {Math.abs(punti)}% su {mesePrima}
    </span>
  );
}

const STILE_AZIONE =
  'vetro-card flex min-h-14 w-full items-center gap-3 rounded-capsula py-2 pr-4 pl-2 text-left outline-hidden ' +
  'hover:brightness-98 active:opacity-80 data-hovered:brightness-98 data-pressed:opacity-80 ' +
  'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento ' +
  'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2 data-focus-visible:outline-accento';

/** Contenuto di un'azione rapida: icona in un cerchio `accento-tenue`, titolo e riga sotto. */
export function ContenutoAzione({ icona: Icona, titolo, sotto }: { icona: LucideIcon; titolo: string; sotto: string }) {
  return (
    <>
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-capsula bg-accento-tenue text-accento">
        <Icona className="size-4.5" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sottotitolo font-semibold text-testo">{titolo}</span>
        <span className="truncate text-nota text-testo-secondario">{sotto}</span>
      </span>
    </>
  );
}

/** Azione rapida che porta a un'altra pagina (Nuova spesa): un link (sezione 10.2). */
export function AzioneLink({ href, ...contenuto }: { href: string; icona: LucideIcon; titolo: string; sotto: string }) {
  return (
    <Link href={href} className={STILE_AZIONE}>
      <ContenutoAzione {...contenuto} />
    </Link>
  );
}

/** Classi per un'azione rapida che apre una finestra (un Button di React Aria). */
export const stileAzione = STILE_AZIONE;

/** Card "Ultime spese" con "Tutte ›" (C1). */
export function UltimeSpese({ children, vuota }: { children: ReactNode; vuota: boolean }) {
  return (
    <section aria-labelledby="titolo-ultime" className="vetro-card flex flex-col gap-1 rounded-card p-4">
      <div className="flex items-center justify-between gap-3 pb-1">
        <h2 id="titolo-ultime" className="text-titolo-3 font-bold">
          Ultime spese
        </h2>
        <Link
          href="/spese"
          className={
            'flex min-h-11 items-center gap-0.5 rounded-capsula px-2 text-sottotitolo text-accento outline-hidden hover:bg-accento-tenue ' +
            'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento'
          }
        >
          Tutte
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      {vuota ? <p className="py-6 text-center text-sottotitolo text-testo-secondario">Ancora nessuna spesa.</p> : <ul>{children}</ul>}
    </section>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftRight, Ellipsis, HandCoins, History, House, Plus, ReceiptText, Trash2, Wallet, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { voceAttiva } from './barra-in-basso';
import { STILE_ELEMENTO_NOSTRO, hrefNuovaSpesa } from './pulsante-nuova-spesa';

// Barra laterale (D21 e D23, linee guida sezioni 9.2 e 9.8). Sostituisce la
// barra in basso da 768 px:
// - md (768–1023 px): colonna compatta di 88 px attaccata a sinistra, con il
//   ＋ in alto e le 4 voci della barra in basso messe in verticale;
// - lg (da 1024 px): barra estesa di 260 px, galleggiante (staccata di 16 px
//   dai bordi), con "＋ Nuova spesa", Home, Spese, Saldo e il gruppo ALTRO con
//   le pagine di Altro; in fondo il profilo, che apre Impostazioni.
// È vetro (livello della navigazione): sopra il vetro solo `testo`, la voce
// attiva ha la pillola opaca `accento-tenue` con `accento`.

type Voce = { href: string; etichetta: string; Icona: LucideIcon };

const PRINCIPALI: readonly Voce[] = [
  { href: '/', etichetta: 'Home', Icona: House },
  { href: '/spese', etichetta: 'Spese', Icona: ReceiptText },
  { href: '/saldo', etichetta: 'Saldo', Icona: ArrowLeftRight },
];

const ALTRO: Voce = { href: '/altro', etichetta: 'Altro', Icona: Ellipsis };

export const PAGINE_ALTRO: readonly Voce[] = [
  { href: '/altro/cronologia', etichetta: 'Cronologia', Icona: History },
  { href: '/altro/cestino', etichetta: 'Cestino', Icona: Trash2 },
  { href: '/altro/da-riavere', etichetta: 'Da riavere', Icona: HandCoins },
  { href: '/altro/categorie', etichetta: 'Categorie e budget', Icona: Wallet },
];

type Props = {
  /** Nome del nucleo ("Casa nostra"); finché non c'è, l'intestazione mostra solo "Nucleo". */
  nomeNucleo?: string;
  /** Contatori accanto alle pagine di Altro, per href (es. { '/altro/cestino': '1' }). */
  contatori?: Partial<Record<string, string>>;
  /** Profilo in fondo alla barra estesa (iniziali, nome, email): lo passa il layout. */
  profilo?: ReactNode;
};

export function BarraLaterale({ nomeNucleo, contatori = {}, profilo }: Props) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione principale"
      className={
        'vetro fixed inset-y-0 left-0 z-40 hidden w-22 flex-col items-center gap-1 border-y-0 border-l-0 px-2 ' +
        'pt-sicuro-4 pb-4 md:flex ' +
        // lg: estesa e galleggiante
        'lg:inset-y-4 lg:left-4 lg:w-barra-laterale lg:items-stretch lg:rounded-card lg:border-l lg:border-y lg:p-3 ' +
        'lg:shadow-galleggiante'
      }
    >
      {/* Intestazione: solo nella barra estesa */}
      <div className="mb-3 hidden items-center gap-3 px-2 pt-1 lg:flex">
        <IconaApp />
        <div className="min-w-0">
          <p className="truncate text-intestazione">{nomeNucleo ?? 'Nucleo'}</p>
          {nomeNucleo && <p className="text-nota">Nucleo</p>}
        </div>
      </div>

      {/* ＋ / ＋ Nuova spesa (link, sezione 10.2) */}
      <Link
        href={hrefNuovaSpesa(pathname)}
        aria-label="Nuova spesa"
        title="Nuova spesa · N"
        className={
          'mb-3 flex size-13 items-center justify-center gap-2 rounded-capsula bg-accento text-su-accento ' +
          'hover:brightness-110 active:scale-95 lg:mb-4 lg:h-11 lg:w-full lg:size-auto lg:active:scale-98 ' +
          STILE_ELEMENTO_NOSTRO
        }
      >
        <Plus aria-hidden="true" size={22} strokeWidth={2.25} />
        <span className="hidden text-intestazione lg:inline">Nuova spesa</span>
        <kbd className="hidden rounded-md bg-su-accento/20 px-1.5 font-sans text-didascalia lg:inline">N</kbd>
      </Link>

      <ul className="flex w-full flex-col gap-1">
        {PRINCIPALI.map((voce) => (
          <li key={voce.href}>
            <VoceBarra voce={voce} attiva={voceAttiva(pathname, voce.href)} />
          </li>
        ))}
        {/* md: la voce Altro; lg: le sue pagine direttamente nella barra (D23) */}
        <li className="lg:hidden">
          <VoceBarra voce={ALTRO} attiva={voceAttiva(pathname, ALTRO.href)} />
        </li>
      </ul>

      <div className="mt-3 hidden w-full lg:block">
        <p id="barra-altro" className="mb-1 px-3 text-didascalia-2 font-semibold tracking-wide">
          ALTRO
        </p>
        <ul aria-labelledby="barra-altro" className="flex flex-col gap-1">
          {PAGINE_ALTRO.map((voce) => (
            <li key={voce.href}>
              <VoceBarra voce={voce} attiva={voceAttiva(pathname, voce.href)} contatore={contatori[voce.href]} />
            </li>
          ))}
        </ul>
      </div>

      {profilo && <div className="mt-auto hidden w-full lg:block">{profilo}</div>}
    </nav>
  );
}

function VoceBarra({ voce, attiva, contatore }: { voce: Voce; attiva: boolean; contatore?: string }) {
  const { href, etichetta, Icona } = voce;
  return (
    <Link
      href={href}
      aria-current={attiva ? 'page' : undefined}
      className={
        // md: icona con l'etichetta sotto; lg: icona ed etichetta in riga
        'flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-voce px-1 text-didascalia-2 ' +
        'lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-capsula lg:px-3 lg:text-sottotitolo ' +
        (attiva ? 'bg-accento-tenue font-semibold text-accento' : 'text-testo hover:bg-superficie-2/60') +
        ' ' +
        STILE_ELEMENTO_NOSTRO
      }
    >
      <Icona aria-hidden="true" size={20} strokeWidth={attiva ? 2.25 : 1.75} className="shrink-0" />
      <span className="max-w-full truncate">{etichetta}</span>
      {contatore && (
        <span className="ml-auto hidden rounded-capsula bg-superficie-2 px-2 text-didascalia font-normal text-testo lg:inline">
          {contatore}
        </span>
      )}
    </Link>
  );
}

/** L'icona dell'app (src/app/icon.svg), la stessa della scheda del browser e dell'accesso. */
function IconaApp() {
  // eslint-disable-next-line @next/next/no-img-element -- SVG di 36 px, niente ottimizzazione da fare
  return <img src="/icon.svg" alt="" width={36} height={36} className="size-9 shrink-0 rounded-icona-app" />;
}

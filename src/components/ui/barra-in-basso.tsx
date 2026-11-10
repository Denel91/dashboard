'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftRight, Ellipsis, House, ReceiptText, type LucideIcon } from 'lucide-react';
import { PulsanteNuovaSpesa, STILE_ELEMENTO_NOSTRO, hrefNuovaSpesa } from './pulsante-nuova-spesa';

// Barra in basso (linee guida sezioni 2, 3 e 6): capsula galleggiante in
// vetro, staccata dai bordi e sopra la barra di Safari, con il ＋ alla sua
// destra alla stessa altezza (D16). È il solo elemento in vetro dell'app:
// sopra il vetro si usa solo `testo`, la voce attiva ha la pillola opaca
// `accento-tenue` con `accento`. Da 768 px la sostituisce la barra laterale
// (D21, barra-laterale.tsx).

type Voce = { href: string; etichetta: string; Icona: LucideIcon };

export const VOCI_NAVIGAZIONE: readonly Voce[] = [
  { href: '/', etichetta: 'Home', Icona: House },
  { href: '/spese', etichetta: 'Spese', Icona: ReceiptText },
  { href: '/saldo', etichetta: 'Saldo', Icona: ArrowLeftRight },
  { href: '/altro', etichetta: 'Altro', Icona: Ellipsis },
];

/** La Home è attiva solo su "/", le altre voci anche sulle pagine interne. */
export function voceAttiva(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BarraInBasso() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="pointer-events-auto mx-auto flex w-full max-w-md items-center gap-3">
        <nav aria-label="Navigazione principale" className="vetro flex-1 rounded-capsula p-1 shadow-lg shadow-testo/10">
          <ul className="flex">
            {VOCI_NAVIGAZIONE.map(({ href, etichetta, Icona }) => {
              const attiva = voceAttiva(pathname, href);
              return (
                <li key={href} className="flex-1">
                  <Link
                    href={href}
                    aria-current={attiva ? 'page' : undefined}
                    className={
                      'flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-capsula px-1 ' +
                      'text-didascalia-2 ' +
                      (attiva ? 'bg-accento-tenue text-accento' : 'text-testo hover:bg-superficie-2/60') +
                      ' ' +
                      STILE_ELEMENTO_NOSTRO
                    }
                  >
                    <Icona aria-hidden="true" size={22} strokeWidth={attiva ? 2.25 : 1.75} />
                    <span className={attiva ? 'font-semibold' : undefined}>{etichetta}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <PulsanteNuovaSpesa href={hrefNuovaSpesa(pathname)} />
      </div>
    </div>
  );
}

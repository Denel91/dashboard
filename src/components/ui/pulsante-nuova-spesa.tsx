import Link from 'next/link';
import { Plus } from 'lucide-react';

// Pulsante ＋ (D16, linee guida v1.6, sezioni 3 e 10.2): cerchio `accento`
// in basso a destra, alla stessa altezza della barra in basso. Porta alla
// pagina Nuova spesa, quindi è navigazione: un Link di Next.js (prefetch,
// indirizzo condivisibile, tasto Indietro), non un Button di React Aria.
// Regola: se il tocco porta a un'altra pagina è un link, se fa qualcosa
// nella pagina è un Button. Gli stati sono quelli di un elemento nostro
// (active, hover, focus-visible). Il bordo `sfondo` lo stacca dal contenuto
// che passa dietro, anche se è viola.

export const STILE_ELEMENTO_NOSTRO =
  'outline-hidden transition duration-150 ease-out active:opacity-80 ' +
  'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento';

export function PulsanteNuovaSpesa({ href = '/spese/nuova' }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Nuova spesa"
      title="Nuova spesa"
      className={
        'flex size-15 shrink-0 items-center justify-center rounded-capsula bg-accento text-su-accento ' +
        'ring-2 ring-sfondo shadow-lg shadow-accento/30 hover:brightness-110 active:scale-95 ' +
        STILE_ELEMENTO_NOSTRO
      }
    >
      <Plus aria-hidden="true" size={28} strokeWidth={2.25} />
    </Link>
  );
}

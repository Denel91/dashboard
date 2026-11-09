import type { ReactNode } from 'react';

// Card (linee guida sezione 3, tavole 04 e 08a): livello del contenuto,
// opaco, `superficie` e `rounded-card`, nessun bordo. La card del saldo usa il
// colore tenue della persona che deve (D17): `tono="persona-a"` o
// `tono="persona-b"`. Elemento senza comportamento: HTML e Tailwind (10.2).

type Tono = 'normale' | 'persona-a' | 'persona-b';

const SFONDO: Record<Tono, string> = {
  normale: 'bg-superficie',
  'persona-a': 'bg-persona-a-tenue',
  'persona-b': 'bg-persona-b-tenue',
};

export function Card({
  tono = 'normale',
  className,
  children,
}: {
  tono?: Tono;
  /** Solo classi di disposizione (margini, griglia), mai colori o testo. */
  className?: string;
  children: ReactNode;
}) {
  return <div className={['rounded-card p-4', SFONDO[tono], className].filter(Boolean).join(' ')}>{children}</div>;
}

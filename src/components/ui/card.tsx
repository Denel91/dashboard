import type { ReactNode } from 'react';

// Card (linee guida sezione 3, tavole 04 e 08a): livello del contenuto,
// `superficie` e `rounded-card`. Opaca sul telefono; da 1024 px vetro leggero
// con la classe `vetro-card` (D23, sezione 9.8). La card del saldo usa il
// colore tenue della persona che deve (D17): `tono="persona-a"` o
// `tono="persona-b"`. Elemento senza comportamento: HTML e Tailwind (10.2).

type Tono = 'normale' | 'persona-a' | 'persona-b';

const SFONDO: Record<Tono, string> = {
  normale: 'vetro-card',
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

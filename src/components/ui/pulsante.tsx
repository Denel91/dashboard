'use client';

import { Button, type ButtonProps } from 'react-aria-components';

// Pulsanti delle linee guida iOS 27 (sezione 3), costruiti sul Button di
// React Aria (D22): tocco, mouse e tastiera, stati data-pressed,
// data-hovered, data-focus-visible, data-disabled e data-pending.
// Solo token: nessun colore, raggio o dimensione del testo scritti a mano.

type PropsPulsante = Omit<ButtonProps, 'className' | 'style'> & {
  /** Solo classi di disposizione (larghezza, margini), mai colori o testo. */
  className?: string;
};

// In comune: area di tocco ≥ 44 px, feedback al tocco, anello di focus da
// tastiera, stato disattivato e "in corso" (Server Action che lavora).
const BASE =
  'inline-flex cursor-pointer select-none items-center justify-center gap-2 outline-hidden ' +
  'transition duration-150 ease-out ' +
  'data-pressed:scale-98 data-pressed:opacity-80 ' +
  'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2 data-focus-visible:outline-accento ' +
  'data-disabled:cursor-default data-disabled:opacity-40 ' +
  'data-pending:cursor-wait data-pending:opacity-70';

// Capsula piena, alta 50 px: sul telefono larga quanto il contenuto meno i
// margini; da 768 px larga quanto il testo, in basso a destra (sezione 9.4)
const PIENO = 'h-12.5 w-full rounded-capsula px-6 text-intestazione md:w-auto md:min-w-32 md:px-8';

function unisci(...classi: (string | undefined)[]) {
  return classi.filter(Boolean).join(' ');
}

/** Salva, Conferma, Crea, Entra: capsula piena `accento`. */
export function PulsantePrincipale({ className, ...props }: PropsPulsante) {
  return (
    <Button
      {...props}
      className={unisci(BASE, PIENO, 'bg-accento text-su-accento data-hovered:brightness-110', className)}
    />
  );
}

/** Copia link, Vai al saldo (F6), Aggiungi categoria: capsula `accento-tenue`. */
export function PulsanteSecondario({ className, ...props }: PropsPulsante) {
  return (
    <Button
      {...props}
      className={unisci(
        BASE,
        'min-h-11 rounded-capsula bg-accento-tenue px-5 text-intestazione text-accento data-hovered:brightness-95',
        className,
      )}
    />
  );
}

/** Annulla, Ripristina, Segna come restituito: solo testo `accento`. */
export function PulsanteTesto({ className, ...props }: PropsPulsante) {
  return (
    <Button
      {...props}
      className={unisci(
        BASE,
        'min-h-11 min-w-11 rounded-capsula px-2 text-corpo text-accento data-hovered:opacity-80',
        className,
      )}
    />
  );
}

type PropsDistruttivo = PropsPulsante & {
  /**
   * `testo` (predefinito): Elimina, Annulla il rimborso nelle schermate.
   * `pieno`: il pulsante di conferma nelle finestre F5 e F6.
   */
  variante?: 'testo' | 'pieno';
};

/** Elimina, Annulla il rimborso, Cancella account: colore `pericolo`. */
export function PulsanteDistruttivo({ variante = 'testo', className, ...props }: PropsDistruttivo) {
  const aspetto =
    variante === 'pieno'
      ? unisci(PIENO, 'bg-pericolo text-su-pericolo data-hovered:brightness-110')
      : 'min-h-11 min-w-11 rounded-capsula px-2 text-corpo text-pericolo data-hovered:opacity-80';
  return <Button {...props} className={unisci(BASE, aspetto, className)} />;
}

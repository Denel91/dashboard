'use client';

import type { ReactNode } from 'react';
import { Switch } from 'react-aria-components';

// Interruttore (linee guida sezione 3): Switch di React Aria con l'aspetto di
// iOS. Acceso = `accento`, mai il verde di iOS, che è del budget (D17).
// Tutta la riga è toccabile, come nelle Impostazioni di iOS.

export function Interruttore({
  children,
  nota,
  attivo,
  attivoIniziale,
  onChange,
  name,
  isDisabled,
}: {
  children: ReactNode;
  /** Riga sotto l'etichetta, per esempio la conseguenza sul saldo. */
  nota?: ReactNode;
  attivo?: boolean;
  attivoIniziale?: boolean;
  onChange?: (attivo: boolean) => void;
  /** Nome del campo nel FormData: vale "on" quando è acceso. */
  name?: string;
  isDisabled?: boolean;
}) {
  return (
    <Switch
      isSelected={attivo}
      defaultSelected={attivoIniziale}
      onChange={onChange}
      name={name}
      isDisabled={isDisabled}
      className={
        'group flex min-h-12 cursor-pointer select-none items-center justify-between gap-4 rounded-campo bg-superficie-2 px-4 py-2 ' +
        'outline-hidden data-disabled:cursor-default data-disabled:opacity-40 ' +
        'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2 data-focus-visible:outline-accento'
      }
    >
      <span className="flex flex-col">
        <span className="text-corpo text-testo">{children}</span>
        {nota && <span className="text-nota text-testo-secondario">{nota}</span>}
      </span>
      <span
        aria-hidden
        className={
          'relative h-7.75 w-12.75 shrink-0 rounded-capsula bg-separatore transition-colors duration-200 ' +
          'group-data-selected:bg-accento'
        }
      >
        <span
          className={
            'absolute top-0.5 left-0.5 size-6.75 rounded-capsula bg-white shadow-sm transition-transform duration-200 ' +
            'group-data-selected:translate-x-5 motion-reduce:transition-none'
          }
        />
      </span>
    </Switch>
  );
}

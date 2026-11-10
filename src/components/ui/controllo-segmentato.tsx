'use client';

import type { ReactNode } from 'react';
import { Label, Radio, RadioGroup } from 'react-aria-components';

// Controllo segmentato (linee guida sezione 3): RadioGroup + Radio di React
// Aria. Binario `superficie-2`, segmento scelto `superficie` con ombra
// leggera, tutto `rounded-capsula`. Frecce ← → per cambiare segmento.
// Con `name` il valore va anche nel FormData della Server Action.

export type OpzioneSegmento<T extends string> = {
  valore: T;
  /** Contenuto visibile: testo, o testo con l'iniziale della persona. */
  etichetta: ReactNode;
};

export function ControlloSegmentato<T extends string>({
  etichetta,
  etichettaVisibile = true,
  opzioni,
  valore,
  valoreIniziale,
  onChange,
  name,
  sfondo = 'pagina',
}: {
  etichetta: string;
  /** false: l'etichetta resta solo per i lettori di schermo. */
  etichettaVisibile?: boolean;
  opzioni: OpzioneSegmento<T>[];
  valore?: T;
  valoreIniziale?: T;
  onChange?: (valore: T) => void;
  name?: string;
  sfondo?: 'pagina' | 'foglio';
}) {
  return (
    <RadioGroup
      value={valore}
      defaultValue={valoreIniziale}
      onChange={onChange ? (v) => onChange(v as T) : undefined}
      name={name}
      orientation="horizontal"
      className="flex flex-col gap-1.5"
    >
      <Label className={etichettaVisibile ? 'px-1 text-nota text-testo-secondario' : 'sr-only'}>{etichetta}</Label>
      <div
        className={
          'flex min-h-11 gap-0.5 rounded-capsula p-0.5 ' + (sfondo === 'foglio' ? 'bg-superficie' : 'bg-superficie-2')
        }
      >
        {opzioni.map((o) => (
          <Radio
            key={o.valore}
            value={o.valore}
            className={
              'flex min-h-10 flex-1 cursor-pointer select-none items-center justify-center gap-2 rounded-capsula px-3 ' +
              'text-sottotitolo text-testo outline-hidden transition duration-150 ' +
              'data-selected:bg-superficie data-selected:font-semibold data-selected:shadow-sm ' +
              (sfondo === 'foglio' ? 'data-selected:bg-superficie-2 ' : '') +
              'data-pressed:opacity-80 ' +
              'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2 data-focus-visible:outline-accento'
            }
          >
            {o.etichetta}
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
}

'use client';

import { useRef } from 'react';
import { FieldError, Input, Label, TextField, type TextFieldProps } from 'react-aria-components';

// Importo di Nuova spesa e Modifica spesa (tavola 06, US-10): primo campo,
// grande e al centro (`text-importo`), con il tastierino decimale, in una
// card bianca che si colora di `accento` quando il campo è attivo. Un tocco
// in qualsiasi punto della card porta nel campo.
// Il testo resta com'è scritto ("47,30"): la conversione in centesimi la fa
// solo src/lib/money.ts (K6), nella Server Action.

export function CampoImporto({
  autoFocus,
  ...props
}: Omit<TextFieldProps, 'className' | 'children'> & { autoFocus?: boolean }) {
  const campo = useRef<HTMLInputElement>(null);
  return (
    <TextField {...props} className="flex flex-col items-center gap-1">
      <Label className="sr-only">Importo</Label>
      <div
        onMouseDown={(e) => {
          if (e.target !== campo.current) {
            e.preventDefault();
            campo.current?.focus();
          }
        }}
        className={
          'flex w-full cursor-text items-baseline justify-center gap-1 rounded-card border-2 border-transparent bg-superficie px-4 py-3 ' +
          'focus-within:border-accento has-data-invalid:border-pericolo'
        }
      >
        <Input
          ref={campo}
          autoFocus={autoFocus}
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          placeholder="0,00"
          size={7}
          className={
            // Largo quanto il testo, così "42,50 €" resta al centro; dove
            // field-sizing manca, una larghezza fissa
            'importo w-[7ch] max-w-[10ch] min-w-[3ch] [field-sizing:content] supports-[field-sizing:content]:w-auto ' +
            'bg-transparent text-right text-importo text-testo caret-accento outline-hidden ' +
            'placeholder:text-testo-secondario/50 data-invalid:text-pericolo'
          }
        />
        <span aria-hidden className="text-importo font-normal text-testo-secondario/70">
          €
        </span>
      </div>
      <FieldError className="text-nota text-pericolo" />
    </TextField>
  );
}

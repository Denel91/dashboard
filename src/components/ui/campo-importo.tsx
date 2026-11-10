'use client';

import { FieldError, Input, Label, TextField, type TextFieldProps } from 'react-aria-components';

// Importo di Nuova spesa e Modifica spesa (tavola 06, US-10): primo campo,
// grande e al centro (`text-importo`), con il tastierino decimale.
// Il testo resta com'è scritto ("47,30"): la conversione in centesimi la fa
// solo src/lib/money.ts (K6), nella Server Action.

export function CampoImporto({
  autoFocus,
  ...props
}: Omit<TextFieldProps, 'className' | 'children'> & { autoFocus?: boolean }) {
  return (
    <TextField {...props} className="flex flex-col items-center gap-1">
      <Label className="text-nota text-testo-secondario">Importo</Label>
      <div className="flex items-baseline justify-center gap-2">
        <Input
          autoFocus={autoFocus}
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          placeholder="0,00"
          size={7}
          className={
            'importo w-[7ch] min-w-0 bg-transparent text-right text-importo text-testo caret-accento outline-hidden ' +
            'placeholder:text-testo-secondario/50 data-invalid:text-pericolo'
          }
        />
        <span aria-hidden className="text-importo text-testo">
          €
        </span>
      </div>
      <FieldError className="text-nota text-pericolo" />
    </TextField>
  );
}

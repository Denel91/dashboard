'use client';

import type { ReactNode } from 'react';
import { FieldError, Form, Input, Label, Text, TextField, type FormProps, type TextFieldProps } from 'react-aria-components';

// Campi e moduli (linee guida sezioni 3 e 10.1): TextField + Label + Input +
// Text (nota) + FieldError di React Aria. L'errore resta collegato al suo
// campo, anche per i lettori di schermo. `superficie` sulle pagine,
// `superficie-2` dentro i fogli.

type PropsCampo = Omit<TextFieldProps, 'className' | 'children'> & {
  etichetta: string;
  nota?: ReactNode;
  segnaposto?: string;
  /** `pagina` (predefinito): campo `superficie`; `foglio`: campo `superficie-2`. */
  sfondo?: 'pagina' | 'foglio';
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  className?: string;
};

export function CampoTesto({ etichetta, nota, segnaposto, sfondo = 'pagina', inputMode, className, ...props }: PropsCampo) {
  return (
    <TextField {...props} className={['flex flex-col gap-1.5', className].filter(Boolean).join(' ')}>
      <Label className="px-1 text-nota text-testo-secondario">{etichetta}</Label>
      <Input
        placeholder={segnaposto}
        inputMode={inputMode}
        className={
          'h-12 w-full rounded-campo px-4 text-corpo text-testo outline-hidden ring-1 ring-separatore transition ' +
          'placeholder:text-testo-secondario/70 ' +
          (sfondo === 'foglio' ? 'bg-superficie-2 ring-transparent ' : 'bg-superficie ') +
          'data-focused:ring-2 data-focused:ring-accento data-invalid:ring-2 data-invalid:ring-pericolo ' +
          'data-disabled:opacity-50'
        }
      />
      {nota && <Text slot="description" className="px-1 text-nota text-testo-secondario">{nota}</Text>}
      <FieldError className="px-1 text-nota text-pericolo" />
    </TextField>
  );
}

/**
 * Modulo collegato a una Server Action (sezione 10.1): `action` è la funzione
 * di useActionState, `validationErrors` gli errori per campo restituiti dal
 * server (Zod), che compaiono sotto ciascun campo.
 */
export function Modulo({ className, ...props }: Omit<FormProps, 'className'> & { className?: string }) {
  return <Form {...props} className={['flex flex-col gap-4', className].filter(Boolean).join(' ')} />;
}

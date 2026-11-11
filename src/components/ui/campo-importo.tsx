'use client';

import { X } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { Button, FieldError, Input, Label, Text, TextField, type TextFieldProps } from 'react-aria-components';

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
      {/* Nelle tavole C2 e C3 l'etichetta si vede, sopra l'importo senza card */}
      <Label className="sr-only largo:not-sr-only largo:text-nota largo:text-testo-secondario">Importo</Label>
      <div
        onMouseDown={(e) => {
          if (e.target !== campo.current) {
            e.preventDefault();
            campo.current?.focus();
          }
        }}
        className={
          'flex w-full cursor-text items-baseline justify-center gap-1 rounded-card border-2 border-transparent bg-superficie px-4 py-3 ' +
          'focus-within:border-accento has-data-invalid:border-pericolo ' +
          'largo:bg-transparent largo:py-0 largo:focus-within:border-transparent'
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
        <span aria-hidden className="text-importo font-normal text-testo-secondario/70 largo:font-bold largo:text-testo">
          €
        </span>
      </div>
      <FieldError className="text-nota text-pericolo" />
    </TextField>
  );
}

/**
 * Importo dentro un foglio (tavola 08b, "Segna come saldato"): campo
 * `superficie-2` con l'etichetta sopra, il valore in `text-intestazione`
 * seguito da "€" e la ✕ a destra per svuotarlo, come i campi di iOS.
 * Controllato: serve `value` e `onChange`, perché la ✕ svuota il valore.
 */
export function CampoImportoFoglio({
  etichetta = 'Importo',
  nota,
  value,
  onChange,
  ...props
}: Omit<TextFieldProps, 'className' | 'children' | 'value' | 'onChange'> & {
  etichetta?: string;
  nota?: ReactNode;
  value: string;
  onChange: (valore: string) => void;
}) {
  const campo = useRef<HTMLInputElement>(null);
  return (
    <TextField {...props} value={value} onChange={onChange} className="flex flex-col gap-1.5">
      <Label className="px-1 text-nota text-testo-secondario">{etichetta}</Label>
      <div
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            campo.current?.focus();
          }
        }}
        className={
          'flex h-12 w-full cursor-text items-center rounded-campo bg-superficie-2 pl-4 ring-transparent outline-hidden transition ' +
          'focus-within:ring-2 focus-within:ring-accento has-data-invalid:ring-2 has-data-invalid:ring-pericolo'
        }
      >
        <Input
          ref={campo}
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          placeholder="0,00"
          size={6}
          className={
            'importo w-[6ch] max-w-[12ch] min-w-[2ch] [field-sizing:content] supports-[field-sizing:content]:w-auto ' +
            'bg-transparent text-intestazione text-testo caret-accento outline-hidden placeholder:text-testo-secondario/60'
          }
        />
        <span aria-hidden className="pl-1 text-intestazione text-testo">
          €
        </span>
        <span className="flex-1" onMouseDown={(e) => { e.preventDefault(); campo.current?.focus(); }} />
        {value !== '' && (
          <Button
            aria-label={`Svuota ${etichetta.toLocaleLowerCase('it-IT')}`}
            excludeFromTabOrder
            onPress={() => {
              onChange('');
              campo.current?.focus();
            }}
            className={
              'flex size-11 shrink-0 items-center justify-center rounded-capsula text-testo-secondario outline-hidden ' +
              'data-hovered:text-testo data-pressed:opacity-60'
            }
          >
            <X aria-hidden className="size-4.5" />
          </Button>
        )}
      </div>
      {nota && (
        <Text slot="description" className="px-1 text-nota text-testo-secondario">
          {nota}
        </Text>
      )}
      <FieldError className="px-1 text-nota text-pericolo" />
    </TextField>
  );
}

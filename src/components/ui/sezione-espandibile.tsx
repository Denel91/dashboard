'use client';

import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, Disclosure, DisclosurePanel, Heading } from 'react-aria-components';

// Sezione che si apre e si chiude (tavola 06, "Altro" di Nuova spesa):
// Disclosure di React Aria. Da chiusa mostra cosa contiene ("Descrizione,
// pagamento, nota"), così si sa cosa c'è dentro senza aprirla.
// I campi dentro restano nel form anche da chiusa (DisclosurePanel li
// nasconde, non li toglie), quindi i valori arrivano alla Server Action.

export function SezioneEspandibile({
  titolo,
  riassunto,
  apertaIniziale,
  children,
}: {
  titolo: string;
  riassunto?: string;
  apertaIniziale?: boolean;
  children: ReactNode;
}) {
  return (
    <Disclosure defaultExpanded={apertaIniziale} className="group rounded-campo bg-superficie-2">
      <Heading className="m-0">
        <Button
          slot="trigger"
          className={
            'flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-campo px-4 text-left outline-hidden ' +
            'data-pressed:opacity-80 ' +
            'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2 data-focus-visible:outline-accento'
          }
        >
          <span className="text-corpo text-testo">{titolo}</span>
          <span className="flex items-center gap-1 text-nota text-testo-secondario">
            {riassunto}
            <ChevronDown
              aria-hidden
              className="size-4 transition-transform duration-200 group-data-expanded:rotate-180 motion-reduce:transition-none"
            />
          </span>
        </Button>
      </Heading>
      <DisclosurePanel className="flex flex-col gap-4 px-4 pb-4">
        {children}
      </DisclosurePanel>
    </Disclosure>
  );
}

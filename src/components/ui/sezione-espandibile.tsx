'use client';

import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, Disclosure, DisclosurePanel } from 'react-aria-components';

// Sezione che si apre e si chiude (tavole 06 e 07, "Altro" di Nuova spesa):
// Disclosure di React Aria. Il pulsante è una capsula "Altro ⌄" accanto a un
// altro campo (`accanto`, la data nella tavola 06); il contenuto si apre
// sotto la riga, in una card. `riassunto` dice ai lettori di schermo cosa c'è
// dentro ("Descrizione, pagamento, nota").
// I campi dentro restano nel form anche da chiusa (DisclosurePanel li
// nasconde, non li toglie), quindi i valori arrivano alla Server Action.

export function SezioneEspandibile({
  titolo,
  riassunto,
  apertaIniziale,
  accanto,
  children,
}: {
  titolo: string;
  riassunto?: string;
  apertaIniziale?: boolean;
  /** Il campo a sinistra del pulsante, sulla stessa riga. */
  accanto?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Disclosure defaultExpanded={apertaIniziale} className="group flex flex-col gap-3">
      <div className="flex items-start gap-2">
        {accanto}
        <Button
          slot="trigger"
          aria-label={riassunto ? `${titolo}: ${riassunto}` : titolo}
          className={
            'ml-auto flex h-11 shrink-0 cursor-pointer items-center gap-1 rounded-capsula bg-superficie px-4 text-corpo font-semibold text-testo outline-hidden ' +
            'data-hovered:brightness-95 data-pressed:opacity-80 ' +
            'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2 data-focus-visible:outline-accento'
          }
        >
          {titolo}
          <ChevronDown
            aria-hidden
            className="size-4 transition-transform duration-200 group-data-expanded:rotate-180 motion-reduce:transition-none"
          />
        </Button>
      </div>
      {/* Il margine sta dentro: da chiuso il pannello resta nel DOM (hidden),
          e un padding sul pannello lascerebbe uno spazio vuoto */}
      <DisclosurePanel>
        <div className="flex flex-col gap-4 rounded-card bg-superficie p-4">{children}</div>
      </DisclosurePanel>
    </Disclosure>
  );
}

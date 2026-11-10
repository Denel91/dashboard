'use client';

import { CalendarDays } from 'lucide-react';
import { useId, useState } from 'react';
import { etichettaData } from '@/lib/date';

// Data della spesa (tavole 06 e 07, US-10, US-11): una capsula con
// "Data  Oggi · 04/11/2026", come nei wireframe. Sotto c'è un
// <input type="date"> NATIVO e trasparente, grande quanto la capsula
// (linee guida sezione 10.2): il tocco apre il selettore di iOS, e il valore
// si legge sempre gg/mm/aaaa (NF-03), qualunque sia la lingua del browser.
// "Oggi" lo calcola la pagina sul server con oggiIso() di src/lib/date.ts e
// lo passa qui: con cacheComponents un `new Date()` in un Client Component
// finirebbe nel prerender.

export function CampoData({
  name,
  oggi,
  valoreIniziale,
  errore,
}: {
  name: string;
  /** Data di oggi (AAAA-MM-GG), da oggiIso() sul server. */
  oggi: string;
  valoreIniziale?: string;
  errore?: string;
}) {
  const id = useId();
  const [valore, setValore] = useState(valoreIniziale ?? oggi);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div
        className={
          'relative flex h-11 items-center gap-2 rounded-capsula bg-superficie px-4 text-corpo text-testo ' +
          'focus-within:ring-2 focus-within:ring-accento ' +
          (errore ? 'ring-2 ring-pericolo' : '')
        }
      >
        <CalendarDays aria-hidden className="size-4.5 shrink-0 text-testo-secondario" />
        <span aria-hidden className="text-testo-secondario">
          Data
        </span>
        <span aria-hidden className="truncate font-semibold">
          {valore ? etichettaData(valore, oggi) : 'Scegli'}
        </span>
        <input
          id={id}
          type="date"
          name={name}
          required
          max={oggi}
          value={valore}
          aria-label={`Data: ${valore ? etichettaData(valore, oggi) : 'da scegliere'}`}
          onChange={(e) => setValore(e.target.value)}
          // Sul computer il selettore si apre solo dall'icona del browser: qui da tutta la capsula
          onClick={(e) => {
            try {
              e.currentTarget.showPicker?.();
            } catch {
              // Alcuni browser lo rifiutano: resta il selettore normale
            }
          }}
          aria-invalid={errore ? true : undefined}
          aria-describedby={errore ? `${id}-errore` : undefined}
          className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
        />
      </div>
      {errore && (
        <p id={`${id}-errore`} className="px-1 text-nota text-pericolo">
          {errore}
        </p>
      )}
    </div>
  );
}

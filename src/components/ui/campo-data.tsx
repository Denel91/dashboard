'use client';

import { useId, useState } from 'react';

// Data della spesa (tavola 06, US-10, US-11): <input type="date"> NATIVO
// (linee guida sezione 10.2). Su iPhone apre il selettore di iOS. Già su
// oggi; accanto compare "oggi" finché resta la data di oggi.
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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="px-1 text-nota text-testo-secondario">
        Data
      </label>
      <div className="relative">
        <input
          id={id}
          type="date"
          name={name}
          required
          max={oggi}
          value={valore}
          onChange={(e) => setValore(e.target.value)}
          aria-invalid={errore ? true : undefined}
          aria-describedby={errore ? `${id}-errore` : undefined}
          className={
            'h-11 w-full rounded-capsula bg-superficie-2 px-4 text-corpo text-testo outline-hidden ' +
            'focus-visible:ring-2 focus-visible:ring-accento aria-invalid:ring-2 aria-invalid:ring-pericolo'
          }
        />
        {valore === oggi && (
          <span className="pointer-events-none absolute top-1/2 right-12 -translate-y-1/2 text-nota text-testo-secondario">
            oggi
          </span>
        )}
      </div>
      {errore && (
        <p id={`${id}-errore`} className="px-1 text-nota text-pericolo">
          {errore}
        </p>
      )}
    </div>
  );
}

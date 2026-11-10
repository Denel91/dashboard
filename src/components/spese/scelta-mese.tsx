'use client';

import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Mese } from '@/lib/date';

// Mese dell'elenco (tavola 05): la capsula "Novembre ⌄". È un <select>
// nativo (linee guida sezione 10.2): su iPhone apre la ruota di iOS, sul
// computer l'elenco del browser, e funziona con la tastiera. Scegliendo un
// mese si va a /spese?mese=AAAA-MM. Le capsule Categoria e Persona arrivano
// con i filtri di US-41 (Sprint 7).

export function SceltaMese({ mese, mesi }: { mese: Mese; mesi: { valore: Mese; nome: string }[] }) {
  const router = useRouter();
  const [inCorso, avvia] = useTransition();

  return (
    <label
      className={
        'relative inline-flex h-9 items-center gap-1 self-start rounded-capsula bg-superficie pr-3 pl-3.5 text-sottotitolo font-semibold text-testo ' +
        'ring-1 ring-inset ring-separatore focus-within:ring-2 focus-within:ring-accento ' +
        (inCorso ? 'opacity-70' : '')
      }
    >
      <span className="sr-only">Mese</span>
      <span aria-hidden className="first-letter:uppercase">
        {mesi.find((m) => m.valore === mese)?.nome}
      </span>
      <ChevronDown aria-hidden className="size-4" />
      <select
        value={mese}
        onChange={(e) => avvia(() => router.push(`/spese?mese=${e.target.value}`))}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
      >
        {mesi.map((m) => (
          <option key={m.valore} value={m.valore}>
            {m.nome.charAt(0).toLocaleUpperCase('it-IT') + m.nome.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}

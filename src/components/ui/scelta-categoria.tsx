'use client';

import { useState } from 'react';
import { Label, ToggleButton, ToggleButtonGroup } from 'react-aria-components';
import { CATEGORIE_IN_EVIDENZA } from '@/lib/categorie';
import { SimboloCategoria } from './icona-categoria';

// Scelta della categoria in Nuova spesa e Modifica spesa (tavola 06, D24):
// chip di ToggleButtonGroup (scelta singola). Si vedono le prime 8 per
// `ordine`, più quella scelta se sta tra le altre, e il chip
// "Altre categorie" che mostra tutte le altre: meno chip da scorrere, e
// l'inserimento resta sotto i 10 secondi (NF-02).
// Toccare di nuovo il chip scelto lo toglie: la categoria è facoltativa.

export type CategoriaScelta = { id: string; nome: string; icona: string };

const CHIP =
  'inline-flex min-h-9 cursor-pointer select-none items-center gap-1.5 rounded-capsula px-3.5 py-1.5 ' +
  'text-sottotitolo outline-hidden transition duration-150 ' +
  // Bianche col bordo sottile sullo sfondo grigio del modulo (tavola 06)
  'bg-superficie text-testo ring-1 ring-inset ring-separatore data-hovered:brightness-95 data-pressed:opacity-80 ' +
  'data-selected:bg-accento data-selected:text-su-accento data-selected:ring-0 ' +
  'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2 data-focus-visible:outline-accento';

export function SceltaCategoria({
  categorie,
  valore,
  valoreIniziale = null,
  onChange,
  name,
  inEvidenza = CATEGORIE_IN_EVIDENZA,
}: {
  /** Già ordinate per `ordine`, senza quelle archiviate. */
  categorie: CategoriaScelta[];
  valore?: string | null;
  valoreIniziale?: string | null;
  onChange?: (id: string | null) => void;
  /** Nome del campo nel FormData: l'id della categoria, vuoto se nessuna. */
  name?: string;
  inEvidenza?: number;
}) {
  const [interno, setInterno] = useState<string | null>(valoreIniziale);
  const scelta = valore !== undefined ? valore : interno;
  const [tutte, setTutte] = useState(false);

  const visibili = tutte
    ? categorie
    : categorie.filter((c, i) => i < inEvidenza || c.id === scelta);
  const nascoste = categorie.length - visibili.length;

  function cambia(chiavi: Set<string | number>) {
    const id = chiavi.size ? String([...chiavi][0]) : null;
    setInterno(id);
    onChange?.(id);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label id="etichetta-categoria" className="px-1 text-nota text-testo-secondario">
        Categoria
      </Label>
      <div className="flex flex-wrap gap-2">
        <ToggleButtonGroup
          aria-labelledby="etichetta-categoria"
          selectionMode="single"
          selectedKeys={scelta ? [scelta] : []}
          onSelectionChange={cambia}
          className="contents"
        >
          {visibili.map((c) => (
            <ToggleButton key={c.id} id={c.id} className={CHIP}>
              <SimboloCategoria icona={c.icona} />
              {c.nome}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {categorie.length > inEvidenza && (
          <button
            type="button"
            aria-expanded={tutte}
            onClick={() => setTutte((t) => !t)}
            className={
              'inline-flex min-h-9 cursor-pointer select-none items-center rounded-capsula px-3.5 py-1.5 ' +
              'text-sottotitolo text-accento outline-hidden hover:bg-accento-tenue active:opacity-80 ' +
              'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento'
            }
          >
            {tutte ? 'Meno categorie' : `Altre categorie (${nascoste})`}
          </button>
        )}
      </div>
      {name && <input type="hidden" name={name} value={scelta ?? ''} />}
    </div>
  );
}

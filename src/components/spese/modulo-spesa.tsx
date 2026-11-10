'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useActionState, useEffect, useState, type ReactNode } from 'react';
import type { StatoSpesa } from '@/app/actions/spese';
import {
  CampoData,
  CampoImporto,
  CampoTesto,
  ControlloSegmentato,
  Iniziale,
  Interruttore,
  Modulo,
  PulsantePrincipale,
  SceltaCategoria,
  SezioneEspandibile,
  mostraAvviso,
  type CategoriaScelta,
} from '@/components/ui';
import { centesimiPerCampo, euroInCentesimi } from '@/lib/money';
import type { Membro } from '@/lib/nucleo/corrente';
import { anteprimaSpesa } from '@/lib/spese/testi';

// Modulo di Nuova spesa (tavola 06; da 768 px finestra al centro, tavola C3).
// Ordine dei campi della tavola: importo, chi ha pagato e data, "Per
// l'altra persona", categoria, "Altro" (descrizione, pagamento, nota),
// anteprima, Salva. Già impostati: oggi, "pagato da me", a metà (US-10).

type Azione = (stato: StatoSpesa, dati: FormData) => Promise<StatoSpesa>;

/** Valori di una spesa già salvata, per Modifica spesa (tavola 07). */
export type ValoriSpesa = {
  importoCentesimi: number;
  pagataDa: string;
  perAltraPersona: boolean;
  categoriaId: string | null;
  dataSpesa: string;
  descrizione: string | null;
  metodoPagamento: 'carta' | 'contanti' | 'bonifico';
  note: string | null;
};

export function ModuloSpesa({
  azione,
  titolo,
  membri,
  io,
  categorie,
  oggi,
  dopo,
  iniziale,
  nascosti,
  azioniTitolo,
  dettagli,
}: {
  azione: Azione;
  titolo: string;
  membri: Membro[];
  io: Membro;
  categorie: CategoriaScelta[];
  /** Data di oggi (AAAA-MM-GG) nel fuso italiano, dal server. */
  oggi: string;
  /** Dove tornare dopo Salva, Annulla, ✕ ed Esc. */
  dopo: string;
  /** Modifica spesa: i valori salvati (senza, è Nuova spesa). */
  iniziale?: ValoriSpesa;
  /** Campi nascosti per la Server Action (id e data_modifica in Modifica spesa). */
  nascosti?: Record<string, string>;
  /** A destra del titolo, per esempio Elimina (tavole 07 e C2). */
  azioniTitolo?: ReactNode;
  /** Sotto i campi, per esempio "Creata da Simona il 03/11/2026". */
  dettagli?: ReactNode;
}) {
  const router = useRouter();
  const [stato, invia, inCorso] = useActionState(azione, {});
  const [importo, setImporto] = useState(iniziale ? centesimiPerCampo(iniziale.importoCentesimi) : '');
  const [pagataDa, setPagataDa] = useState(iniziale?.pagataDa ?? io.id);
  const [perAltra, setPerAltra] = useState(iniziale?.perAltraPersona ?? false);
  const altroCompilato = !!iniziale && (!!iniziale.descrizione || !!iniziale.note || iniziale.metodoPagamento !== 'carta');

  const altra = membri.find((m) => !m.sonoIo) ?? null;
  const anteprima = altra
    ? anteprimaSpesa(euroInCentesimi(importo), pagataDa === io.id, perAltra ? 'per_altra_persona' : 'a_meta', altra.nome)
    : null;

  // Salvata: avviso F7 e ritorno alla pagina di prima, con i dati aggiornati
  useEffect(() => {
    if (!stato.salvata) return;
    mostraAvviso(stato.salvata.avviso);
    router.replace(dopo);
    router.refresh();
  }, [stato, dopo, router]);

  // Esc chiude, come le finestre (linee guida, sezione 9.5)
  useEffect(() => {
    function tasto(e: KeyboardEvent) {
      // Non se Esc chiude prima una finestra aperta sopra (F5)
      if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('[role="dialog"], [role="alertdialog"]'))
        router.replace(dopo);
    }
    window.addEventListener('keydown', tasto);
    return () => window.removeEventListener('keydown', tasto);
  }, [dopo, router]);

  return (
    <Modulo
      // onSubmit e non action: con action React svuota il modulo dopo ogni
      // invio, e dopo un errore si perderebbe quello che si è scritto
      onSubmit={(e) => {
        e.preventDefault();
        const dati = new FormData(e.currentTarget);
        startTransition(() => invia(dati));
      }}
      validationErrors={stato.errori}
      className="min-h-dvh gap-0 md:min-h-0"
    >
      {/* Titolo al centro e ✕ a sinistra (linee guida sezione 3, schermate modali) */}
      <header className="sticky top-0 z-10 grid grid-cols-[5.5rem_1fr_5.5rem] items-center border-b border-separatore bg-superficie px-2 pt-[env(safe-area-inset-top)] md:static md:pt-0">
        <Link
          href={dopo}
          replace
          aria-label="Chiudi"
          className={
            'flex size-11 items-center justify-center rounded-capsula text-testo outline-hidden hover:bg-superficie-2 active:opacity-70 ' +
            'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento'
          }
        >
          <X aria-hidden className="size-5" />
        </Link>
        <h1 className="py-3 text-center text-intestazione">{titolo}</h1>
        <div className="flex justify-end">{azioniTitolo}</div>
      </header>
      {nascosti && Object.entries(nascosti).map(([nome, valore]) => <input key={nome} type="hidden" name={nome} value={valore} />)}

      <div className="flex flex-1 flex-col gap-5 px-4 pt-5 pb-6 md:px-6">
        <CampoImporto
          name="importo"
          value={importo}
          onChange={setImporto}
          isRequired
          autoFocus={!iniziale}
          validationBehavior="aria"
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          {altra ? (
            <ControlloSegmentato
              etichetta="Chi ha pagato"
              name="pagata_da"
              valore={pagataDa}
              onChange={setPagataDa}
              opzioni={[
                { valore: io.id, etichetta: <><Iniziale nome={io.nome} persona={io.persona} dimensione="piccola" decorativa />Io</> },
                { valore: altra.id, etichetta: <><Iniziale nome={altra.nome} persona={altra.persona} dimensione="piccola" decorativa />{altra.nome}</> },
              ]}
            />
          ) : (
            <input type="hidden" name="pagata_da" value={io.id} />
          )}
          <CampoData
            name="data_spesa"
            oggi={oggi}
            valoreIniziale={iniziale?.dataSpesa}
            errore={stato.errori?.data_spesa}
          />
        </div>

        {altra && (
          <Interruttore
            name="per_altra_persona"
            attivo={perAltra}
            onChange={setPerAltra}
            nota={perAltra ? (pagataDa === io.id ? `Tutto a carico di ${altra.nome}` : 'Tutto a carico tuo') : undefined}
          >
            Per l’altra persona
          </Interruttore>
        )}

        <SceltaCategoria categorie={categorie} name="categoria_id" valoreIniziale={iniziale?.categoriaId ?? null} />

        <SezioneEspandibile titolo="Altro" riassunto="Descrizione, pagamento, nota" apertaIniziale={altroCompilato}>
          <CampoTesto
            name="descrizione"
            etichetta="Descrizione"
            segnaposto="Esselunga"
            maxLength={80}
            defaultValue={iniziale?.descrizione ?? ''}
          />
          <ControlloSegmentato
            etichetta="Metodo di pagamento"
            name="metodo_pagamento"
            valoreIniziale={iniziale?.metodoPagamento ?? 'carta'}
            sfondo="foglio"
            opzioni={[
              { valore: 'carta', etichetta: 'Carta' },
              { valore: 'contanti', etichetta: 'Contanti' },
              { valore: 'bonifico', etichetta: 'Bonifico' },
            ]}
          />
          <CampoTesto name="note" etichetta="Nota" righe={3} maxLength={500} defaultValue={iniziale?.note ?? ''} />
        </SezioneEspandibile>

        {anteprima && altra && (
          <p
            aria-live="polite"
            className={
              'flex items-center justify-center gap-2 rounded-campo px-4 py-3 text-intestazione ' +
              ((anteprima.debitore === 'altra' ? altra.persona : io.persona) === 'a' ? 'bg-persona-a-tenue' : 'bg-persona-b-tenue')
            }
          >
            {anteprima.debitore === 'altra' ? (
              <Iniziale nome={altra.nome} persona={altra.persona} dimensione="piccola" decorativa />
            ) : (
              <Iniziale nome={io.nome} persona={io.persona} dimensione="piccola" decorativa />
            )}
            {anteprima.testo}
          </p>
        )}

        {dettagli && <p className="text-center text-nota text-testo-secondario">{dettagli}</p>}

        {stato.messaggio && (
          <p role="alert" className="text-sottotitolo text-pericolo">
            {stato.messaggio}
          </p>
        )}

        {/* F3: l'altra persona ha modificato la spesa nel frattempo (NF-06) */}
        {stato.conflitto && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-campo bg-superficie-2 px-4 py-3">
            <p className="text-sottotitolo text-testo">La spesa è stata modificata, ricarica.</p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className={
                'min-h-11 shrink-0 rounded-capsula px-3 text-corpo text-accento outline-hidden hover:bg-accento-tenue ' +
                'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento'
              }
            >
              Ricarica
            </button>
          </div>
        )}

        {/* Salva nella metà bassa (linee guida 6.3); da 768 px in basso a destra
            con Annulla e il suggerimento dei tasti (sezione 9.4) */}
        <div className="mt-auto flex items-center gap-3 pt-2 md:justify-end">
          <p className="mr-auto hidden text-didascalia text-testo-secondario md:block">
            Invio per salvare · Esc per chiudere
          </p>
          <Link
            href={dopo}
            replace
            className={
              'hidden min-h-11 items-center rounded-capsula px-4 text-corpo text-accento outline-hidden hover:bg-accento-tenue md:inline-flex ' +
              'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento'
            }
          >
            Annulla
          </Link>
          <PulsantePrincipale type="submit" isPending={inCorso}>
            {inCorso ? 'Salvo…' : 'Salva'}
          </PulsantePrincipale>
        </div>
      </div>
    </Modulo>
  );
}

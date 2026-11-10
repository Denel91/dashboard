'use client';

import { RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useActionState, useEffect, useState, type ReactNode } from 'react';
import type { Conflitto, StatoSpesa } from '@/app/actions/spese';
import {
  CampoData,
  CampoImporto,
  CampoTesto,
  ControlloSegmentato,
  Foglio,
  IconaFoglio,
  Iniziale,
  Interruttore,
  Modulo,
  PulsantePrincipale,
  PulsanteTesto,
  SceltaCategoria,
  SezioneEspandibile,
  mostraAvviso,
  type CategoriaScelta,
} from '@/components/ui';
import { centesimiPerCampo, euroInCentesimi, formattaEuro } from '@/lib/money';
import type { Membro } from '@/lib/nucleo/corrente';
import { anteprimaSpesa } from '@/lib/spese/testi';

// Modulo di Nuova spesa e Modifica spesa (tavole 06 e 07; da 768 px finestra
// al centro, tavola C3). Ordine dei campi delle tavole: importo, chi ha
// pagato, "Per l'altra persona", categoria, data con accanto "Altro"
// (descrizione, pagamento, nota), "Creata da…" (solo in Modifica),
// anteprima, Salva, Elimina (solo in Modifica). Sfondo grigio `sfondo` con i
// campi bianchi, come nei wireframe. Già impostati: oggi, "pagato da me", a
// metà (US-10).

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
  eliminazione,
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
  /** Sotto Salva, il pulsante Elimina di Modifica spesa (tavola 07). */
  eliminazione?: ReactNode;
  /** Sopra l'anteprima, per esempio "Creata da Simona il 03/11/2026 alle 21:30". */
  dettagli?: ReactNode;
}) {
  const router = useRouter();
  const [stato, invia, inCorso] = useActionState(azione, {});
  const [importo, setImporto] = useState(iniziale ? centesimiPerCampo(iniziale.importoCentesimi) : '');
  const [pagataDa, setPagataDa] = useState(iniziale?.pagataDa ?? io.id);
  const [perAltra, setPerAltra] = useState(iniziale?.perAltraPersona ?? false);
  // F3 resta aperto finché non si sceglie; un nuovo tentativo lo riapre
  const [conflittoChiuso, setConflittoChiuso] = useState<StatoSpesa | null>(null);
  const conflittoAperto = !!stato.conflitto && conflittoChiuso !== stato;
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
      className="min-h-dvh gap-0 bg-sfondo md:min-h-0"
    >
      {/* Titolo al centro e ✕ a sinistra (linee guida sezione 3, schermate modali) */}
      <header className="sticky top-0 z-10 grid grid-cols-[3rem_1fr_3rem] items-center bg-sfondo px-2 pt-[env(safe-area-inset-top)] md:static md:pt-0">
        <Link
          href={dopo}
          replace
          aria-label="Chiudi"
          className={
            'flex size-11 items-center justify-center rounded-capsula bg-superficie text-testo outline-hidden hover:brightness-95 active:opacity-70 ' +
            'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento'
          }
        >
          <X aria-hidden className="size-5" />
        </Link>
        <h1 className="py-3 text-center text-intestazione">{titolo}</h1>
      </header>
      {nascosti && Object.entries(nascosti).map(([nome, valore]) => <input key={nome} type="hidden" name={nome} value={valore} />)}

      <div className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-6 md:px-6">
        <CampoImporto
          name="importo"
          value={importo}
          onChange={setImporto}
          isRequired
          autoFocus={!iniziale}
          validationBehavior="aria"
        />

        {altra ? (
          <ControlloSegmentato
            etichetta="Chi ha pagato"
            name="pagata_da"
            valore={pagataDa}
            onChange={setPagataDa}
            opzioni={[
              { valore: io.id, etichetta: <><Iniziale nome={io.nome} persona={io.persona} dimensione="piccola" decorativa />Io</> },
              {
                valore: altra.id,
                etichetta: <><Iniziale nome={altra.nome} persona={altra.persona} dimensione="piccola" decorativa />Tu · {altra.nome}</>,
              },
            ]}
          />
        ) : (
          <input type="hidden" name="pagata_da" value={io.id} />
        )}

        {altra && (
          <Interruttore
            name="per_altra_persona"
            attivo={perAltra}
            onChange={setPerAltra}
            sfondo="foglio"
            nota={`Tutto l’importo è a carico di ${pagataDa === io.id ? altra.nome : io.nome}`}
          >
            Per l’altra persona
          </Interruttore>
        )}

        <SceltaCategoria categorie={categorie} name="categoria_id" valoreIniziale={iniziale?.categoriaId ?? null} />

        <SezioneEspandibile
          titolo="Altro"
          riassunto="Descrizione, pagamento, nota"
          apertaIniziale={altroCompilato}
          accanto={<CampoData name="data_spesa" oggi={oggi} valoreIniziale={iniziale?.dataSpesa} errore={stato.errori?.data_spesa} />}
        >
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
            opzioni={[
              { valore: 'carta', etichetta: 'Carta' },
              { valore: 'contanti', etichetta: 'Contanti' },
              { valore: 'bonifico', etichetta: 'Bonifico' },
            ]}
          />
          <CampoTesto name="note" etichetta="Nota" righe={3} maxLength={500} defaultValue={iniziale?.note ?? ''} />
        </SezioneEspandibile>

        {dettagli && <p className="-mb-1 px-1 text-nota text-testo-secondario">{dettagli}</p>}

        {anteprima && altra && (
          <p aria-live="polite" className="flex items-center gap-2 px-1 text-sottotitolo text-testo">
            {/* Sempre l'iniziale dell'altra persona, come nelle tavole 06 e 07 */}
            <Iniziale nome={altra.nome} persona={altra.persona} dimensione="piccola" decorativa />
            <span>
              {anteprima.prima} <strong className="importo font-semibold">{anteprima.importo}</strong>
            </span>
          </p>
        )}

        {stato.messaggio && (
          <p role="alert" className="text-sottotitolo text-pericolo">
            {stato.messaggio}
          </p>
        )}

        {/* Salva subito dopo l'anteprima, come nelle tavole 06 e 07; da 768 px a destra
            con Annulla e il suggerimento dei tasti (sezione 9.4) */}
        <div className="flex items-center gap-3 pt-1 md:justify-end">
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

        {eliminazione && <div className="-mt-1 flex justify-center">{eliminazione}</div>}
      </div>

      {/* F3: qualcuno ha modificato la spesa nel frattempo (NF-06, tavola 17) */}
      <Foglio
        titolo={stato.conflitto?.eliminata ? 'La spesa è nel Cestino' : 'La spesa è stata modificata, ricarica'}
        icona={
          <IconaFoglio tono="attenzione">
            <RefreshCw className="size-5" />
          </IconaFoglio>
        }
        isOpen={conflittoAperto}
        onOpenChange={(aperto) => !aperto && setConflittoChiuso(stato)}
      >
        {({ chiudi }) => (
          <div className="flex flex-col gap-5">
            {stato.conflitto && <TestoConflitto conflitto={stato.conflitto} membri={membri} importoLetto={iniziale?.importoCentesimi} />}
            <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
              <PulsantePrincipale
                onPress={() => {
                  chiudi();
                  router.refresh();
                }}
              >
                Ricarica
              </PulsantePrincipale>
              <PulsanteTesto onPress={chiudi}>Annulla</PulsanteTesto>
            </div>
          </div>
        )}
      </Foglio>
    </Modulo>
  );
}

/**
 * Testo di F3 (tavola 17): "Simona ha cambiato questa spesa mentre la stavi
 * modificando (importo 38,00 € → 41,00 €). Ricarica per vedere la versione
 * aggiornata: le tue modifiche non salvate andranno perse."
 */
function TestoConflitto({
  conflitto,
  membri,
  importoLetto,
}: {
  conflitto: Conflitto;
  membri: Membro[];
  importoLetto?: number;
}) {
  const chi = membri.find((m) => m.id === conflitto.autore);
  const soggetto = !chi ? null : chi.sonoIo ? 'Hai cambiato questa spesa da un’altra finestra' : `${chi.nome} ha cambiato questa spesa`;
  let frase: string;
  if (conflitto.eliminata) {
    frase =
      (chi ? (chi.sonoIo ? 'L’hai spostata nel Cestino da un’altra finestra' : `${chi.nome} l’ha spostata nel Cestino`) : 'È stata spostata nel Cestino') +
      ' mentre la stavi modificando. Le tue modifiche non salvate andranno perse.';
  } else {
    const importo =
      importoLetto !== undefined && conflitto.importoCentesimi !== null && conflitto.importoCentesimi !== importoLetto
        ? ` (importo ${formattaEuro(importoLetto)} → ${formattaEuro(conflitto.importoCentesimi)})`
        : '';
    frase =
      `${soggetto ?? 'Questa spesa è stata cambiata'} mentre la stavi modificando${importo}. ` +
      'Ricarica per vedere la versione aggiornata: le tue modifiche non salvate andranno perse.';
  }
  return (
    <p className="text-corpo text-testo">
      {chi && !chi.sonoIo && (
        <span className="mr-1.5 inline-flex align-[-0.2em]">
          <Iniziale nome={chi.nome} persona={chi.persona} dimensione="piccola" decorativa />
        </span>
      )}
      {frase}
    </p>
  );
}

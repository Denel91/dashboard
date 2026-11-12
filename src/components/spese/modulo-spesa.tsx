'use client';

import { RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useActionState, useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
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
// Sul computer (`aspetto`) la disposizione è quella delle tavole C3
// (finestra al centro, da 768 px) e C2 (riquadro accanto all'elenco, da
// 1024 px): fondo bianco con i campi grigi, "Importo" sopra la cifra senza
// card, Chi ha pagato e Data affiancati, "Altro" su una riga intera,
// anteprima in una fascia del colore dell'altra persona. Nel riquadro, al
// posto del titolo, "Creata da…" in alto a sinistra ed Elimina a destra.
// Le classi `largo:` (globals.css) valgono solo dentro data-aspetto.

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

/**
 * Con cacheComponents Next.js 16 non smonta la pagina quando si esce: la
 * nasconde con <Activity> e ne conserva lo stato (guida "Preserving UI
 * state"). Per Nuova spesa voleva dire ritrovare, alla visita dopo, il
 * modulo già salvato, con l'avviso e il ritorno indietro che ripartivano e
 * il modulo bloccato. Qui ogni volta che si esce dalla pagina (Salva,
 * Annulla, ✕, Esc, un link) il modulo riparte da capo con una nuova `key`:
 * ogni Nuova spesa comincia vuota, come chiede la guida per i moduli "nuovo
 * elemento". Modifica spesa riparte comunque dai valori salvati (la pagina
 * le dà una `key` con data_modifica).
 */
export function ModuloSpesa(props: Omit<ComponentProps<typeof ModuloSpesaUnGiro>, 'ricomincia'>) {
  const [giro, setGiro] = useState(0);
  // Stabile: l'effetto che la usa deve partire solo quando la pagina si nasconde
  const ricomincia = useCallback(() => setGiro((g) => g + 1), []);
  return <ModuloSpesaUnGiro key={giro} {...props} ricomincia={ricomincia} />;
}

function ModuloSpesaUnGiro({
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
  aspetto,
  ricomincia,
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
  /** Dove sta sul computer: finestra al centro (C3) o riquadro accanto all'elenco (C2). */
  aspetto: 'finestra' | 'riquadro';
  /** Dopo un salvataggio, alla prossima volta che la pagina si nasconde: modulo nuovo. */
  ricomincia: () => void;
}) {
  const router = useRouter();
  const [stato, invia, inCorso] = useActionState(azione, {});
  const [importo, setImporto] = useState(iniziale ? centesimiPerCampo(iniziale.importoCentesimi) : '');
  const [pagataDa, setPagataDa] = useState(iniziale?.pagataDa ?? io.id);
  const [perAltra, setPerAltra] = useState(iniziale?.perAltraPersona ?? false);
  // Una sola data per i due campi: accanto ad "Altro" sul telefono, accanto a Chi ha pagato sul computer
  const [dataSpesa, setDataSpesa] = useState(iniziale?.dataSpesa ?? oggi);
  // F3 resta aperto finché non si sceglie; un nuovo tentativo lo riapre
  const [conflittoChiuso, setConflittoChiuso] = useState<StatoSpesa | null>(null);
  const conflittoAperto = !!stato.conflitto && conflittoChiuso !== stato;
  const altroCompilato = !!iniziale && (!!iniziale.descrizione || !!iniziale.note || iniziale.metodoPagamento !== 'carta');

  const altra = membri.find((m) => !m.sonoIo) ?? null;
  const anteprima = altra
    ? anteprimaSpesa(euroInCentesimi(importo), pagataDa === io.id, perAltra ? 'per_altra_persona' : 'a_meta', altra.nome)
    : null;

  // Salvata: avviso F7 e ritorno alla pagina di prima, con i dati aggiornati.
  // Una sola volta per risposta: quando Activity rimostra la pagina gli
  // effetti ripartono, e senza il controllo l'avviso e il ritorno si ripeterebbero
  const gestita = useRef<StatoSpesa | null>(null);
  useEffect(() => {
    if (!stato.salvata || gestita.current === stato) return;
    gestita.current = stato;
    mostraAvviso(stato.salvata.avviso);
    router.replace(dopo);
    router.refresh();
  }, [stato, dopo, router]);

  // Quando la pagina viene nascosta (o smontata) si riparte da un modulo
  // vuoto (guida "Preserving UI state": pulizia in useLayoutEffect)
  useLayoutEffect(() => () => ricomincia(), [ricomincia]);

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

  const riquadro = aspetto === 'riquadro';

  return (
    <div data-aspetto={aspetto} className="@container">
    <Modulo
      // onSubmit e non action: con action React svuota il modulo dopo ogni
      // invio, e dopo un errore si perderebbe quello che si è scritto
      onSubmit={(e) => {
        e.preventDefault();
        const dati = new FormData(e.currentTarget);
        startTransition(() => invia(dati));
      }}
      validationErrors={stato.errori}
      className="min-h-dvh gap-0 bg-sfondo md:min-h-0 largo:bg-superficie"
    >
      {/* Titolo al centro e ✕ a sinistra (linee guida sezione 3, schermate modali) */}
      <header
        className={
          'sticky top-0 z-10 grid grid-cols-titolo-modale items-center bg-sfondo px-2 pt-sicuro-0 md:static md:pt-0 ' +
          'largo:border-b largo:border-separatore largo:bg-superficie ' +
          // Nel riquadro accanto all'elenco (C2) niente titolo né ✕
          (riquadro ? 'lg:hidden' : '')
        }
      >
        <Link
          href={dopo}
          replace
          aria-label="Chiudi"
          className={
            'flex size-11 items-center justify-center rounded-capsula bg-superficie text-testo outline-hidden hover:brightness-95 active:opacity-70 largo:bg-transparent ' +
            'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento'
          }
        >
          <X aria-hidden className="size-5" />
        </Link>
        <h1 className="py-3 text-center text-intestazione">{titolo}</h1>
      </header>
      {nascosti && Object.entries(nascosti).map(([nome, valore]) => <input key={nome} type="hidden" name={nome} value={valore} />)}

      <div className="relative flex flex-1 flex-col gap-4 px-4 pt-2 pb-6 md:px-6 largo:pt-4">
        <CampoImporto
          name="importo"
          value={importo}
          onChange={setImporto}
          isRequired
          autoFocus={!iniziale}
          validationBehavior="aria"
        />

        <div className="flex flex-col gap-4 largo:grid largo:items-end largo:gap-3 @modulo-largo:largo:grid-cols-2">
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
                etichetta: (
                  <>
                    <Iniziale nome={altra.nome} persona={altra.persona} dimensione="piccola" decorativa />
                    <span>
                      <span className="largo:hidden">Tu · </span>
                      {altra.nome}
                    </span>
                  </>
                ),
              },
            ]}
          />
        ) : (
          <input type="hidden" name="pagata_da" value={io.id} />
        )}
          {/* Data accanto a Chi ha pagato, solo sul computer (C2, C3) */}
          <div className="hidden largo:flex">
            <CampoData name="data_spesa" oggi={oggi} valore={dataSpesa} onChange={setDataSpesa} errore={stato.errori?.data_spesa} aspetto="campo" />
          </div>
        </div>

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
          accanto={
            <div className="flex min-w-0 flex-1 largo:hidden">
              <CampoData name="data_spesa" oggi={oggi} valore={dataSpesa} onChange={setDataSpesa} errore={stato.errori?.data_spesa} />
            </div>
          }
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

        {dettagli && (
          <p
            className={
              '-mb-1 px-1 text-nota text-testo-secondario ' +
              // Nel riquadro (C2): pillola in alto a sinistra, con l'iniziale
              'largo:order-first largo:mb-0 largo:inline-flex largo:items-center largo:gap-1.5 largo:self-start largo:rounded-capsula largo:bg-superficie-2 largo:py-1 largo:pr-3 largo:pl-1 largo:text-testo'
            }
          >
            {dettagli}
          </p>
        )}

        {anteprima && altra && (
          <p
            aria-live="polite"
            className={
              'flex items-center gap-2 px-1 text-sottotitolo text-testo ' +
              // Sul computer una fascia del colore tenue dell'altra persona (C2, C3)
              'largo:justify-center largo:rounded-campo largo:py-3 largo:font-semibold ' +
              (altra.persona === 'a' ? 'largo:bg-persona-a-tenue' : 'largo:bg-persona-b-tenue')
            }
          >
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
          <p className={'mr-auto hidden text-didascalia text-testo-secondario md:block ' + (riquadro ? 'lg:invisible' : '')}>
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

        {/* Elimina: sotto Salva sul telefono (07), in alto a destra nel riquadro (C2) */}
        {eliminazione && (
          <div className="-mt-1 flex justify-center largo:absolute largo:top-2 largo:right-4 largo:mt-0">{eliminazione}</div>
        )}
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
    </div>
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
        <span className="mr-1.5 inline-flex allinea-iniziale">
          <Iniziale nome={chi.nome} persona={chi.persona} dimensione="piccola" decorativa />
        </span>
      )}
      {frase}
    </p>
  );
}

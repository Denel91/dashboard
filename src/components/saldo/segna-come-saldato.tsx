'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from 'react';
import type { StatoRimborso } from '@/app/actions/rimborsi';
import {
  ApriFoglio,
  CampoImportoFoglio,
  CampoTesto,
  Foglio,
  Iniziale,
  Modulo,
  PulsantePrincipale,
  PulsanteSuMisura,
  PulsanteTesto,
  mostraAvviso,
} from '@/components/ui';
import { centesimiPerCampo, euroInCentesimi, formattaEuro } from '@/lib/money';
import type { Membro } from '@/lib/nucleo/corrente';
import { notaImportoRimborso } from '@/lib/saldo/saldo';

// "Segna come saldato" (tavole 08a e 08b, US-31 e US-32): il pulsante sotto la
// card del saldo apre un foglio (finestra al centro da 768 px) con chi dà →
// chi riceve, l'importo già pieno con tutto il saldo, la nota facoltativa e
// Conferma. Un tocco su Conferma pareggia (US-31); cambiando l'importo si
// registra un rimborso parziale (US-32). Mai più del saldo (deciso in coppia).
// Se nel frattempo il saldo è cambiato (l'altra persona ha appena saldato),
// il database non registra niente e il foglio mostra il saldo nuovo.

type Azione = (prima: StatoRimborso, dati: FormData) => Promise<StatoRimborso>;

type Props = {
  azione: Azione;
  /** Il saldo di chi è collegato, dalla vista saldi: positivo = me lo devono. Mai zero qui. */
  saldoCentesimi: number;
  io: Membro;
  altra: Membro;
};

export function SegnaComeSaldato({
  pulsante,
  ...props
}: Props & {
  /** Un altro pulsante che apre lo stesso foglio: nella card del saldo e tra le azioni rapide della Home (C1). */
  pulsante?: { className: string; contenuto: ReactNode };
}) {
  return (
    <ApriFoglio>
      {pulsante ? (
        <PulsanteSuMisura className={pulsante.className}>{pulsante.contenuto}</PulsanteSuMisura>
      ) : (
        <PulsantePrincipale className="md:w-full">Segna come saldato</PulsantePrincipale>
      )}
      <Foglio titolo="Segna come saldato">{({ chiudi }) => <ModuloRimborso {...props} chiudi={chiudi} />}</Foglio>
    </ApriFoglio>
  );
}

function ModuloRimborso({ azione, saldoCentesimi, io, altra, chiudi }: Props & { chiudi: () => void }) {
  const router = useRouter();
  const [stato, invia, inCorso] = useActionState(azione, {});
  // Il saldo su cui si lavora: quello letto dalla pagina, o quello nuovo se è cambiato
  const [saldo, setSaldo] = useState(saldoCentesimi);
  const [importo, setImporto] = useState(centesimiPerCampo(Math.abs(saldoCentesimi)));
  const [stavoGuardando, setStavoGuardando] = useState<StatoRimborso | null>(null);

  // Il saldo è cambiato nel frattempo: si riparte dal saldo nuovo, una volta per risposta
  if (stato.saldoCambiato !== undefined && stavoGuardando !== stato) {
    setStavoGuardando(stato);
    setSaldo(stato.saldoCambiato);
    setImporto(centesimiPerCampo(Math.abs(stato.saldoCambiato)));
  }
  const cambiato = stato.saldoCambiato !== undefined;

  // Una sola volta per risposta del server: `chiudi` cambia a ogni render del
  // foglio, e senza questo controllo l'effetto ripartirebbe all'infinito
  const gestita = useRef<StatoRimborso | null>(null);
  useEffect(() => {
    if (gestita.current === stato) return;
    gestita.current = stato;
    if (stato.saldoCambiato !== undefined) router.refresh();
    if (!stato.registrato) return;
    chiudi();
    mostraAvviso(stato.registrato.avviso);
    router.refresh();
  }, [stato, chiudi, router]);

  const [da, a] = saldo > 0 ? [altra, io] : [io, altra];
  const massimo = Math.abs(saldo);
  const nota = notaImportoRimborso(euroInCentesimi(importo), massimo);

  if (saldo === 0) {
    return (
      <div className="flex flex-col gap-5">
        <p role="status" className="text-corpo">
          Nel frattempo avete pareggiato: siete in pari.
        </p>
        <PulsantePrincipale onPress={chiudi} className="md:self-end">
          Chiudi
        </PulsantePrincipale>
      </div>
    );
  }

  return (
    <Modulo
      // onSubmit e non action: dopo un errore il modulo resta com'era (vedi modulo-spesa.tsx)
      onSubmit={(e) => {
        e.preventDefault();
        const dati = new FormData(e.currentTarget);
        startTransition(() => invia(dati));
      }}
      validationErrors={stato.errori}
    >
      <p className="flex items-center gap-1.5 text-sottotitolo">
        <span className="sr-only">
          {da.nome} dà a {a.nome}
        </span>
        <span aria-hidden="true" className="flex items-center gap-1.5">
          <Iniziale nome={da.nome} persona={da.persona} dimensione="piccola" decorativa />
          {da.nome}
          <ArrowRight className="size-4" />
          <Iniziale nome={a.nome} persona={a.persona} dimensione="piccola" decorativa />
          {a.nome}
        </span>
      </p>

      <input type="hidden" name="saldo_atteso" value={saldo} />
      <CampoImportoFoglio
        name="importo"
        value={importo}
        onChange={setImporto}
        isRequired
        isInvalid={!nota.valido && importo.trim() !== '' ? true : undefined}
        nota={<span aria-live="polite">{nota.testo}</span>}
      />
      <CampoTesto name="nota" etichetta="Nota · facoltativa" sfondo="foglio" segnaposto="Es. bonifico, contanti…" maxLength={200} />

      {cambiato && (
        <p role="alert" className="text-sottotitolo text-testo">
          Nel frattempo il saldo è cambiato: ora è {formattaEuro(massimo)}. Controlla l’importo e conferma di nuovo.
        </p>
      )}
      {stato.messaggio && (
        <p role="alert" className="text-sottotitolo text-pericolo">
          {stato.messaggio}
        </p>
      )}

      <div className="mt-1 flex flex-col gap-2 md:flex-row-reverse md:justify-start">
        <PulsantePrincipale type="submit" isDisabled={!nota.valido} isPending={inCorso}>
          {inCorso ? 'Registro…' : 'Conferma'}
        </PulsantePrincipale>
        {/* Sul telefono si chiude col tocco sul velo o trascinando (tavola 08b) */}
        <span className="hidden md:block">
          <PulsanteTesto onPress={chiudi}>Annulla</PulsanteTesto>
        </span>
      </div>
    </Modulo>
  );
}

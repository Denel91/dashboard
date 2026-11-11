import type { ReactNode } from 'react';
import { Anello } from '@/components/home/grafici';
import { Iniziale } from '@/components/ui';
import { formattaEuro } from '@/lib/money';
import type { Membro } from '@/lib/nucleo/corrente';
import type { StatoSaldo } from '@/lib/saldo/saldo';

// Card protagonista del saldo nella Home sul computer (tavola C1 v2, D23,
// linee guida sezione 9.8), solo da 1024 px. Piena del colore di chi deve,
// con il testo sempre `su-persona` pieno; in pari è una card di vetro
// neutra. A sinistra: "Saldo di novembre", chi deve, l'importo, le spese
// dall'ultimo pareggio, i numeri del mese e i pulsanti (`children`). A
// destra l'anello "pagato da te" con quanto ha pagato ciascuno.
// "budget superato" arriva con US-44 (Sprint 8).

const PIENA = { a: 'bg-persona-a text-su-persona', b: 'bg-persona-b text-su-persona' } as const;

export function CardSaldoComputer({
  stato,
  io,
  altra,
  nomeMese,
  pareggio,
  totaleCentesimi,
  numero,
  quote,
  className = '',
  children,
}: {
  stato: StatoSaldo;
  io: Membro;
  altra: Membro | null;
  /** "novembre" */
  nomeMese: string;
  /** "Dall’ultimo pareggio del 31 ottobre: 12 spese tue e 9 di Simona." */
  pareggio: string | null;
  totaleCentesimi: number;
  numero: number;
  quote: { mie: number; altra: number; percentuale: number | null };
  className?: string;
  /** I pulsanti: "Segna come saldato" e "Vai al saldo". */
  children?: ReactNode;
}) {
  const piena = stato.tipo === 'debito';
  const sfondo = piena ? PIENA[stato.debitore.persona] : 'vetro-card text-testo';
  const bordo = piena ? 'border-su-persona/40' : 'border-separatore';

  return (
    <section aria-labelledby="titolo-saldo-computer" className={`flex gap-8 rounded-card p-6 ${sfondo} ${className}`}>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className={`flex w-fit items-center gap-1.5 rounded-capsula border py-0.5 pr-3 pl-0.5 text-nota ${bordo}`}>
          {piena ? (
            <InizialeConAnello membro={stato.debitore} piena />
          ) : (
            <span className="flex -space-x-1.5">
              {[io, ...(altra ? [altra] : [])].map((m) => (
                <InizialeConAnello key={m.id} membro={m} piena={false} />
              ))}
            </span>
          )}
          Saldo di {nomeMese}
        </p>

        <h2 id="titolo-saldo-computer" className="mt-3 text-titolo-2 font-bold">
          {stato.tipo === 'debito'
            ? stato.ioDevo
              ? `Devi a ${stato.creditore.nome}`
              : `${stato.debitore.nome} ti deve`
            : stato.tipo === 'pari'
              ? 'Siete in pari'
              : 'Sei ancora da solo'}
        </h2>
        {stato.tipo === 'debito' && <p className="importo text-importo font-bold">{formattaEuro(stato.importoCentesimi)}</p>}
        {stato.tipo === 'solo' ? (
          <p className="mt-1 text-sottotitolo">Il saldo compare quando l’altra persona entra nel nucleo.</p>
        ) : (
          pareggio && <p className="mt-1 text-sottotitolo">{pareggio}</p>
        )}

        <dl className={`mt-4 flex gap-10 border-t pt-4 ${bordo}`}>
          <div className="flex flex-col">
            <dt className="order-2 text-nota">spesi a {nomeMese}</dt>
            <dd className="importo text-titolo-3 font-bold">{formattaEuro(totaleCentesimi)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="order-2 text-nota">{numero === 1 ? 'spesa registrata' : 'spese registrate'}</dt>
            <dd className="importo text-titolo-3 font-bold">{numero}</dd>
          </div>
        </dl>

        {children && <div className="mt-5 flex flex-wrap items-center gap-3">{children}</div>}
      </div>

      {altra && quote.percentuale !== null && (
        <div className="flex shrink-0 flex-col items-center justify-center gap-3">
          <div className={piena ? undefined : 'text-accento'}>
            <Anello percentuale={quote.percentuale} etichetta="pagato da te" />
          </div>
          <ul className="flex gap-4 text-nota" aria-label={`Pagato a ${nomeMese}`}>
            {[
              { m: io, importo: quote.mie },
              { m: altra, importo: quote.altra },
            ].map(({ m, importo }) => (
              <li key={m.id} className="flex items-center gap-1.5">
                <InizialeConAnello membro={m} piena={piena} />
                <span className="sr-only">{m.sonoIo ? 'Tu' : m.nome}: </span>
                <span className="importo">{formattaEuro(importo)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Iniziale con l'anello: sulla card piena serve, sennò quella del colore della card sparisce (sezione 9.8). */
function InizialeConAnello({ membro, piena }: { membro: Membro; piena: boolean }) {
  return (
    <span className={`rounded-capsula ring-2 ${piena ? 'ring-su-persona' : 'ring-superficie'}`}>
      <Iniziale nome={membro.nome} persona={membro.persona} dimensione="piccola" decorativa />
    </span>
  );
}

/** Stile dei pulsanti sulla card: pieno (Segna come saldato) e con il bordo (Vai al saldo). */
export function stiliPulsantiCard(stato: StatoSaldo) {
  const focus = 'outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 ';
  if (stato.tipo === 'debito') {
    const testo = stato.debitore.persona === 'a' ? 'text-persona-a' : 'text-persona-b';
    return {
      pieno: `${focus}focus-visible:outline-su-persona inline-flex min-h-11 items-center rounded-capsula bg-su-persona px-5 text-intestazione ${testo} hover:brightness-95 active:opacity-80 data-hovered:brightness-95 data-pressed:opacity-80 data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2 data-focus-visible:outline-su-persona`,
      bordo: `${focus}focus-visible:outline-su-persona inline-flex min-h-11 items-center gap-1 rounded-capsula border border-su-persona/70 px-5 text-intestazione hover:bg-su-persona/10 active:opacity-80`,
    };
  }
  return {
    pieno: `${focus}focus-visible:outline-accento inline-flex min-h-11 items-center rounded-capsula bg-accento px-5 text-intestazione text-su-accento hover:brightness-110 active:opacity-80`,
    bordo: `${focus}focus-visible:outline-accento inline-flex min-h-11 items-center gap-1 rounded-capsula border border-separatore bg-superficie px-5 text-intestazione text-testo hover:bg-superficie-2 active:opacity-80`,
  };
}

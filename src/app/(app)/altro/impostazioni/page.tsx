import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ChevronLeft, LogOut, ShieldCheck } from 'lucide-react';
import { esci } from '@/app/actions/accesso';
import { GruppoRighe, Iniziale, Riga } from '@/components/ui';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';

export const metadata: Metadata = { title: 'Impostazioni · Nucleo' };

// Impostazioni (tavola 14), versione minima della Release 0.1 (T-31):
// PROFILO con nome e account Google (K4), NUCLEO con nome e membri, ACCOUNT
// con l'informativa (D20) ed Esci. Arrivano con le loro storie:
// - cambiare il proprio nome e quello del nucleo (le righe diventano con ›);
// - Link di pagamento (US-35, v1.1);
// - Esporta dati (US-03, Sprint 6) e Cancella account (US-04, Sprint 8).
// L'email dell'altra persona non c'è: l'app conosce solo quella di chi è
// collegato (la tabella membri non la salva).
export default function PaginaImpostazioni() {
  return (
    <main className="flex w-full max-w-[680px] flex-col gap-6 py-2">
      {/* Titolo al centro e ‹ a sinistra, come nella tavola 14 */}
      <header className="relative flex min-h-11 items-center justify-center">
        <Link
          href="/altro"
          aria-label="Torna ad Altro"
          className={
            'absolute left-0 flex size-11 items-center justify-center rounded-capsula vetro-card text-testo outline-hidden ' +
            'hover:bg-superficie-2 active:scale-95 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento'
          }
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <h1 className="text-intestazione">Impostazioni</h1>
      </header>
      <Suspense fallback={<p className="text-testo-secondario">Caricamento…</p>}>
        <Contenuto />
      </Suspense>
    </main>
  );
}

async function Contenuto() {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) redirect('/benvenuto');

  return (
    <>
      <GruppoRighe titolo="Profilo">
        <Riga titolo="Il tuo nome" valore={nucleo.io.nome} />
        <Riga titolo="Account Google" valore={<span className="text-sottotitolo">{nucleo.email}</span>} />
      </GruppoRighe>

      <GruppoRighe titolo="Nucleo">
        <Riga titolo="Nome del nucleo" valore={nucleo.nome} />
        {/* Il separatore parte dal testo, come nelle righe (gruppo-righe.tsx) */}
        <li className="pl-4">
          <div className="flex flex-col gap-2 border-t border-separatore py-3 pr-4">
            <p className="text-corpo">Membri</p>
            <ul className="flex flex-col gap-2">
              {nucleo.membri.map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-sottotitolo">
                  <Iniziale nome={m.nome} persona={m.persona} dimensione="piccola" decorativa />
                  <span>{m.nome}</span>
                  {m.sonoIo && <span className="text-testo-secondario">· tu</span>}
                </li>
              ))}
            </ul>
            {nucleo.completo ? (
              <p className="text-didascalia text-testo-secondario">Il nucleo è completo: il link d’invito non compare.</p>
            ) : (
              <Link
                href="/benvenuto/invita"
                className="w-fit rounded-capsula py-1 text-sottotitolo text-accento outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento"
              >
                Invita l’altra persona
              </Link>
            )}
          </div>
        </li>
      </GruppoRighe>

      <GruppoRighe titolo="Account">
        <Riga icona={<ShieldCheck aria-hidden="true" className="size-5 text-testo" />} titolo="Informativa sulla privacy" href="/privacy" />
        <li>
          <form action={esci}>
            <button
              type="submit"
              className={
                'flex w-full cursor-pointer items-stretch gap-3 pl-4 text-left text-corpo text-testo ' +
                'outline-hidden transition-colors duration-150 hover:bg-superficie-2 active:bg-superficie-2 ' +
                'focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-accento'
              }
            >
              <span className="flex shrink-0 items-center py-2.5">
                <LogOut aria-hidden="true" className="size-5" />
              </span>
              <span className="flex min-h-11 flex-1 items-center border-t border-separatore py-2.5 pr-4">Esci</span>
            </button>
          </form>
        </li>
      </GruppoRighe>
    </>
  );
}

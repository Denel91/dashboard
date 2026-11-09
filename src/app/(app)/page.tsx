import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { esci } from '@/app/actions/accesso';
import { Card, Iniziale } from '@/components/ui';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';

// Home PROVVISORIA (US-01, US-02): mostra il nucleo e i suoi membri, il link
// per invitare finché si è da soli e "Esci". Diventa la Home vera con il
// saldo (US-30, Sprint 4) e la dashboard (US-40, Sprint 7).
export default function Home() {
  return (
    <main className="flex max-w-md flex-col gap-5 py-2">
      {/* Legge la sessione (cookie): con cacheComponents va dentro Suspense */}
      <Suspense fallback={<p className="text-testo-secondario">Caricamento…</p>}>
        <Benvenuto />
      </Suspense>
    </main>
  );
}

async function Benvenuto() {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) redirect('/benvenuto');

  return (
    <>
      <header>
        <h1 className="text-titolo-grande font-bold">Ciao {nucleo.io.nome}!</h1>
        <p className="text-sottotitolo text-testo-secondario">{nucleo.nome}</p>
      </header>

      <Card className="flex flex-col gap-3">
        <p className="text-nota text-testo-secondario uppercase">Nel nucleo</p>
        {nucleo.membri.map((m) => (
          <p key={m.id} className="flex items-center gap-3 text-corpo">
            <Iniziale nome={m.nome} persona={m.persona} decorativa />
            {m.nome}
            {m.sonoIo && <span className="text-testo-secondario">(tu)</span>}
          </p>
        ))}
        {!nucleo.completo && (
          <Link href="/benvenuto/invita" className="text-corpo text-accento">
            Invita l’altra persona
          </Link>
        )}
      </Card>

      <p className="text-sottotitolo text-testo-secondario">
        Sei entrato con l’account Google <strong className="text-testo">{nucleo.email}</strong>.
      </p>

      <form action={esci}>
        <button
          type="submit"
          className="h-12.5 w-full rounded-capsula bg-superficie text-intestazione text-pericolo outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento"
        >
          Esci
        </button>
      </form>
    </>
  );
}

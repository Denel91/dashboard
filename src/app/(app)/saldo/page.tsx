import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { annullaRimborso, registraRimborso } from '@/app/actions/rimborsi';
import { AnnullaRimborso } from '@/components/saldo/annulla-rimborso';
import { CardSaldo } from '@/components/saldo/card-saldo';
import { ElencoRimborsi } from '@/components/saldo/elenco-rimborsi';
import { SegnaComeSaldato } from '@/components/saldo/segna-come-saldato';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';
import { leggiRimborsi, leggiStatoSaldo } from '@/lib/saldo/leggi';
import { fraseDopoAnnullamento, saldoDopoAnnullamento, statoSaldo } from '@/lib/saldo/saldo';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Saldo · Nucleo' };

// Saldo (tavola 08a, US-30): chi deve quanto a chi e l'elenco dei rimborsi.
// Il saldo arriva dalla vista `saldi` del database (D6): nessun conto qui.
// - telefono e md: una colonna, card in alto e rimborsi sotto;
// - da 1024 px: card a sinistra, rimborsi a destra (linee guida sezione 9.3),
//   con la card protagonista piena nel colore di chi deve (D23).
// "Segna come saldato" apre il foglio 08b (US-31, US-32), "↶ Annulla" la
// conferma 19e (US-33); in pari il pulsante non compare (deciso in coppia).
// Lo spazio per il link di pagamento della tavola è un segnaposto della v1.1
// (US-35) e qui non compare.
export default function PaginaSaldo() {
  return (
    <main className="py-2">
      <Suspense fallback={<p className="text-testo-secondario">Caricamento…</p>}>
        <Contenuto />
      </Suspense>
    </main>
  );
}

async function Contenuto() {
  await connection();
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) redirect('/benvenuto');

  const supabase = await createClient();
  const [stato, rimborsi] = await Promise.all([leggiStatoSaldo(supabase, nucleo), leggiRimborsi(supabase, nucleo)]);
  const altra = nucleo.membri.find((m) => !m.sonoIo);
  // Il saldo con il segno, visto da chi è collegato (positivo = me lo devono)
  const saldoMio = stato.tipo === 'debito' ? (stato.ioDevo ? -stato.importoCentesimi : stato.importoCentesimi) : 0;

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-saldo lg:items-start lg:gap-x-8">
      <header className="flex flex-col gap-1 lg:col-span-2">
        <h1 className="text-titolo-grande font-bold">Saldo</h1>
        <p className="text-sottotitolo text-testo-secondario">{nucleo.nome}</p>
      </header>

      {/* Card e, sotto, "Segna come saldato" (tavola 08a); da 1024 px a sinistra */}
      <div className="flex flex-col gap-3">
        <CardSaldo stato={stato} variante="pagina" titoloId="titolo-saldo">
          {stato.tipo === 'solo' && (
            <Link
              href="/benvenuto/invita"
              className="rounded-capsula px-3 py-2 text-corpo text-accento outline-hidden hover:bg-accento-tenue focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento"
            >
              Invita l’altra persona
            </Link>
          )}
        </CardSaldo>
        {stato.tipo === 'debito' && altra && (
          <SegnaComeSaldato azione={registraRimborso} saldoCentesimi={saldoMio} io={nucleo.io} altra={altra} />
        )}
      </div>

      <ElencoRimborsi
        rimborsi={rimborsi}
        azione={(r) => (
          <AnnullaRimborso
            rimborso={r}
            annulla={annullaRimborso.bind(null, r.id)}
            fraseSaldo={fraseDopoAnnullamento(stato, statoSaldo(saldoDopoAnnullamento(saldoMio, r, nucleo.io.id), nucleo))}
          />
        )}
      />
    </div>
  );
}

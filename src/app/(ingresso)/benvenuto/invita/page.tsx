import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Iniziale } from '@/components/ui';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';
import { linkInvito, linkInvitoAccorciato } from '@/lib/nucleo/invito';
import { IntestazioneIngresso } from '../../intestazione';
import { AggiornaStato, CondividiInvito } from './condividi';

export const metadata: Metadata = { title: 'Invita · Nucleo' };

// Tavola 02b (US-02, passo 2): il link d'invito da copiare o condividere e lo
// stato "In attesa". Fino al tempo reale (Sprint 6) lo stato si aggiorna con
// "Aggiorna" o riaprendo la pagina. Si può andare alla Home anche da soli.
export default function PaginaInvita() {
  return (
    <Suspense fallback={null}>
      <Contenuto />
    </Suspense>
  );
}

async function Contenuto() {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) redirect('/benvenuto');

  const altra = nucleo.membri.find((m) => !m.sonoIo);

  if (nucleo.completo && altra) {
    return (
      <>
        <div className="flex-1">
          <IntestazioneIngresso titolo="Siete in due">
            {altra.nome} è nel nucleo <em className="not-italic text-testo">{nucleo.nome}</em>. Da adesso vedete le stesse spese e lo stesso saldo.
          </IntestazioneIngresso>
          <div className="mt-6 flex -space-x-2">
            {nucleo.membri.map((m) => (
              <span key={m.id} className="rounded-full ring-2 ring-sfondo md:ring-superficie">
                <Iniziale nome={m.nome} persona={m.persona} dimensione="grande" />
              </span>
            ))}
          </div>
        </div>
        <LinkHome principale />
      </>
    );
  }

  const intestazioni = await headers();
  const host = intestazioni.get('x-forwarded-host') ?? intestazioni.get('host') ?? 'localhost:3000';
  const protocollo = intestazioni.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const link = linkInvito(`${protocollo}://${host}`, nucleo.codiceInvito);

  return (
    <>
      <div className="flex-1">
        <IntestazioneIngresso titolo={`Invita in ${nucleo.nome}`}>
          Manda questo link all’altra persona, su WhatsApp o per SMS. Lo apre, accede con Google ed entra nel nucleo.
        </IntestazioneIngresso>

        <div className="mt-6 rounded-card bg-superficie p-4 md:bg-superficie-2">
          <p className="text-nota text-testo-secondario">Link d’invito</p>
          <p className="importo mt-1 truncate text-corpo" title={link}>
            {linkInvitoAccorciato(link)}
          </p>
          <CondividiInvito link={link} nomeNucleo={nucleo.nome} />
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-card bg-superficie p-4 md:bg-superficie-2" role="status">
          <Iniziale nome={nucleo.io.nome} persona={nucleo.io.persona} />
          <span className="size-8 shrink-0 rounded-full border-2 border-dashed border-separatore" aria-hidden="true" />
          <p className="flex-1 text-sottotitolo">In attesa che l’altra persona entri</p>
          <AggiornaStato />
        </div>
      </div>
      <LinkHome />
    </>
  );
}

function LinkHome({ principale = false }: { principale?: boolean }) {
  return (
    <Link
      href="/"
      className={
        'mt-8 flex h-12.5 w-full items-center justify-center rounded-capsula text-intestazione outline-hidden active:opacity-80 ' +
        'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento ' +
        (principale ? 'bg-accento text-su-accento' : 'text-accento')
      }
    >
      {principale ? 'Vai alla Home' : 'Intanto vai alla Home'}
    </Link>
  );
}

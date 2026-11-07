import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BottoneGoogle, BottoneGoogleInAttesa } from './bottone-google';

export const metadata: Metadata = {
  title: 'Accesso · Nucleo',
};

// Tavola 01 dei wireframe v2.2 (US-01, D18): icona, nome, due righe,
// un solo pulsante nella metà bassa dello schermo e la nota sotto.
export default function PaginaAccesso() {
  return (
    <main className="flex min-h-dvh flex-col bg-linear-to-b from-accento-tenue/60 via-sfondo to-persona-b-tenue/50 px-4 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        {/* L'icona è decorativa: il nome dell'app è subito sotto */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" width={72} height={72} className="size-18 rounded-[1.1rem] shadow-lg shadow-accento/30" />
        <h1 className="mt-6 text-titolo-grande font-bold">Nucleo</h1>
        <p className="mt-2 text-corpo text-testo-secondario">
          Le spese di casa, divise in due.
          <br />
          Sempre chiaro chi deve cosa.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md">
        {/* useSearchParams richiede un Suspense con cacheComponents attivo */}
        <Suspense fallback={<BottoneGoogleInAttesa />}>
          <BottoneGoogle />
        </Suspense>
        <p className="mt-3 text-center text-nota text-testo-secondario">
          Niente password: usi il tuo account Google.
        </p>
      </div>
    </main>
  );
}

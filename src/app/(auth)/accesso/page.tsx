import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { BottoneGoogle, BottoneGoogleInAttesa } from './bottone-google';

export const metadata: Metadata = {
  title: 'Accesso · Dashboard di coppia',
};

// Schermata 1 dei wireframe (US-01): nome dell'app, una riga, un solo pulsante.
export default function PaginaAccesso() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-12">
      <div className="mt-16">
        <h1 className="text-4xl font-bold">Dashboard di coppia</h1>
        <p className="mt-3 text-lg text-testo-secondario">
          Le vostre spese comuni, e chi deve quanto a chi.
        </p>
      </div>

      {/* Il pulsante sta nella metà bassa dello schermo (uso a una mano) */}
      <div>
        {/* useSearchParams richiede un Suspense con cacheComponents attivo */}
        <Suspense fallback={<BottoneGoogleInAttesa />}>
          <BottoneGoogle />
        </Suspense>
        <p className="mt-6 text-center text-sm text-testo-secondario">
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
        </p>
      </div>
    </main>
  );
}

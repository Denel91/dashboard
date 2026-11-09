import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import type { ErroreNucleo } from '@/lib/nucleo/errori';
import { IntestazioneIngresso } from './intestazione';

// Tavola 16: i tre errori dell'invito, con un solo pulsante "Chiudi"
// (Progettazione 6.4). "Chiudi" porta all'inizio dell'app: chi non ha fatto
// l'accesso arriva alla pagina di accesso, chi è già dentro alla sua Home.
export function SchermataErroreNucleo({ errore }: { errore: ErroreNucleo }) {
  return (
    <>
      <div className="flex-1">
        <IntestazioneIngresso titolo={errore.titolo} />
        <p role="alert" className="mt-4 flex gap-3 rounded-card bg-superficie p-4 text-corpo md:bg-superficie-2">
          <TriangleAlert aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-testo-secondario" />
          {errore.testo}
        </p>
      </div>
      <Link
        href="/"
        className={
          'mt-8 flex h-12.5 w-full items-center justify-center rounded-capsula bg-accento-tenue text-intestazione text-accento ' +
          'outline-hidden active:opacity-80 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento'
        }
      >
        Chiudi
      </Link>
    </>
  );
}

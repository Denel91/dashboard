import type { ReactNode } from 'react';

// Parte alta delle schermate di ingresso: icona dell'app, titolo e testo,
// come nella pagina di accesso (tavola 01).
export function IntestazioneIngresso({ titolo, children }: { titolo: ReactNode; children?: ReactNode }) {
  return (
    <header>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" width={56} height={56} className="size-14 rounded-[0.9rem] shadow-lg shadow-accento/30" />
      <h1 className="mt-5 text-titolo-1 font-bold">{titolo}</h1>
      {children && <div className="mt-2 text-corpo text-testo-secondario">{children}</div>}
    </header>
  );
}

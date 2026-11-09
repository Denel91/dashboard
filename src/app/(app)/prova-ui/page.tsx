import type { Metadata } from 'next';
import {
  BarraInBasso,
  PulsanteDistruttivo,
  PulsantePrincipale,
  PulsanteSecondario,
  PulsanteTesto,
  SPAZIO_BARRA_IN_BASSO,
} from '@/components/ui';

// PAGINA DI PROVA TEMPORANEA (T-22): serve solo a guardare i componenti sul
// telefono, in chiaro e in scuro, per gli screenshot della PR.
// Va tolta prima del merge su main (è nel commit separato "da togliere").

export const metadata: Metadata = { title: 'Prova componenti · Nucleo' };

export default function ProvaUi() {
  return (
    <main className={`mx-auto w-full max-w-md px-4 pt-[max(1.5rem,env(safe-area-inset-top))] ${SPAZIO_BARRA_IN_BASSO}`}>
      <h1 className="text-titolo-grande font-bold">Componenti</h1>
      <p className="text-sottotitolo text-testo-secondario">T-22 · pagina di prova</p>

      <Sezione titolo="Pulsante principale">
        <PulsantePrincipale>Salva</PulsantePrincipale>
        <PulsantePrincipale isPending>Salvo…</PulsantePrincipale>
        <PulsantePrincipale isDisabled>Salva</PulsantePrincipale>
      </Sezione>

      <Sezione titolo="Pulsante secondario">
        <div className="flex flex-wrap gap-3">
          <PulsanteSecondario>Copia link</PulsanteSecondario>
          <PulsanteSecondario>Aggiungi categoria</PulsanteSecondario>
        </div>
      </Sezione>

      <Sezione titolo="Pulsante di testo">
        <div className="flex flex-wrap gap-3">
          <PulsanteTesto>Annulla</PulsanteTesto>
          <PulsanteTesto>Ripristina</PulsanteTesto>
        </div>
      </Sezione>

      <Sezione titolo="Azione distruttiva">
        <PulsanteDistruttivo>Elimina</PulsanteDistruttivo>
        <PulsanteDistruttivo variante="pieno">Cancella account</PulsanteDistruttivo>
      </Sezione>

      {/* Contenuto da far scorrere sotto il vetro */}
      <Sezione titolo="Contenuto sotto il vetro">
        {/* Classi scritte per intero: Tailwind non trova quelle composte */}
        <div className="h-24 w-full rounded-card bg-persona-a" />
        <div className="h-24 w-full rounded-card bg-persona-b" />
        <div className="h-24 w-full rounded-card bg-accento" />
        <div className="h-24 w-full rounded-card bg-testo" />
        <div className="h-24 w-full rounded-card bg-superficie" />
      </Sezione>

      <BarraInBasso />
    </main>
  );
}

function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-nota uppercase text-testo-secondario">{titolo}</h2>
      <div className="flex flex-col items-start gap-3">{children}</div>
    </section>
  );
}

import type { Metadata } from 'next';
import { ShoppingCart } from 'lucide-react';
import {
  BarraInBasso,
  Card,
  GruppoRighe,
  Iniziale,
  RegioneAvvisi,
  Riga,
  PulsanteDistruttivo,
  PulsantePrincipale,
  PulsanteSecondario,
  PulsanteTesto,
  SPAZIO_BARRA_IN_BASSO,
} from '@/components/ui';
import { ProvaAvviso, ProvaFoglio, ProvaFoglioControllato } from './dimostrazioni';

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

      <Sezione titolo="Card">
        <Card className="w-full">
          <p className="text-corpo">Totale di novembre</p>
          <p className="importo text-titolo-1 font-bold">1.234,56 €</p>
        </Card>
        <Card tono="persona-b" className="flex w-full items-center gap-3">
          <Iniziale nome="Simona" persona="b" dimensione="grande" decorativa />
          <p className="text-intestazione">
            Simona ti deve <span className="importo">23,40 €</span>
          </p>
        </Card>
        <Card tono="persona-a" className="flex w-full items-center gap-3">
          <Iniziale nome="Daniele" persona="a" dimensione="grande" decorativa />
          <p className="text-intestazione">
            Dovrai a Daniele <span className="importo">19,00 €</span>
          </p>
        </Card>
      </Sezione>

      <Sezione titolo="Iniziali">
        <div className="flex items-center gap-3">
          <Iniziale nome="Daniele" persona="a" dimensione="piccola" />
          <Iniziale nome="Simona" persona="b" dimensione="piccola" />
          <Iniziale nome="Daniele" persona="a" />
          <Iniziale nome="Simona" persona="b" />
          <Iniziale nome="Daniele" persona="a" dimensione="grande" />
          <Iniziale nome="Simona" persona="b" dimensione="grande" />
        </div>
      </Sezione>

      <div className="mt-8 flex w-full flex-col gap-6">
        <GruppoRighe titolo="Oggi · lunedì 9 novembre" nota="70,30 €">
          <Riga
            icona={<QuadratinoCategoria />}
            titolo="Esselunga"
            sottotitolo="Spesa · pagata da Daniele"
            valore={<span className="importo text-testo">47,30 €</span>}
            href="/prova-ui"
          />
          <Riga
            icona={<Iniziale nome="Simona" persona="b" />}
            titolo="Benzina"
            sottotitolo="Trasporti · per l’altra persona"
            valore={<span className="importo text-testo">23,00 €</span>}
            href="/prova-ui"
          />
        </GruppoRighe>
        <GruppoRighe titolo="Profilo">
          <Riga titolo="Il tuo nome" valore="Daniele" href="/prova-ui" />
          <Riga titolo="Account Google" sottotitolo="daniele@example.com" />
          <Riga titolo="Informativa sulla privacy" href="/prova-ui" />
        </GruppoRighe>
      </div>

      <Sezione titolo="Foglio dal basso e avviso">
        <ProvaFoglio />
        <ProvaFoglioControllato />
        <ProvaAvviso />
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
      <RegioneAvvisi />
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

// Icona di categoria provvisoria: il componente vero arriva con la prima
// storia che lo usa (sezione 3.1). Colore verde della tavolozza.
function QuadratinoCategoria() {
  return (
    <span className="flex size-7 items-center justify-center rounded-lg bg-[#299F47] text-white" aria-hidden="true">
      <ShoppingCart size={16} />
    </span>
  );
}

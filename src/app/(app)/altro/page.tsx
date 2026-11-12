import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { IconaVoceAltro } from '@/components/altro/icona-voce';
import { GruppoRighe, Riga } from '@/components/ui';
import { PAGINE_ALTRO_IN_ARRIVO } from '@/lib/altro';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';

export const metadata: Metadata = { title: 'Altro · Nucleo' };

// Altro (tavola 09, T-31): il menu con le cinque voci secondarie.
// Sul computer (da 1024 px) le stesse pagine sono già nella barra laterale
// (D23); questa pagina resta raggiungibile dall'indirizzo e dalla fascia md.
// I contatori di Cestino e Da riavere arrivano con quelle pagine (US-14,
// US-25/26).
export default function PaginaAltro() {
  return (
    <main className="flex w-full max-w-colonna flex-col gap-6 py-2">
      <Suspense fallback={<Intestazione />}>
        <IntestazioneDelNucleo />
      </Suspense>
      <GruppoRighe>
        {PAGINE_ALTRO_IN_ARRIVO.map((p) => (
          <Riga
            key={p.slug}
            href={`/altro/${p.slug}`}
            icona={<IconaVoceAltro voce={p.slug} colore={p.colore} />}
            titolo={p.titolo}
            sottotitolo={p.descrizione}
          />
        ))}
        <Riga
          href="/altro/impostazioni"
          icona={<IconaVoceAltro voce="impostazioni" colore="neutro" />}
          titolo="Impostazioni"
          sottotitolo="Profilo, nucleo e account"
        />
      </GruppoRighe>
    </main>
  );
}

function Intestazione({ nucleo }: { nucleo?: string }) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-titolo-grande font-bold">Altro</h1>
      <p className="min-h-5 text-sottotitolo text-testo-secondario">{nucleo}</p>
    </header>
  );
}

async function IntestazioneDelNucleo() {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) redirect('/benvenuto');
  return <Intestazione nucleo={nucleo.nome} />;
}

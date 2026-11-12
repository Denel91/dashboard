import { Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import {
  BarraInBasso,
  BarraLaterale,
  Iniziale,
  RegioneAvvisi,
  ScorciatoiaNuovaSpesa,
  SfondoSfumato,
  SPAZIO_BARRA_IN_BASSO,
  SPAZIO_BARRA_LATERALE,
} from '@/components/ui';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';

// Layout delle pagine dell'app (T-23, linee guida sezioni 9.1, 9.2 e 9.8):
// - telefono (< 768 px): barra in basso e ＋, una colonna con margini di 16 px;
// - md (768–1023 px): barra laterale compatta, una colonna larga al massimo 680 px;
// - lg (da 1024 px): barra laterale estesa e galleggiante, sfondo sfumato,
//   area del contenuto larga al massimo 1200 px, centrata.
// Un solo albero di componenti: decide solo la larghezza (sezione 9.1).
// Chi non fa ancora parte di un nucleo va a "Crea il vostro nucleo" (US-02).
export default function LayoutApp({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SfondoSfumato />
      {/* Legge la sessione e il nucleo: con cacheComponents va dentro Suspense */}
      <Suspense fallback={<BarraLaterale />}>
        <BarraLateraleDelNucleo />
      </Suspense>
      <div className={`flex-1 ${SPAZIO_BARRA_LATERALE}`}>
        <div
          className={
            'mx-auto w-full max-w-colonna px-4 pt-sicuro-6 md:px-6 ' +
            `lg:max-w-contenuto lg:px-8 lg:pt-8 ${SPAZIO_BARRA_IN_BASSO}`
          }
        >
          {children}
        </div>
      </div>
      <BarraInBasso />
      <RegioneAvvisi />
      <ScorciatoiaNuovaSpesa />
    </>
  );
}

/** Barra laterale con il nome del nucleo e, in fondo, il proprio profilo (iniziale, nome, account Google). */
async function BarraLateraleDelNucleo() {
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) redirect('/benvenuto');

  return (
    <BarraLaterale
      nomeNucleo={nucleo.nome}
      profilo={
        // Il profilo apre Impostazioni (linee guida sezione 9.2)
        <Link
          href="/altro/impostazioni"
          aria-label={`Impostazioni · ${nucleo.io.nome}, ${nucleo.email}`}
          className={
            'flex items-center gap-2 rounded-capsula bg-superficie/60 p-2 outline-hidden hover:bg-superficie-2/60 ' +
            'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento'
          }
        >
          {/* Le iniziali dei due, il proprio nome e l'email, poi … (tavole C1–C3) */}
          <span className="flex shrink-0 -space-x-2">
            {nucleo.membri.map((m) => (
              <span key={m.id} className="rounded-capsula ring-2 ring-superficie">
                <Iniziale nome={m.nome} persona={m.persona} decorativa />
              </span>
            ))}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sottotitolo">{nucleo.io.nome}</p>
            <p className="truncate text-didascalia">{nucleo.email}</p>
          </div>
          <Ellipsis aria-hidden="true" className="mr-1 size-4 shrink-0 text-testo-secondario" />
        </Link>
      }
    />
  );
}

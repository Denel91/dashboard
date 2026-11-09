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
            'mx-auto w-full max-w-[680px] px-4 pt-[max(1.5rem,env(safe-area-inset-top))] md:px-6 ' +
            `lg:max-w-[1200px] lg:px-8 lg:pt-8 ${SPAZIO_BARRA_IN_BASSO}`
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
        <div className="flex items-center gap-2 rounded-capsula bg-superficie/60 p-2">
          <Iniziale nome={nucleo.io.nome} persona={nucleo.io.persona} decorativa />
          <div className="min-w-0">
            <p className="truncate text-sottotitolo">{nucleo.io.nome}</p>
            <p className="truncate text-didascalia">{nucleo.email}</p>
          </div>
        </div>
      }
    />
  );
}

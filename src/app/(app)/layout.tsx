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
import { createClient } from '@/lib/supabase/server';

// Layout delle pagine dell'app (T-23, linee guida sezioni 9.1, 9.2 e 9.8):
// - telefono (< 768 px): barra in basso e ＋, una colonna con margini di 16 px;
// - md (768–1023 px): barra laterale compatta, una colonna larga al massimo 680 px;
// - lg (da 1024 px): barra laterale estesa e galleggiante, sfondo sfumato,
//   area del contenuto larga al massimo 1200 px, centrata.
// Un solo albero di componenti: decide solo la larghezza (sezione 9.1).
export default function LayoutApp({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SfondoSfumato />
      <BarraLaterale
        profilo={
          // Legge la sessione (cookie): con cacheComponents va dentro Suspense
          <Suspense fallback={<div className="h-14" />}>
            <ProfiloBarra />
          </Suspense>
        }
      />
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

/** Profilo in fondo alla barra estesa: iniziale, nome ed email dell'account Google. */
async function ProfiloBarra() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const nome = typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : (user.email ?? '');

  // Il colore della persona (a/b) dipende dall'ordine di ingresso nel nucleo:
  // finché il nucleo non c'è (US-02) si usa quello della prima persona.
  return (
    <div className="flex items-center gap-2 rounded-capsula bg-superficie/60 p-2">
      <Iniziale nome={nome} persona="a" decorativa />
      <div className="min-w-0">
        <p className="truncate text-sottotitolo">{nome}</p>
        <p className="truncate text-didascalia">{user.email}</p>
      </div>
    </div>
  );
}

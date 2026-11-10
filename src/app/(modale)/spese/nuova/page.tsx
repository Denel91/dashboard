import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { creaSpesa } from '@/app/actions/spese';
import { ModuloSpesa } from '@/components/spese/modulo-spesa';
import { oggiIso } from '@/lib/date';
import { destinazioneSicura } from '@/lib/destinazione';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Nuova spesa · Nucleo' };

// Nuova spesa (US-10, US-11, US-12; tavole 06 e C3). Il ＋, "＋ Nuova spesa"
// e il tasto N portano qui. `?da=/spese` dice dove tornare dopo (solo
// pagine interne, destinazioneSicura); senza, si torna alla Home.
export default function PaginaNuovaSpesa({ searchParams }: PageProps<'/spese/nuova'>) {
  return (
    <Suspense fallback={<div className="min-h-dvh md:min-h-[640px]" />}>
      <Contenuto searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenuto({ searchParams }: Pick<PageProps<'/spese/nuova'>, 'searchParams'>) {
  await connection();
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) redirect('/benvenuto');

  const da = (await searchParams).da;
  const dopo = destinazioneSicura(typeof da === 'string' ? da : null);

  const supabase = await createClient();
  const { data: categorie, error } = await supabase
    .from('categorie')
    .select('id, nome, icona')
    .eq('nucleo_id', nucleo.id)
    .is('data_archiviazione', null)
    .order('ordine');
  if (error) {
    console.error('[spese] lettura delle categorie non riuscita', error.code, error.message);
    throw new Error('Lettura delle categorie non riuscita');
  }

  return (
    <ModuloSpesa
      azione={creaSpesa}
      titolo="Nuova spesa"
      membri={nucleo.membri}
      io={nucleo.io}
      categorie={categorie}
      oggi={oggiIso(new Date())}
      dopo={dopo}
    />
  );
}

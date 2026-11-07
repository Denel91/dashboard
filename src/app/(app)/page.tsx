import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { esci } from '@/app/actions/accesso';
import { createClient } from '@/lib/supabase/server';

// Home PROVVISORIA (US-01): serve solo a provare l'accesso.
// Con US-02 diventa "crea il nucleo / entra nel nucleo", poi la Home vera
// con saldo e mese (Sprint 4 e 7).
export default function Home() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      {/* Legge la sessione (cookie): con cacheComponents va dentro Suspense */}
      <Suspense fallback={<p className="text-testo-secondario">Caricamento…</p>}>
        <Benvenuto />
      </Suspense>
    </main>
  );
}

async function Benvenuto() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/accesso');

  const nome = typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : '';

  return (
    <>
      <h1 className="text-3xl font-bold">Ciao{nome ? ` ${nome}` : ''}!</h1>
      <p className="mt-2 text-testo-secondario">
        Sei entrato con l’account Google <strong className="text-testo">{user.email}</strong>.
      </p>
      <form action={esci} className="mt-10">
        <button
          type="submit"
          className="w-full rounded-campo bg-superficie px-6 py-4 font-semibold text-testo"
        >
          Esci
        </button>
      </form>
    </>
  );
}

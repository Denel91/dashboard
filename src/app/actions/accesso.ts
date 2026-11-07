'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Esci: chiude la sessione su questo dispositivo e torna alla pagina di accesso. */
export async function esci() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/accesso');
}

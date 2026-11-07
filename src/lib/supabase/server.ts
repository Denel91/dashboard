import { createServerClient } from '@supabase/ssr';
import { io } from 'next/cache';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

/**
 * Client Supabase per Server Components, Server Actions e Route Handlers.
 * Usa la sessione dell'utente (cookie): la RLS vede chi è collegato.
 * Va creato a ogni richiesta, mai condiviso.
 */
export async function createClient() {
  const cookieStore = await cookies();
  // La libreria di Supabase legge l'ora (Date.now) per capire se la sessione
  // è scaduta. Con cacheComponents l'ora non può finire nella parte di pagina
  // preparata in anticipo: io() dice a Next.js che da qui in poi si lavora
  // solo durante la richiesta vera. Durante la richiesta non rallenta nulla.
  await io();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chiamato da un Server Component, che non può scrivere cookie:
            // la sessione la rinnova comunque src/proxy.ts a ogni richiesta.
          }
        },
      },
    },
  );
}

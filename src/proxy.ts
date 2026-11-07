import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy (Next.js 16, ex middleware): gira prima di ogni pagina.
 *   1. rinnova la sessione Supabase quando sta per scadere (cookie);
 *   2. manda alla pagina di accesso chi non ha fatto l'accesso;
 *   3. manda alla Home chi apre /accesso essendo già dentro.
 * È una comodità per l'utente, non la sicurezza: i dati li protegge la RLS.
 */

// Pagine aperte anche senza accesso
const PAGINE_PUBBLICHE = ['/accesso', '/auth/callback', '/privacy'];
const PREFISSI_PUBBLICI = ['/invito/']; // anteprima dell'invito (D14)

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Le risposte che scrivono la sessione non vanno messe in cache
          Object.entries(headers).forEach(([chiave, valore]) =>
            response.headers.set(chiave, valore),
          );
        },
      },
    },
  );

  // Nessun codice tra createServerClient e getClaims: getClaims verifica il
  // token e, se serve, lo rinnova scrivendo i nuovi cookie in `response`.
  const { data } = await supabase.auth.getClaims();
  const collegato = Boolean(data?.claims);

  const { pathname, search } = request.nextUrl;
  const pubblica =
    PAGINE_PUBBLICHE.includes(pathname) || PREFISSI_PUBBLICI.some((p) => pathname.startsWith(p));

  if (!collegato && !pubblica) {
    const destinazione = new URL('/accesso', request.url);
    if (pathname !== '/') destinazione.searchParams.set('next', pathname + search);
    return reindirizza(destinazione, response);
  }

  if (collegato && pathname === '/accesso') {
    return reindirizza(new URL('/', request.url), response);
  }

  return response;
}

/** Redirect che si porta dietro gli eventuali cookie di sessione appena rinnovati. */
function reindirizza(url: URL, daCopiare: NextResponse) {
  const redirect = NextResponse.redirect(url);
  daCopiare.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  daCopiare.headers.forEach((valore, chiave) => {
    if (chiave !== 'location' && chiave !== 'set-cookie') redirect.headers.set(chiave, valore);
  });
  return redirect;
}

export const config = {
  // Tutto tranne file statici e immagini
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
};

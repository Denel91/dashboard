import { NextResponse, type NextRequest } from 'next/server';
import { destinazioneSicura } from '@/lib/destinazione';
import { createClient } from '@/lib/supabase/server';

/**
 * Ritorno da Google. Supabase rimanda qui con ?code=…: lo si scambia con
 * la sessione (cookie) e si prosegue verso ?next= oppure la Home.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = destinazioneSicura(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Accesso annullato su Google, codice scaduto o già usato
  return NextResponse.redirect(new URL('/accesso?errore=accesso', origin));
}

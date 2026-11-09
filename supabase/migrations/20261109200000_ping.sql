-- =====================================================================
-- Ping contro la pausa per inattività (T-20) · 9 novembre 2026
--
-- Supabase Free mette in pausa il progetto dopo una settimana senza
-- attività. Un cron di Vercel chiama ogni giorno /api/ping, che chiama
-- questa funzione con la chiave publishable e senza sessione (ruolo anon).
--
-- La funzione fa una query vera su una tabella, ma restituisce sempre
-- true: non rivela niente, nemmeno se esiste un nucleo.
-- security definer perché anon non può leggere nuclei (RLS e permessi).
-- =====================================================================

create function public.ping()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select count(*) >= 0 from public.nuclei
$$;

comment on function public.ping() is
  'Tiene sveglio il progetto Supabase (T-20): fa una query su nuclei e restituisce sempre true. Chiamata ogni giorno dal cron di Vercel.';

-- Permessi espliciti (Fase 3, sezione 4): solo i ruoli dell'API
revoke execute on function public.ping() from public;
grant  execute on function public.ping() to anon, authenticated, service_role;

-- =====================================================================
-- T-20 · Test 6 — Ping contro la pausa per inattività
--
-- Chi non ha fatto l'accesso (anon, come il cron di Vercel) può chiamare
-- ping(), che risponde sempre true e non apre nessuna lettura diretta.
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

select is(
  (select prosecdef from pg_proc where oid = 'public.ping()'::regprocedure),
  true,
  'ping() è security definer');

select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.ping()'::regprocedure),
  'ping() ha search_path vuoto');

set local role anon;

select is(public.ping(), true, 'anon può chiamare ping() e riceve true');

select is_empty(
  $$ select id from public.nuclei $$,
  'anon continua a non leggere i nuclei');

select * from finish();
rollback;

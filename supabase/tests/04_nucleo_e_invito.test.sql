-- =====================================================================
-- T-11 · Test 4 — Nucleo e invito (US-02, D12, D14)
--
-- Il percorso vero dell'app, con le funzioni RPC:
--   A crea il nucleo → chi apre il link vede l'anteprima senza accesso →
--   B entra con il link → C, terzo, trova il nucleo completo.
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.it'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.it'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.it');

-- ---------------------------------------------------------------------
-- A crea il nucleo
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}';

select isnt(public.crea_nucleo('Daniele'), null, 'A crea il nucleo');

select throws_ok(
  $$ select public.crea_nucleo('Daniele') $$,
  'P0003', null,
  'A non può creare un secondo nucleo');

select is(
  (select length(codice_invito) from public.nuclei),
  32,
  'Il codice d''invito ha 32 caratteri casuali');

with rinominati as (
  update public.nuclei set nome = 'Casa D&S' returning 1
)
select is(count(*)::int, 1, 'A può rinominare il nucleo') from rinominati;

-- Codice fisso, per usarlo negli inviti qui sotto (come postgres)
reset role;
update public.nuclei set codice_invito = 'codice-test';

-- ---------------------------------------------------------------------
-- Chi apre il link senza accesso (anon)
-- ---------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select results_eq(
  $$ select * from public.anteprima_invito('codice-test') $$,
  $$ values ('Casa D&S'::text, 'Daniele'::text, false) $$,
  'Senza accesso l''anteprima mostra il nucleo e chi invita (D14)');

select is_empty(
  $$ select * from public.anteprima_invito('codice-sbagliato') $$,
  'Con un codice sbagliato l''anteprima non restituisce nulla (P0002)');

select throws_ok(
  $$ select public.entra_nel_nucleo('codice-test', 'Intruso') $$,
  '42501', null,
  'Senza accesso non si entra nel nucleo');

select throws_ok(
  $$ select public.crea_nucleo('Intruso') $$,
  '42501', null,
  'Senza accesso non si crea un nucleo');

-- ---------------------------------------------------------------------
-- B entra con il link
-- ---------------------------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000000","role":"authenticated"}';

select throws_ok(
  $$ select public.entra_nel_nucleo('codice-sbagliato', 'Simona') $$,
  'P0002', null,
  'Con un codice sbagliato: "Invito non valido"');

select lives_ok(
  $$ select public.entra_nel_nucleo('codice-test', 'Simona') $$,
  'B entra nel nucleo con il link');

select is(
  public.entra_nel_nucleo('codice-test', 'Simona'),
  (select id from public.nuclei),
  'Se B riapre il link, entra di nuovo senza errori');

select is(
  (select array_agg(nome_visualizzato order by data_ingresso, nome_visualizzato) from public.membri),
  array['Daniele', 'Simona'],
  'B vede i due membri del nucleo');

select throws_ok(
  $$ insert into public.membri (nucleo_id, utente_id, nome_visualizzato)
     select id, 'cccccccc-0000-0000-0000-000000000000', 'Terzo' from public.nuclei $$,
  '42501', null,
  'Non si aggiungono membri a mano: solo con le funzioni (D12)');

select throws_ok(
  $$ update public.nuclei set codice_invito = 'scelto-da-me' $$,
  '42501', null,
  'Il codice d''invito non si cambia dal client');

-- ---------------------------------------------------------------------
-- C, terzo, con il nucleo ormai completo
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-000000000000","role":"authenticated"}';

select throws_ok(
  $$ select public.entra_nel_nucleo('codice-test', 'Terzo') $$,
  'P0001', null,
  'Con due membri il nucleo è completo: C non entra (US-02)');

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select results_eq(
  $$ select * from public.anteprima_invito('codice-test') $$,
  $$ values (null::text, null::text, true) $$,
  'Con il nucleo completo l''anteprima dice solo "completo" e nasconde i nomi');

select * from finish();
rollback;

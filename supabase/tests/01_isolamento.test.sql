-- =====================================================================
-- T-11 · Test 1 — Isolamento tra nuclei (NF-05)
-- Chi non è membro di un nucleo non vede e non modifica nulla.
--
-- Persone di prova:
--   A (Daniele) e B (Simona) → nucleo N1
--   C (estraneo)             → nucleo N2
--
-- Tutto gira dentro una transazione chiusa da ROLLBACK:
-- il database locale resta pulito dopo ogni esecuzione.
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- ---------------------------------------------------------------------
-- Dati di prova (come postgres: scavalca RLS e permessi)
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'a@test.it'),
  ('bbbbbbbb-0000-0000-0000-000000000000', 'b@test.it'),
  ('cccccccc-0000-0000-0000-000000000000', 'c@test.it');

insert into public.nuclei (id, nome, codice_invito) values
  ('11111111-0000-0000-0000-000000000000', 'Casa nostra', 'codice-n1'),
  ('22222222-0000-0000-0000-000000000000', 'Casa di C',   'codice-n2');

insert into public.membri (id, nucleo_id, utente_id, nome_visualizzato) values
  ('a0000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000',
   'aaaaaaaa-0000-0000-0000-000000000000', 'Daniele'),
  ('b0000000-0000-0000-0000-000000000000', '11111111-0000-0000-0000-000000000000',
   'bbbbbbbb-0000-0000-0000-000000000000', 'Simona'),
  ('c0000000-0000-0000-0000-000000000000', '22222222-0000-0000-0000-000000000000',
   'cccccccc-0000-0000-0000-000000000000', 'Estraneo');

insert into public.spese (nucleo_id, pagata_da, importo_centesimi, descrizione) values
  ('11111111-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000',
   4730, 'Esselunga');

-- ---------------------------------------------------------------------
-- Come C, l'estraneo
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-000000000000","role":"authenticated"}';

select is_empty(
  $$ select 1 from public.nuclei where id = '11111111-0000-0000-0000-000000000000' $$,
  'C non vede il nucleo di A e B');

select is_empty(
  $$ select 1 from public.membri where nucleo_id = '11111111-0000-0000-0000-000000000000' $$,
  'C non vede i membri del nucleo di A e B');

select is_empty(
  $$ select 1 from public.spese where nucleo_id = '11111111-0000-0000-0000-000000000000' $$,
  'C non vede le spese del nucleo di A e B');

select is_empty(
  $$ select 1 from public.cronologia where nucleo_id = '11111111-0000-0000-0000-000000000000' $$,
  'C non vede la cronologia del nucleo di A e B');

select is_empty(
  $$ select 1 from public.saldi where nucleo_id = '11111111-0000-0000-0000-000000000000' $$,
  'C non vede i saldi del nucleo di A e B (vista security_invoker)');

select throws_ok(
  $$ insert into public.spese (nucleo_id, pagata_da, importo_centesimi)
     values ('11111111-0000-0000-0000-000000000000',
             'a0000000-0000-0000-0000-000000000000', 1000) $$,
  '42501', null,
  'C non può inserire una spesa nel nucleo di A e B');

with modificate as (
  update public.spese set note = 'manomessa'
  where nucleo_id = '11111111-0000-0000-0000-000000000000'
  returning 1
)
select is(count(*)::int, 0, 'C non può modificare le spese del nucleo di A e B')
from modificate;

select throws_ok(
  $$ update public.membri set nucleo_id = '11111111-0000-0000-0000-000000000000'
     where id = 'c0000000-0000-0000-0000-000000000000' $$,
  '42501', null,
  'C non può spostarsi nel nucleo di A e B (permessi per colonna)');

select throws_ok(
  $$ select public.entra_nel_nucleo('codice-n1', 'Estraneo') $$,
  'P0003', null,
  'C non può entrare in un altro nucleo mentre è già in uno');

-- ---------------------------------------------------------------------
-- Come A, membro del nucleo
-- ---------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000000","role":"authenticated"}';

select is(
  (select count(*)::int from public.spese
   where nucleo_id = '11111111-0000-0000-0000-000000000000' and note is null),
  1,
  'A vede la sua spesa, e la modifica tentata da C non è passata');

select is(
  (select count(*)::int from public.membri),
  2,
  'A vede solo i due membri del proprio nucleo, non C');

-- ---------------------------------------------------------------------
-- Senza accesso (anon)
-- ---------------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select is_empty(
  $$ select 1 from public.spese $$,
  'Senza accesso non si vede nessuna spesa');

select * from finish();
rollback;

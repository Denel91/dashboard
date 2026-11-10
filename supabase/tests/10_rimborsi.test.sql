-- =====================================================================
-- US-31 · US-32 · US-33 — registra_rimborso() e annulla_rimborso()
--
-- A (Daniele) e B (Simona) nel nucleo N1; C (Carla) da sola nel nucleo N2.
-- A paga 46,80 € a metà: Simona deve 23,40 € a Daniele (saldo di A +2340).
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'a10@test.it'),
  ('bbbbbbbb-0000-0000-0000-00000000000a', 'b10@test.it'),
  ('cccccccc-0000-0000-0000-00000000000a', 'c10@test.it');
insert into public.nuclei (id, nome, codice_invito) values
  ('1a000000-0000-0000-0000-000000000000', 'Casa nostra', 'codice-10a'),
  ('2a000000-0000-0000-0000-000000000000', 'Casa di Carla', 'codice-10b');
insert into public.membri (id, nucleo_id, utente_id, nome_visualizzato) values
  ('aa000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-00000000000a', 'Daniele'),
  ('bb000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-00000000000a', 'Simona'),
  ('cc000000-0000-0000-0000-000000000000', '2a000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-00000000000a', 'Carla');

-- 1–2: permessi delle funzioni
select ok(not has_function_privilege('anon', 'public.registra_rimborso(uuid, bigint, bigint, date, text)', 'execute'),
          'anon non può registrare rimborsi');
select ok(has_function_privilege('authenticated', 'public.annulla_rimborso(uuid)', 'execute'),
          'authenticated può annullare un rimborso');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, data_spesa)
values ('1a000000-0000-0000-0000-000000000000', 'aa000000-0000-0000-0000-000000000000', 4680, '2026-11-05');

-- Da qui è collegata Simona, che deve 23,40 € e vede il saldo −2340
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-00000000000a","role":"authenticated"}';

-- 3–5: importi non validi (P0006) e saldo che non è più quello visto (P0004)
select throws_ok(
  $$ select public.registra_rimborso('1a000000-0000-0000-0000-000000000000', 2341, -2340, '2026-11-10') $$,
  'P0006', null, 'non si rimborsa più del saldo');
select throws_ok(
  $$ select public.registra_rimborso('1a000000-0000-0000-0000-000000000000', 0, -2340, '2026-11-10') $$,
  'P0006', null, 'non si rimborsa zero');
select throws_ok(
  $$ select public.registra_rimborso('1a000000-0000-0000-0000-000000000000', 2340, -1000, '2026-11-10') $$,
  'P0004', null, 'se il saldo visto non è quello vero, non si registra niente');

-- 6–9: rimborso parziale di 10,00 € registrato da chi deve (US-32)
select lives_ok(
  $$ select public.registra_rimborso('1a000000-0000-0000-0000-000000000000', 1000, -2340, '2026-11-10', '  Bonifico ') $$,
  'Simona registra un rimborso parziale di 10,00 €');
select results_eq(
  $$ select da_membro, a_membro, importo_centesimi, nota, autore from public.rimborsi
     where nucleo_id = '1a000000-0000-0000-0000-000000000000' $$,
  $$ values ('bb000000-0000-0000-0000-000000000000'::uuid, 'aa000000-0000-0000-0000-000000000000'::uuid,
             1000::bigint, 'Bonifico'::text, 'bb000000-0000-0000-0000-000000000000'::uuid) $$,
  'il database sceglie chi dà (Simona) e chi riceve (Daniele); nota ripulita, autore Simona');
select is((select saldo_centesimi::bigint from public.saldi where membro_id = 'bb000000-0000-0000-0000-000000000000'),
          -1340::bigint, 'Simona deve ancora 13,40 €');
select is((select count(*)::int from public.cronologia where tabella = 'rimborsi' and azione = 'creazione'),
          1, 'la cronologia registra il rimborso');

-- 10: lo stesso tocco ripetuto (o Daniele nello stesso momento) con il saldo vecchio
select throws_ok(
  $$ select public.registra_rimborso('1a000000-0000-0000-0000-000000000000', 2340, -2340, '2026-11-10') $$,
  'P0004', null, 'un secondo "Segna come saldato" con il saldo vecchio non passa');

-- 11–13: Daniele, che riceve, segna come saldato il resto (US-31)
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000a","role":"authenticated"}';
select lives_ok(
  $$ select public.registra_rimborso('1a000000-0000-0000-0000-000000000000', 1340, 1340, '2026-11-10') $$,
  'Daniele segna come saldato i 13,40 € rimasti');
select is((select saldo_centesimi::bigint from public.saldi where membro_id = 'aa000000-0000-0000-0000-000000000000'),
          0::bigint, 'in pari');
select is((select da_membro from public.rimborsi where importo_centesimi = 1340),
          'bb000000-0000-0000-0000-000000000000'::uuid, 'anche registrato da Daniele, i soldi li dà Simona');

-- 14: in pari non c'è niente da saldare
select throws_ok(
  $$ select public.registra_rimborso('1a000000-0000-0000-0000-000000000000', 100, 0, '2026-11-10') $$,
  'P0005', null, 'in pari non si registra un rimborso');

-- 15–19: annullare il rimborso di 10,00 € (US-33)
select is((select public.annulla_rimborso(id) from public.rimborsi where importo_centesimi = 1000),
          true, 'il rimborso si annulla');
select is((select saldo_centesimi::bigint from public.saldi where membro_id = 'aa000000-0000-0000-0000-000000000000'),
          1000::bigint, 'non conta più: Simona deve di nuovo 10,00 €');
select is((select public.annulla_rimborso(id) from public.rimborsi where importo_centesimi = 1000),
          false, 'annullarlo di nuovo non cambia niente');
select is((select count(*)::int from public.rimborsi where importo_centesimi = 1000 and data_eliminazione is not null),
          1, 'resta in elenco, annullato');
select is((select count(*)::int from public.cronologia where tabella = 'rimborsi' and azione = 'eliminazione'),
          1, 'l’annullamento compare una volta nella cronologia');

-- 20–22: Carla, da sola e di un altro nucleo. L'id di un rimborso di N1
-- lo prendiamo prima, perché Carla non lo vede
create temporary table rimborso_altrui on commit drop as
  select id from public.rimborsi where importo_centesimi = 1340;
set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-00000000000a","role":"authenticated"}';
select throws_ok(
  $$ select public.registra_rimborso('2a000000-0000-0000-0000-000000000000', 100, 0, '2026-11-10') $$,
  'P0007', null, 'da sola non c’è a chi rimborsare');
select throws_ok(
  $$ select public.registra_rimborso('1a000000-0000-0000-0000-000000000000', 100, 1000, '2026-11-10') $$,
  '42501', null, 'non si registrano rimborsi in un nucleo altrui');
select throws_ok(
  $$ select public.annulla_rimborso((select id from rimborso_altrui)) $$,
  'P0008', null, 'i rimborsi degli altri nuclei non si vedono e non si annullano');

select * from finish();
rollback;

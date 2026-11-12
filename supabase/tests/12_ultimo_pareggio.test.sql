-- =====================================================================
-- Test 12 — Ultimo pareggio per la Home sul computer (C1, D26)
--
-- A (Daniele) e B (Simona) nel nucleo N1; C (Carla) da sola in N2.
-- Saldo di Daniele passo per passo (positivo = Simona gli deve):
--   01/10 Daniele paga 10,00 € a metà          → +500
--   05/10 Simona rimborsa 3,00 € (parziale)     → +200   non è un pareggio
--   10/10 Simona paga 4,00 € a metà             →    0   pareggio (con una spesa)
--   20/10 Simona paga 10,00 € a metà            → −500
--   28/10 Daniele rimborsa 5,00 €               →    0   pareggio
--   02/11 Daniele paga 20,00 € a metà           → +1000
--   03/11 Daniele paga 6,00 € a metà            → +1300
--   04/11 Simona paga 4,00 € a metà             → +1100
-- Più un anticipo per Marco e una spesa nel Cestino, che non contano.
-- =====================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000c', 'a12@test.it'),
  ('bbbbbbbb-0000-0000-0000-00000000000c', 'b12@test.it'),
  ('cccccccc-0000-0000-0000-00000000000c', 'c12@test.it');
insert into public.nuclei (id, nome, codice_invito) values
  ('1c000000-0000-0000-0000-000000000000', 'Casa nostra', 'codice-12a'),
  ('2c000000-0000-0000-0000-000000000000', 'Casa di Carla', 'codice-12b');
insert into public.membri (id, nucleo_id, utente_id, nome_visualizzato) values
  ('ac000000-0000-0000-0000-000000000000', '1c000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-00000000000c', 'Daniele'),
  ('bd000000-0000-0000-0000-000000000000', '1c000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-00000000000c', 'Simona'),
  ('cd000000-0000-0000-0000-000000000000', '2c000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-00000000000c', 'Carla');

-- 1: permessi
select ok(not has_function_privilege('anon', 'public.ultimo_pareggio(uuid)', 'execute'),
  'anon non chiama ultimo_pareggio()');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000c","role":"authenticated"}';

-- 2: senza spese né rimborsi
select results_eq(
  $$ select * from public.ultimo_pareggio('1c000000-0000-0000-0000-000000000000') $$,
  $$ values (null::date, 0, 0) $$,
  'nucleo nuovo: nessun pareggio e nessuna spesa');

insert into public.spese (nucleo_id, pagata_da, importo_centesimi, data_spesa) values
  ('1c000000-0000-0000-0000-000000000000', 'ac000000-0000-0000-0000-000000000000', 1000, '2026-10-01');
insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi, data_rimborso) values
  ('1c000000-0000-0000-0000-000000000000', 'bd000000-0000-0000-0000-000000000000', 'ac000000-0000-0000-0000-000000000000', 300, '2026-10-05');

-- 3: un rimborso parziale non è un pareggio
select results_eq(
  $$ select * from public.ultimo_pareggio('1c000000-0000-0000-0000-000000000000') $$,
  $$ values (null::date, 1, 0) $$,
  'dopo un rimborso parziale non c''è ancora un pareggio');

insert into public.spese (nucleo_id, pagata_da, importo_centesimi, data_spesa) values
  ('1c000000-0000-0000-0000-000000000000', 'bd000000-0000-0000-0000-000000000000', 400, '2026-10-10'),
  ('1c000000-0000-0000-0000-000000000000', 'bd000000-0000-0000-0000-000000000000', 1000, '2026-10-20');
insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi, data_rimborso) values
  ('1c000000-0000-0000-0000-000000000000', 'ac000000-0000-0000-0000-000000000000', 'bd000000-0000-0000-0000-000000000000', 500, '2026-10-28');
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, data_spesa) values
  ('1c000000-0000-0000-0000-000000000000', 'ac000000-0000-0000-0000-000000000000', 2000, '2026-11-02'),
  ('1c000000-0000-0000-0000-000000000000', 'ac000000-0000-0000-0000-000000000000', 600, '2026-11-03'),
  ('1c000000-0000-0000-0000-000000000000', 'bd000000-0000-0000-0000-000000000000', 400, '2026-11-04');
-- Non contano: un anticipo per Marco e una spesa nel Cestino
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, data_spesa, terza_persona) values
  ('1c000000-0000-0000-0000-000000000000', 'ac000000-0000-0000-0000-000000000000', 3000, '2026-11-05', 'Marco');
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, data_spesa, descrizione) values
  ('1c000000-0000-0000-0000-000000000000', 'bd000000-0000-0000-0000-000000000000', 800, '2026-11-05', 'Nel Cestino');
update public.spese set data_eliminazione = now() where descrizione = 'Nel Cestino';

-- 4–5: dal punto di vista di Daniele
select results_eq(
  $$ select * from public.ultimo_pareggio('1c000000-0000-0000-0000-000000000000') $$,
  $$ values ('2026-10-28'::date, 2, 1) $$,
  'Daniele: dall''ultimo pareggio del 28 ottobre, 2 spese sue e 1 di Simona');
select is((select saldo_centesimi::int from public.saldi where membro_id = 'ac000000-0000-0000-0000-000000000000'),
  1100, 'il saldo della vista coincide con quello seguito passo per passo (+11,00 €)');

-- 6: un rimborso parziale dopo il pareggio non lo sposta
insert into public.rimborsi (nucleo_id, da_membro, a_membro, importo_centesimi, data_rimborso) values
  ('1c000000-0000-0000-0000-000000000000', 'bd000000-0000-0000-0000-000000000000', 'ac000000-0000-0000-0000-000000000000', 100, '2026-11-06');
select results_eq(
  $$ select * from public.ultimo_pareggio('1c000000-0000-0000-0000-000000000000') $$,
  $$ values ('2026-10-28'::date, 2, 1) $$,
  'il rimborso parziale del 6 novembre non è un pareggio');

-- 7: dal punto di vista di Simona i conteggi si scambiano
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-00000000000c","role":"authenticated"}';
select results_eq(
  $$ select * from public.ultimo_pareggio('1c000000-0000-0000-0000-000000000000') $$,
  $$ values ('2026-10-28'::date, 1, 2) $$,
  'Simona: 1 spesa sua e 2 di Daniele');

-- 8: annullato il rimborso del 28 ottobre, il pareggio torna al 10 ottobre
update public.rimborsi set data_eliminazione = now()
where nucleo_id = '1c000000-0000-0000-0000-000000000000' and data_rimborso = '2026-10-28';
select results_eq(
  $$ select * from public.ultimo_pareggio('1c000000-0000-0000-0000-000000000000') $$,
  $$ values ('2026-10-10'::date, 2, 2) $$,
  'senza il rimborso annullato, l''ultimo pareggio è la spesa del 10 ottobre');

-- 9: una spesa registrata oggi ma con la data di prima del pareggio lo sposta
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, data_spesa) values
  ('1c000000-0000-0000-0000-000000000000', 'bd000000-0000-0000-0000-000000000000', 200, '2026-10-07');
select results_eq(
  $$ select * from public.ultimo_pareggio('1c000000-0000-0000-0000-000000000000') $$,
  $$ values (null::date, 4, 3) $$,
  'con una spesa del 7 ottobre il saldo non torna più a zero: si conta da quando avete iniziato');

-- 10: tutte le spese contate, anche oltre le 1000 righe delle API
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-00000000000c","role":"authenticated"}';
insert into public.spese (nucleo_id, pagata_da, importo_centesimi, data_spesa)
select '1c000000-0000-0000-0000-000000000000', 'ac000000-0000-0000-0000-000000000000', 100, '2026-11-10'
from generate_series(1, 1200);
select is((select spese_mie from public.ultimo_pareggio('1c000000-0000-0000-0000-000000000000')),
  1203, 'conta 1203 spese di Daniele: nessun limite di righe');

-- 11–12: chi non è del nucleo
set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-00000000000c","role":"authenticated"}';
select throws_ok(
  $$ select * from public.ultimo_pareggio('1c000000-0000-0000-0000-000000000000') $$,
  '42501', null, 'Carla non legge il pareggio di un altro nucleo');
select results_eq(
  $$ select * from public.ultimo_pareggio('2c000000-0000-0000-0000-000000000000') $$,
  $$ values (null::date, 0, 0) $$,
  'Carla, da sola, non ha pareggi né spese');

select * from finish();
rollback;
